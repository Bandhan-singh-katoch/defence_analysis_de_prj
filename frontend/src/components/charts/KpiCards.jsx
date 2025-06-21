// src/components/KpiCards.jsx
import React, { useEffect, useState } from "react";

const kpiTitles = [
  { title: "Total Events", key: "total_events", icon: "🧨" },
  { title: "Events This Week", key: "events_this_week", icon: "📅" },
  { title: "Fatalities", key: "fatalities", icon: "💀" },
  { title: "Explosions / Remote Violence", key: "explosions", icon: "💣" },
  { title: "Strategic Developments", key: "strategic", icon: "🛡️" },
  { title: "Civilian Targeting", key: "civilian_targeting", icon: "👥️" },
];

const KpiCards = () => {
  const [kpiData, setKpiData] = useState(null);

  useEffect(() => {
    async function fetchKpis() {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/kpi-summary`);
      const json = await res.json();
      // console.log("kpidata-------",json)
      setKpiData(json);
    }
    fetchKpis();
  }, []);

  if (!kpiData) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {kpiTitles.map((item, i) => (
          <div
            key={i}
            className="bg-[#1e1e2f] p-4 rounded-xl shadow-md text-center animate-pulse"
          >
            <p className="text-gray-400 text-sm mb-1">{item.title}</p>
            <p className="text-xl font-bold text-gray-600">--</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {kpiTitles.map((item, i) => (
        <div
          key={i}
          className="bg-[#1e1e2f] p-4 rounded-xl shadow-md hover:scale-[1.02] transition-transform"
        >
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>{item.title}</span>
            <span className="text-lg">{item.icon}</span>
          </div>
          <p className="text-2xl font-bold mt-2 text-white">
            {kpiData[item.key]}
          </p>
        </div>
      ))}
    </div>
  );
};

export default KpiCards;
