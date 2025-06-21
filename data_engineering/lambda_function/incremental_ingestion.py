import json
import os
import psycopg2
from datetime import datetime

# Environment variables
DB_HOST = os.environ.get("DB_HOST", "your-db-host")
DB_NAME = os.environ.get("DB_NAME", "your-db-name")
DB_USER = os.environ.get("DB_USER", "your-db-user")
DB_PASS = os.environ.get("DB_PASS", "your-db-pass")
DB_PORT = os.environ.get("DB_PORT", "5432")

SECRET_API_KEY = "1906066"
# https://datafacpracbeg.z29.web.core.windows.net
CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,x-api-key",
    "Access-Control-Allow-Methods": "POST,OPTIONS"
}

def lambda_handler(event, context):
    if event.get("requestContext", {}).get("http", {}).get("method") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps({"message": "CORS preflight passed"})
        }

    headers = event.get("headers", {})
    if headers.get("x-api-key") != SECRET_API_KEY:
        return {
            "statusCode": 401,
            "headers": CORS_HEADERS,
            "body": "Unauthorized: Invalid API Key"
        }

    try:
        body = json.loads(event.get("body", "[]"))
        if not isinstance(body, list):
            return {
                "statusCode": 400,
                "headers": CORS_HEADERS,
                "body": "Invalid JSON array"
            }

        conn = psycopg2.connect(
            host=DB_HOST, dbname=DB_NAME, user=DB_USER, password=DB_PASS, port=DB_PORT
        )
        cur = conn.cursor()

        for item in body:
            lat = item.get("latitude")
            lon = item.get("longitude")
    
            if lat is None or lon is None:
                # Optionally log or skip such events
                continue
            cur.execute("""
            INSERT INTO defence_data (
                event_date, event_type, actor1, actor2, civilian_targeting, country,
                admin1, admin2, admin3, location, latitude, longitude,
                source, source_scale, source_url, notes, fatalities,
                weather_condition, temperature, geom
            ) VALUES (
                %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s,
                %s, %s,
                ST_SetSRID(ST_MakePoint(%s, %s), 4326)
            )
        """, (
            datetime.strptime(item["event_date"], "%Y-%m-%d").date(),
            item.get("event_type"),
            item.get("actor1"),
            item.get("actor2"),
            item.get("civilian_targeting"),
            item.get("country"),
            item.get("admin1"),
            item.get("admin2"),
            item.get("admin3"),
            item.get("location"),
            float(lat),
            float(lon),
            item.get("source"),
            item.get("source_scale"),
            item.get("source_url"),
            item.get("notes"),
            int(item.get("fatalities", 0)),
            item.get("weather_condition"),
            int(item.get("temperature", 0)),
            float(lon),
            float(lat),
        ))

        conn.commit()
        cur.close()
        conn.close()

        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps({"message": f"{len(body)} records inserted successfully"})
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "headers": CORS_HEADERS,
            "body": json.dumps({"error": str(e)})
        }
