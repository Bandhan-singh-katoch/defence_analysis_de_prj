CREATE DATABASE borderdata;
\c borderdata
\d table_name (desc table)
CREATE EXTENSION postgis;
SELECT PostGIS_full_version();

CREATE TABLE acled_history_events (
    event_id_cnty VARCHAR PRIMARY KEY,
    event_date DATE,
    year INTEGER,
    -- time_precision INTEGER,
    -- disorder_type VARCHAR,
    event_type VARCHAR,
    sub_event_type VARCHAR,
    actor1 VARCHAR,
    assoc_actor_1 TEXT,
    inter1 INTEGER,
    actor2 VARCHAR,
    assoc_actor_2 TEXT,
    inter2 INTEGER,
    interaction INTEGER,
    civilian_targeting TEXT, --change to boolean
    -- iso INTEGER,
    region VARCHAR,
    country VARCHAR,
    admin1 VARCHAR,   -- State (e.g., Jammu and Kashmir)
    admin2 VARCHAR,   -- District (e.g., Jammu)
    admin3 VARCHAR,   -- Tehsil/Block (e.g., Akhnoor)
    location VARCHAR, -- City/Town/Village
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    -- geo_precision INTEGER,
    source TEXT,
    source_scale VARCHAR,
    notes TEXT,
    fatalities INTEGER,
    tags TEXT,
    timestamp BIGINT
);
ALTER TABLE acled_history_events ADD COLUMN weather_code INTEGER;
ALTER TABLE acled_history_events ADD COLUMN weather_condition VARCHAR;
ALTER TABLE acled_history_events ADD COLUMN temperature DECIMAL(10,2);

ALTER TABLE acled_history_events ADD COLUMN geom geometry(Point, 4326);
ALTER TABLE acled_history_events ADD COLUMN temperature DECIMAL(10,2);

UPDATE acled_history_events
SET geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326);

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

CREATE TABLE defence_data (
    id SERIAL PRIMARY KEY,
    event_date DATE,
    event_type VARCHAR,
    actor1 VARCHAR,
    actor2 VARCHAR,
    civilian_targeting BOOLEAN,
    country VARCHAR,
    admin1 VARCHAR,
    admin2 VARCHAR,
    admin3 VARCHAR,
    location VARCHAR,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    source TEXT,
    source_scale VARCHAR,
    source_url TEXT,
    notes TEXT,
    fatalities INTEGER,
    weather_condition VARCHAR,
    temperature INTEGER,
    geom geometryselect (Point, 4326),
    timestamp BIGINT DEFAULT (EXTRACT(EPOCH FROM now())::BIGINT)
);

CREATE INDEX idx_defence_admin1 ON defence_data(admin1);
CREATE INDEX idx_defence_event_date ON defence_data(event_date);
CREATE INDEX idx_defence_latlon ON defence_data(latitude, longitude);
CREATE INDEX idx_defence_events_geom ON defence_data USING GIST (geom);


CREATE OR REPLACE VIEW defence_data_union AS
SELECT 
    id::VARCHAR as event_id_cnty,
    event_date,
    event_type,
    actor1,
    actor2,
    civilian_targeting,
    country,
    admin1,
    admin2,
    admin3,
    '' AS sub_event_type,  -- Missing in defence_data
    location,
    latitude,
    longitude,
    source,
    source_scale,
    source_url,
    notes,
    fatalities,
    weather_condition,
    temperature,
    geom,
    timestamp
FROM defence_data

UNION ALL

SELECT
    event_id_cnty,
    event_date,
    event_type,
    actor1,
    actor2,
    civilian_targeting,
    country,
    admin1,
    admin2,
    admin3,
    sub_event_type,  -- Present in acled_history_events
    location,
    latitude,
    longitude,
    source,
    source_scale,
    '' AS source_url,  -- Missing in acled_history_events
    notes,
    fatalities,
    weather_condition,  -- Missing in acled_history_events
    temperature,  -- Missing in acled_history_events
    geom,
    last_updated AS timestamp
FROM acled_history_events;




-- cd ~/environment/backend/api
-- uvicorn main:app --reload
-- uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
--npm run dev
