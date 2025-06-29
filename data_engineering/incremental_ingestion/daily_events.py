import os
import requests
from bs4 import BeautifulSoup
import json
import re
from transformers import pipeline
from openai import OpenAI
from supabase import create_client, Client

openrouter_base_url = os.getenv("OPENROUTER_BASE_URL")
openrouter_api_key = os.getenv("OPENROUTER_API_KEY")
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
web_url = os.getenv("WEB_URL")

classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")
client = OpenAI(
  base_url=openrouter_base_url,
  api_key=openrouter_api_key,
)

# labels for bart model
labels = {
    "A bombing or explosion occurred": "Explosions / Remote violence",
    "A military or armed battle happened": "Battles",
    "A military strategic decision or deployment occurred": "Strategic developments",
    "Civilians were attacked or harmed and related to army and terrorist": "Violence against civilians",
    "This is not related to violence or military events": "Other"
}

# Filter relevent articles based on headline
event_kw = {
    # India-specific geo and actor context
    "india_context" : [
        "india", "indian", "jammu", "kashmir", "ladakh", "manipur", "pulwama", "uri","delhi",
        "shopian", "baramulla", "srinagar", "poonch", "northeast","kulgam","jammu",
        "bsf", "crpf", "iaf", "drdo","isro", "rashtriya rifles", "loc", "lac", "modi"
    ],

    # Strategic Developments 
    "strategic" : [
        "deployment", "military exercise", "war game", "missile test", "satellite launch",
        "defense deal", "arms procurement", "strategic partnership", "drdo",
        "joint drill", "air defence", "naval exercise", "border monitoring", "spy satellite","evacuation", 
        "emabssy","launched","ceasefire", "coastal","coastal security","coastal deployment", "security"
    ],

    #  Battles
    "battle" : [
        "firing", "gunfire", "skirmish", "encounter", "cross-border", "ambush", "mortar shelling",
        "sniper fire", "air strike", "surgical strike", "border clash","army","air force","navy", 
        "coast guard"
    ],

    # Explosions / Remote Violence 
    "explosion" : [
        "blast", "ied", "explosion", "bomb", "grenade attack", "remote detonation",
        "landmine", "sabotage"
    ],

    # Violence Against Civilians
    "civilian" : [
        "civilian killed", "villager killed", "innocent killed", "bystander", "mob lynching",
        "school attacked", "massacre", "hostage", "student killed", "bus attacked"
    ],
    "military_or_terror_link" : [
        "terrorist", "militant", "naxal", "maoist", "encounter", "crpf", "bsf", "army", "jawan"
    ]
}

event_kwd_map = {
    "Strategic developments": "strategic",
    "Battles": "battle",
    "Explosions / Remote violence":"explosion",
    "Violence against civilians": "civilian"                       
}


def classify_india_event(article_text: str, is_national:False) -> str | None:
    text = set(article_text.lower().split())
    
    if any(k in text for k in event_kw["strategic"]) and (is_national or any(c in text for c in event_kw["india_context"])):
        return "Strategic developments"

    if any(k in text for k in event_kw["battle"]) and (is_national or any(c in text for c in event_kw["india_context"])):
        return "Battles"

    if any(k in text for k in event_kw["explosion"]) and (is_national or any(c in text for c in event_kw["india_context"])):
        return "Explosions / Remote violence"

    if any(k in text for k in event_kw["civilian"]) and any(c in text for c in event_kw["military_or_terror_link"]):
        return "Violence against civilians"

    return None  # No relevant Indian military event found


def getLatestHeadlines():
    links = []
    try:
        for page in range(0, 15):
            response = requests.get(web_url + str(page))
            soup = BeautifulSoup(response.text, "html.parser")
            for li in soup.find_all('li'):
                title_element = li.find('h3', class_='title')
                time_element = soup.find('div', class_='news-time time')
                if title_element and time_element:
                    link = title_element.a['href']
                    if link.split("/")[3] in ['politics','news','the-nation']:
                        published_time = time_element['data-published']
                        title = title_element.a.get_text(strip=True)
                        class_name = classify_india_event(title, link.split("/")[4] == 'national' )
                        if class_name:
                            links.append((link,title, published_time))
    except Exception as e:
        print("Falied to get latest headlines")
        
    # doing because of duplicate links
    latest_entries = {}
    for item in links:
        url, title, timestamp = item
        if url not in latest_entries or timestamp > latest_entries[url][2]:
            latest_entries[url] = item
    return list(latest_entries.values())


