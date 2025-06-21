import React, { useEffect, useState } from "react";

const TopLocationsTable = () => {
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    const fetchLocations = async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/top-locations`);
      const data = await res.json();
      setLocations(data);
    };
    fetchLocations();
  }, []);

  return (
    <div className="bg-[#1e1e2f] p-4 rounded">
      <h2 className="text-lg mb-2 font-semibold">📍 Top Event Locations</h2>
      <table className="w-full text-sm table-fixed">
        <thead>
          <tr className="text-gray-400 border-b border-[#2e2e3e]">
            <th className="text-left pb-2">Location</th>
            <th className="text-left pb-2">State</th>
            <th className="text-right pb-2">Events</th>
            <th className="text-right pb-2">Fatalities</th>
          </tr>
        </thead>
        <tbody>
          {locations.map((loc, idx) => (
            <tr
              key={idx}
              className={`text-gray-200 ${
                idx % 2 === 0 ? "bg-[#252535]" : "bg-[#1f1f2f]"
              } hover:bg-[#2a2a3b] transition-colors`}
            >
              <td className="py-2 px-1">{loc.location}</td>
              <td className="py-2 px-1">{loc.state}</td>
              <td className="text-right py-2 px-1">{loc.event_count}</td>
              <td className="text-right py-2 px-1">
                {loc.fatalities > 0 ? (
                  <span className="text-red-400 font-semibold">{loc.fatalities}</span>
                ) : (
                  <span className="text-gray-400">0</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TopLocationsTable;
