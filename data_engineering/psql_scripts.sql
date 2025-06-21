CREATE DATABASE borderdata;
\c borderdata
CREATE EXTENSION postgis;
SELECT PostGIS_full_version();

CREATE TABLE acled_history_events (
    event_id_cnty VARCHAR PRIMARY KEY,
    event_date DATE,
    year INTEGER,
    time_precision INTEGER,
    disorder_type VARCHAR,
    event_type VARCHAR,
    sub_event_type VARCHAR,
    actor1 VARCHAR,
    assoc_actor_1 TEXT,
    inter1 INTEGER,
    actor2 VARCHAR,
    assoc_actor_2 TEXT,
    inter2 INTEGER,
    interaction INTEGER,
    civilian_targeting TEXT,
    iso INTEGER,
    region VARCHAR,
    country VARCHAR,
    admin1 VARCHAR,   -- State (e.g., Jammu and Kashmir)
    admin2 VARCHAR,   -- District (e.g., Jammu)
    admin3 VARCHAR,   -- Tehsil/Block (e.g., Akhnoor)
    location VARCHAR, -- City/Town/Village
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    geo_precision INTEGER,
    source TEXT,
    source_scale VARCHAR,
    notes TEXT,
    fatalities INTEGER,
    tags TEXT,
    timestamp BIGINT
);

-- Search by location/state/date
CREATE INDEX idx_acled_admin1 ON acled_history_events(admin1);
CREATE INDEX idx_acled_event_date ON acled_history_events(event_date);
CREATE INDEX idx_acled_latlon ON acled_history_events(latitude, longitude);



ALTER TABLE acled_history_events ADD COLUMN geom geometry(Point, 4326);

UPDATE acled_history_events
SET geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326);

CREATE INDEX idx_acled_events_geom ON acled_history_events USING GIST (geom);

-- a. Events by District
SELECT admin2 AS district, COUNT(*) AS total_events
FROM acled_events
GROUP BY admin2
ORDER BY total_events DESC;

-- cd ~/environment/backend/api
-- uvicorn main:app --reload
-- uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
--npm run dev