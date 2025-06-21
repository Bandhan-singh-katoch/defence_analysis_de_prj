from fastapi import FastAPI, Query
from typing import Optional, List
from fastapi.middleware.cors import CORSMiddleware
from api.crud import (
    fetch_filtered_events, get_event_by_id,
    get_kpi_summary, get_event_trend, get_event_timeline, get_event_type_summary, get_top_locations, get_fatalities_by_event_type
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://ec2-44-222-235-167.compute-1.amazonaws.com:3000"],  # For production: replace with your React app domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "ACLED Events API is running."}

@app.get("/events/geojson/filter")
def filter_events(
    states: Optional[str] = Query(None),
    event_types: Optional[str] = Query(None),
    from_year: Optional[str] = None,
    to_year: Optional[str] = None
    ):
    return fetch_filtered_events(states, event_types, from_year, to_year)

@app.get("/kpi-summary")
def kpi_summary():
    return get_kpi_summary()

@app.get("/event-trend")
def event_trend():
    return get_event_trend()

@app.get("/event-timeline")
def event_timeline():
    return get_event_timeline()
    
@app.get("/event-types-summary")
def event_type_summary():
    return get_event_type_summary()
    
@app.get("/top-locations")
def top_locations():
    return get_top_locations()
    
@app.get("/event-fatalities")
def event_fatalities():
    return get_fatalities_by_event_type()