from api.database import get_connection
import json

def fetch_filtered_events(states=None, event_types=None, from_year=None, to_year=None):
    conn = get_connection()
    cur = conn.cursor()

    base_query = """
        SELECT event_id_cnty, event_date, event_type, sub_event_type, location,
               latitude, longitude, ST_AsGeoJSON(geom)::json
        FROM defence_data_union
        WHERE 1=1
    """
    filters = []
    params = []

    if states:
        state_list = states if isinstance(states, list) else states.split(",")
        filters.append("AND admin1 = ANY(%s)")
        params.append(state_list)

    if event_types:
        event_type_list = event_types if isinstance(event_types, list) else event_types.split(",")
        filters.append("AND event_type = ANY(%s)")
        params.append(event_type_list)

    if from_year:
        filters.append("AND event_date >= %s")
        params.append(from_year)

    if to_year:
        filters.append("AND event_date <= %s")
        params.append(to_year)

    final_query = base_query + "\n".join(filters)
    cur.execute(final_query, params)
    rows = cur.fetchall()
    conn.close()

    return format_geojson(rows)
 
def get_event_by_id(event_id):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT event_id_cnty, event_date, event_type, sub_event_type, location, latitude, longitude,
               ST_AsGeoJSON(geom)::json
        FROM defence_data_union
        WHERE event_id_cnty = %s
    """, (event_id,))
    row = cur.fetchone()
    conn.close()

    if row:
        return format_geojson([row])
    return {}

def format_geojson(rows):
    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": row[7],
                "properties": {
                    "event_id": str(row[0]),
                    "event_date": str(row[1]),
                    "event_type": str(row[2]),
                    "sub_event_type": str(row[3]),
                    "location": str(row[4]),
                    "latitude": float(row[5]),
                    "longitude": float(row[6]),
                    "fatalities": str(row[8]) if len(row) > 8 and row[8] is not None else "N/A",
                    "notes": str(row[9]) if len(row) > 9 and row[9] is not None else "N/A"
                }
            } for row in rows
        ]
    }

def get_kpi_summary():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT count(*) as total_events, 
        sum(case when event_date >= date_trunc('week', CURRENT_DATE) - INTERVAL '7 days' AND event_date < date_trunc('week', CURRENT_DATE) then 1 else 0 end) as events_this_week,
        sum(fatalities),
        sum(case when event_type = 'Explosions/Remote violence' then 1 else 0 end) as explosions,
        sum(case when event_type = 'Strategic developments' then 1 else 0 end) as strategic,
        sum(civilian_targeting)
        FROM defence_data_union
    """)
    rows = cur.fetchall()
    conn.close()
    # print("rows--------------====",rows)
    return {
      "total_events": rows[0][0],
      "events_this_week": rows[0][1],
      "fatalities": rows[0][2],
      "explosions": rows[0][3],
      "strategic": rows[0][4],
      "civilian_targeting": rows[0][5]
    }
    

def get_event_trend():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT 
            CONCAT('Q', EXTRACT(QUARTER FROM event_date), ' ', EXTRACT(YEAR FROM event_date)) AS quarter_year,
            sum(case when event_type = 'Violence against civilians' then 1 else 0 end) as violence,
            sum(case when event_type = 'Strategic developments' then 1 else 0 end) as dev,
            sum(case when event_type = 'Battles' then 1 else 0 end) as battle,
            sum(case when event_type = 'Explosions/Remote violence' then 1 else 0 end) as explosion
        FROM defence_data_union
        GROUP BY 
            quarter_year
        ORDER BY MIN(event_date);
    """)
    rows = cur.fetchall()
    conn.close()
    # print("rows-----------",rows)
    return [
        {
          "quarter_year": r[0],
          "Violence against civilians": r[1],
          "Strategic developments": r[2],
          "Battles": r[3],
          "Explosions / Remote violence": r[4]
        }
        for r in rows
    ]



def get_event_timeline():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT 
            TO_CHAR(event_date, 'Month DD, YYYY'), event_type, admin2 || ',' || admin1, notes, fatalities
        FROM defence_data_union
        ORDER BY event_date desc limit 10;
    """)
    rows = cur.fetchall()
    conn.close()
    return [
        {
          "date": r[0],
          "type": r[1],
          "location": r[2],
          "summary": r[3],
          "fatalities": r[4]
        }
        for r in rows
    ]
    


def get_event_type_summary():
    # print('get_event_type_summary------------')
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT 
            sum(case when event_type = 'Battles' then 1 else 0 end) as battle,
            sum(case when event_type = 'Explosions/Remote violence' then 1 else 0 end) as explosion,
            sum(case when event_type = 'Strategic developments' then 1 else 0 end) as dev,
            sum(case when event_type = 'Violence against civilians' then 1 else 0 end) as violence
        FROM defence_data_union;
    """)
    r = cur.fetchall()
    conn.close()
    return{
      "Battles": r[0][0],
      "Explosions / Remote violence": r[0][1],
      "Strategic developments": r[0][2],
      "Violence against civilians": r[0][3]
    }
    
def get_top_locations():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT admin2,admin1,
            count(*),
            sum(fatalities)
        FROM defence_data_union
        group by admin2, admin1
        order by 3 desc limit 5;
    """)
    rows = cur.fetchall()
    conn.close()
    
    return [
        {
          "location": r[0],
          "state": r[1],
          "event_count": r[2],
          "fatalities": r[3]
        }
        for r in rows
    ]


def get_fatalities_by_event_type():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT event_type, SUM(fatalities) AS total_fatalities
        FROM defence_data_union where event_type != 'Strategic developments'
        GROUP BY event_type 
    """)
    rows = cur.fetchall()
    conn.close()
    
    return [
        {"event_type": r[0], "fatalities": r[1]}
        for r in rows
    ]