import pandas as pd
from sqlalchemy import create_engine

# Set PostgreSQL connection info
db_config = {
    "dbname":"borderdata",
    "user":"postgres",
    "password":"",
    "host":"btdb.us-east-1.rds.amazonaws.com",
    "port":5432
}

# Create engine
engine = create_engine(f"postgresql+psycopg2://{db_config['user']}:{db_config['password']}@{db_config['host']}:{db_config['port']}/{db_config['dbname']}")

# Read the CSV file
df = pd.read_csv("data/filtered_dataset_20062025.csv", parse_dates=["event_date"])

# Ingest data into PostgreSQL
df.to_sql("acled_history_events", engine, if_exists="append", index=False)

print("✅ Data ingestion complete.")