def fetchArticle(url: str) -> str|None:
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status() 
        soup = BeautifulSoup(response.text, 'html.parser')

        # Extract content (combining all <p> tags inside the article body)
        article_body = soup.find('div', class_='articlebodycontent')
        if article_body:
            paragraphs = article_body.find_all('p')
            text = ' '.join([p.get_text(strip=True) for p in paragraphs if p.get_text(strip=True)])
            return re.sub(r'\s+', ' ', text).strip()
        else:
            print("No content found")
            return None

    except requests.exceptions.RequestException as e:
        print(json.dumps({"error": f"Failed to fetch the article: {str(e)}"}, indent=2))

    except Exception as e:
        print(json.dumps({"error": f"An error occurred: {str(e)}"}, indent=2))
    
    return None


def bart_events_classifier(content: str):
    result = classifier(
        content,
        list(labels.keys())
    )
    if result['scores'][0]>0.4 and result['labels'][0] and labels[result['labels'][0]]!= 'Other':
        return labels[result['labels'][0]]


def openrouter_data(model: str, fallback_model:str, article:str):
    prompt = """
        Extract the most recent real-world defense, military, or terrorism-related event from the article below.
        Only return if the event is directly related to India (i.e., occurred in India or involved Indian citizens as direct victims or actors). Ignore background or contextual info.
        Only return one precise location where the event occurred (based on event action, not actor residence). Do NOT return multiple locations or use slashes.
        Output in this exact JSON format:
        {
          "event_date": "YYYY-MM-DD",
          "actor1": "Initiating group",
          "actor2": "Opposing/affected group",
          "country":"Country",
          "admin1": "State/territory/province of location",
          "admin2": "District/Tehsil/county of location",
          "location": "Town/Village/City",
          "fatalities": <number>,
          "civilian_targeting": 1 or 0
        }
        If no qualifying event is found, return: null
        article:
     """ + article

    try:
        completion = client.chat.completions.create(
          model=model,
          extra_body={
              "models": fallback_models
          },
          messages=[
            {
              "role": "user",
              "content": prompt
            }
          ]
        )
        return completion.choices[0].message.content
    except Exception as e:
        print("openrouter error--")
        

def extract_json_from_response(response_text):
    try:
        # Step 1: Extract first {...} block from response
        match = re.search(r'\{.*?\}', response_text, re.DOTALL)
        if match:
            json_text = match.group(0)
            return json.loads(json_text)
    except json.JSONDecodeError as e:
        print("JSON Decode Error:", e)

def getLatLongFromLocation(location: str):
    headers = { 'User-Agent': 'MyGeocoder/1.0 (me@example.com)' }
    try:
        response = requests.get(
            f"https://nominatim.openstreetmap.org/search?format=json&q={location}",
            headers=headers
        )
        if response.status_code == 200:
            data = response.json()
            return {
                "lat": float(data[0]["lat"]),
                "lon": float(data[0]["lon"])
            }

    except requests.exceptions.RequestException as e:
        print(f"API Error: {e}")
    

def get_simplified_weather_condition(weather_code):
    if weather_code is None:
        return "Unknown"
    elif weather_code == 0:
        return "Clear"
    elif 1 <= weather_code <= 3:
        return "Cloudy"
    elif 45 <= weather_code <= 48:
        return "Fog/Haze"
    elif 51 <= weather_code <= 67:
        return "Rain"
    elif 71 <= weather_code <= 77:
        return "Snow"
    elif 80 <= weather_code <= 86:
        return "Rain"
    elif 95 <= weather_code <= 99:
        return "Thunderstorm"
    else:
        return "Extreme"

def fetch_weather(lat, lon, date):
    url = "https://archive-api.open-meteo.com/v1/archive"
    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": date,
        "end_date": date,
        "daily": "weathercode,temperature_2m_max,temperature_2m_min",
        "timezone": "auto"
    }

    try:
        res = requests.get(url, params=params, timeout=10)
        if res.status_code == 200:
            data = res.json().get("daily", {})
            return {
                "max_temp": float(data.get("temperature_2m_max", [None])[0]),
                "min_temp": float(data.get("temperature_2m_min", [None])[0]),
                "weather_condition": get_simplified_weather_condition(int(data.get("weathercode", [None])[0]))
            }
    except:
        pass

    return {
        "max_temp": None,
        "min_temp": None,
        "weather_condition": None
    }

