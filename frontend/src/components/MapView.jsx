// src/components/MapView.jsx
import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import axios from "axios";
import FilterPanel from "./FilterPanel";
import "mapbox-gl/dist/mapbox-gl.css";
import { Filter } from "lucide-react";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const MapView = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const navControl = useRef(null);
  const tooltipRef = useRef(null);

  const [geoData, setGeoData] = useState(null);
  const [mapStyle, setMapStyle] = useState("mapbox://styles/mapbox/streets-v11");
  const [eventsVisible, setEventsVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: mapStyle,
        center: [75.5, 32.8],
        zoom: 6,
      });

      navControl.current = new mapboxgl.NavigationControl();
      map.current.addControl(navControl.current, "bottom-right");

      map.current.on("load", () => {
        if (filters.from_date && filters.to_date) {
          loadData(filters);
        }
      });
    }
  }, []);

  useEffect(() => {
    if (!map.current) return;

    const current = map.current;
    current.setStyle(mapStyle);

    current.once("styledata", () => {
      if (navControl.current) {
        current.removeControl(navControl.current);
      }
      navControl.current = new mapboxgl.NavigationControl();
      current.addControl(navControl.current, "bottom-right");

      if (geoData) {
        addMapLayers(geoData);
      }
    });
  }, [mapStyle]);

  const loadData = async (filters = {}) => {
    console.log(filters)
    if (!filters.from_date || !filters.to_date) {
      console.warn("Date range is required.");
      removeEventLayers();
      setGeoData(null);
      return;
    }

    setLoading(true);
    setFilters(filters);

    const params = new URLSearchParams();
    if (filters.state) params.append("states", filters.state);
    if (filters.event_type) params.append("event_types", filters.event_type);
    if (filters.from_date) params.append("from_year", filters.from_date);
    if (filters.to_date) params.append("to_year", filters.to_date);

    try {
      const res = await axios.get(
        `http://ec2-44-222-235-167.compute-1.amazonaws.com:8000/events/geojson/filter?${params}`
      );
      setGeoData(res.data);

      if (map.current && map.current.isStyleLoaded()) {
        removeEventLayers();
        addMapLayers(res.data);
      } else {
        map.current.once("styledata", () => {
          addMapLayers(res.data);
        });
      }
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  const removeEventLayers = () => {
    const layers = ["clusters", "cluster-count", "unclustered-point"];
    const source = "events";

    layers.forEach((id) => {
      if (map.current.getLayer(id)) {
        map.current.removeLayer(id);
      }
    });

    if (map.current.getSource(source)) {
      map.current.removeSource(source);
    }
  };

  const addMapLayers = (data) => {
    if (!map.current) return;

    map.current.addSource("events", {
      type: "geojson",
      data,
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50,
    });

    map.current.addLayer({
      id: "clusters",
      type: "circle",
      source: "events",
      filter: ["has", "point_count"],
      layout: { visibility: eventsVisible ? "visible" : "none" },
      paint: {
        "circle-color": [
          "step",
          ["get", "point_count"],
          "#51bbd6", 10,
          "#f1f075", 50,
          "#f28cb1"
        ],
        "circle-radius": [
          "step",
          ["get", "point_count"],
          15, 10,
          20, 50,
          25
        ],
      },
    });

    map.current.addLayer({
      id: "cluster-count",
      type: "symbol",
      source: "events",
      filter: ["has", "point_count"],
      layout: {
        "text-field": "{point_count_abbreviated}",
        "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
        "text-size": 12,
        visibility: eventsVisible ? "visible" : "none",
      },
    });

    map.current.addLayer({
      id: "unclustered-point",
      type: "circle",
      source: "events",
      filter: ["!", ["has", "point_count"]],
      layout: {
        visibility: eventsVisible ? "visible" : "none",
      },
      paint: {
        "circle-radius": 5,
        "circle-color": "#ff0000",
        "circle-stroke-width": 1,
        "circle-stroke-color": "#fff",
      },
    });

    map.current.on("mousemove", "unclustered-point", (e) => {
      map.current.getCanvas().style.cursor = "pointer";
      const props = e.features[0].properties;
      const tooltipNode = tooltipRef.current;

      tooltipNode.innerHTML = `
        <div style="font-size: 14px; line-height: 1.4;">
          <strong>Event Type:</strong> ${props.event_type || "N/A"}<br/>
          <strong>Sub Event:</strong> ${props.sub_event_type || "N/A"}<br/>
          <strong>Event Date:</strong> ${props.event_date || "N/A"}<br/>
          <strong>Location:</strong> ${props.location || "N/A"}<br/>
          <strong>Latitude:</strong> ${props.latitude || "N/A"}<br/>
          <strong>Longitude:</strong> ${props.longitude || "N/A"}<br/>
          <strong>Fatalities:</strong> ${props.fatalities || "N/A"}<br/>
          <strong>Notes:</strong> ${props.notes || "N/A"}
        </div>
      `;

      tooltipNode.style.left = `${e.originalEvent.pageX + 10}px`;
      tooltipNode.style.top = `${e.originalEvent.pageY + 10}px`;
      tooltipNode.classList.remove("hidden");
    });

    map.current.on("mouseleave", "unclustered-point", () => {
      map.current.getCanvas().style.cursor = "";
      tooltipRef.current.classList.add("hidden");
    });

    map.current.on("click", "clusters", (e) => {
      const features = map.current.queryRenderedFeatures(e.point, {
        layers: ["clusters"],
      });
      const clusterId = features[0].properties.cluster_id;
      map.current.getSource("events").getClusterExpansionZoom(
        clusterId,
        (err, zoom) => {
          if (err) return;
          map.current.easeTo({
            center: features[0].geometry.coordinates,
            zoom: zoom,
          });
        }
      );
    });
  };

  const toggleLayerVisibility = () => {
    const visibility = eventsVisible ? "none" : "visible";
    ["clusters", "cluster-count", "unclustered-point"].forEach((layer) => {
      if (map.current.getLayer(layer)) {
        map.current.setLayoutProperty(layer, "visibility", visibility);
      }
    });
    setEventsVisible(!eventsVisible);
  };

  return (
    <div className="flex h-full w-full relative rounded-xl overflow-hidden">
      {/* Filter panel */}
      <button
        onClick={() => setShowFilters((prev) => !prev)}
        className="absolute top-4 left-4 z-20 bg-[#2e2e3e] p-2 rounded-full shadow hover:bg-[#3e3e4e] transition-colors"
        title="Toggle Filters"
      >
        <Filter className="w-5 h-5 text-white" />
      </button>

      {/* Filter Panel (conditionally rendered) */}
      {showFilters && (
        <div className="absolute top-4 left-16 z-10">
          <FilterPanel onApplyFilters={loadData} />
        </div>
      )}

      {/* Buttons on right */}
      <div className="absolute top-4 right-4 z-20 flex flex-col sm:flex-row gap-2">
        <button
          onClick={() =>
            setMapStyle((prev) =>
              prev === "mapbox://styles/mapbox/streets-v11"
                ? "mapbox://styles/mapbox/satellite-streets-v11"
                : "mapbox://styles/mapbox/streets-v11"
            )
          }
          className="flex items-center gap-2 bg-gradient-to-r from-[#2e2e3e] to-[#3e3e4e] text-white px-4 py-2 rounded-md shadow-md hover:scale-105 hover:from-[#3e3e4e] hover:to-[#4e4e5e] transition-all"
        >
          <span className="text-lg">🗺</span>
          <span className="text-sm font-medium">Toggle View</span>
        </button>

        <button
          onClick={toggleLayerVisibility}
          className="flex items-center gap-2 bg-gradient-to-r from-[#2e2e3e] to-[#3e3e4e] text-white px-4 py-2 rounded-md shadow-md hover:scale-105 hover:from-[#3e3e4e] hover:to-[#4e4e5e] transition-all"
        >
          <span className="text-lg">{eventsVisible ? "🙈" : "👁️"}</span>
          <span className="text-sm font-medium">
            {eventsVisible ? "Hide Events" : "Show Events"}
          </span>
        </button>
      </div>

      {/* Spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
          <div className="border-4 border-gray-500 border-t-transparent rounded-full w-10 h-10 animate-spin" />
        </div>
      )}

      {/* Map container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="tooltip hidden absolute bg-[#1e1e2f] text-white p-2 text-sm rounded shadow z-50 pointer-events-none"
      />
    </div>
  );
};

export default MapView;
