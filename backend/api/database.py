import psycopg2
import os

def get_connection():
    return psycopg2.connect(
        dbname=os.getenv("PG_DB", "borderdata"),
        user=os.getenv("PG_USER", "postgres"),
        password=os.getenv("PG_PASS", ""),
        host=os.getenv("PG_HOST", "btdb.us-east-1.rds.amazonaws.com"),
        port=os.getenv("PG_PORT", "5432")
    )