def prepare_final_data(latestNews: list, model:str, fallback_models:list):
    i=0
    finalData = []
    for link_det in latestNews:
        i+=1
        print("executing task: ", i)
        title = link_det[1]
        article = fetchArticle(link_det[0])
        event = bart_events_classifier(title + '. ' + article[:500])
    
        if event:
            # llm_data = {'event_date': '2025-06-29', 'actor1': 'Sri Lankan Navy', 'actor2': 'Indian fishermen', 'country': 'India', 'admin1': 'Tamil Nadu', 'admin2': 'Ramanathapuram', 'location': 'Dhanushkodi', 'fatalities': 0, 'civilian_targeting': 1}
            llm_data = extract_json_from_response(openrouter_data(model,fallback_models,article))
            if llm_data:
                final_loc = ', '.join(filter(None, [llm_data['location'], llm_data['admin2'], llm_data['admin1']]))
                coords = getLatLongFromLocation(final_loc)
                
                weather_data = fetch_weather(coords["lat"], coords["lon"], llm_data["event_date"]) if coords else {"max_temp": None,"min_temp": None,"weather_condition": None }
                
                article_info = {"source_url":link_det[0],
                        "source": "The Hindu",
                        "source_scale": "national",
                        "notes":link_det[1],
                        "event_type": event,
                        "event_date": llm_data.get("event_date", link_det[2]),
                        "country": llm_data.get("country", "India"),
                        "actor1": llm_data.get("actor1", None),
                        "actor2": llm_data.get("actor2",None),
                        "admin1": llm_data.get("admin1",None),
                        "admin2": llm_data.get("admin2",None),
                        "location": llm_data.get("location",None),  
                        "fatalities": llm_data.get("fatalities",0),
                        "civilian_targeting": llm_data.get("civilian_targeting",0),
                        "latitude": coords["lat"] ,
                        "longitude":coords["lon"] ,
                        "weather_condition": weather_data["weather_condition"],
                        "max_temp": weather_data["max_temp"],
                        "min_temp": weather_data["min_temp"]
                       }
                finalData.append(article_info)
                # break
    return finalData
    

def insert_data(final_data):
    
    try:
        supabase: Client = create_client(supabase_url, supabase_key)
        for data in final_data:
            try:
                response = (
                    supabase.table("defence_data")
                    .insert(data)
                    .execute()
                )
            except Exception as e:
                print("failed to insert for ----->", e)
        
    except Exception as e:
        print("Error while inserting data---")


def main():
    # latestNews = getLatestHeadlines()
    model = "mistralai/mistral-small-3.2-24b-instruct:free"
    fallback_models = ["sarvamai/sarvam-m:free","moonshotai/kimi-dev-72b:free", "deepseek/deepseek-r1-0528:free"]
    # final_data = prepare_final_data(latestNews, model, fallback_models)
    final_data = [{'source_url': 'https://www.thehindu.com/news/national/tamil-nadu/eight-fishermen-from-rameswaram-held-by-sri-lankan-navy-personnel-on-charges-of-poaching/article69750880.ece',
     'source': 'The Hindu',
     'source_scale': 'national',
     'notes': 'Eight Indian fishermen from Rameswaram arrested by Sri Lankan Navy',
     'event_type': 'Strategic developments',
     'event_date': '2025-06-29',
     'country': 'India',
     'actor1': 'Sri Lankan Navy',
     'actor2': 'Indian fishermen',
     'admin1': 'Tamil Nadu',
     'admin2': 'Ramanathapuram',
     'location': 'Dhanushkodi',
     'fatalities': 0,
     'civilian_targeting': 1,
     'latitude': 9.1778141,
     'longitude': 79.4177555,
     'weather_condition': None,
     'max_temp': None,
     'min_temp': None}]
    if len(final_data) >= 1:
        insert_data(final_data)
        print("data inserted successfully--------------")

if __name__ == "__main__":
    main()
