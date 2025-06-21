// src/components/EventTimeline.jsx
import React, { useEffect, useState } from "react";

const typeColors = {
  "Battles": "bg-blue-600",
  "Explosions / Remote violence": "bg-red-600",
  "Strategic developments": "bg-yellow-500",
  "Violence against civilians": "bg-purple-600",
};

const EventTimeline = () => {
  const [events, setEvents] = useState([]);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const fetchTimeline = async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/event-timeline`);
      const json = await res.json();
      setEvents(json);
    };
    fetchTimeline();
  }, []);

  const toggleExpand = (index) => {
    setExpanded(expanded === index ? null : index);
  };

  return (
    <div className="bg-[#1e1e2f] p-4 rounded">
      <h2 className="text-lg mb-2 font-semibold">📅 Recent Events Timeline</h2>
      <ul className="space-y-4">
        {events.map((event, idx) => (
          <li key={idx} className="relative border-l-2 border-[#3e3e4e] pl-4">
            <div className="absolute left-[-10px] top-[6px] w-3 h-3 rounded-full border-2 border-white" 
                 style={{ backgroundColor: typeColors[event.type] || '#ccc' }} />
            <div
              className="cursor-pointer group"
              onClick={() => toggleExpand(idx)}
            >
              <div className="text-sm text-gray-300">
                {event.date} • <span className="font-medium text-white">{event.type}</span>
              </div>
              <div className="text-sm text-gray-400">{event.location}</div>
              <div className="text-xs text-gray-500 mt-1">
                {expanded === idx ? event.summary : event.summary.slice(0, 100) + (event.summary.length > 100 ? "..." : "")}
              </div>
              {typeof event.fatalities === 'number' && event.fatalities > 0 && (
                <div className="mt-1 text-xs text-red-400">Fatalities: {event.fatalities}</div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default EventTimeline;