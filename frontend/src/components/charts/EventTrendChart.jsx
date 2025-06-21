import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

// Short label shown in chart legend
const labelMap = {
  "Explosions / Remote violence": "Explosions",
  "Battles": "Battles",
  "Strategic developments": "Strategic",
  "Violence against civilians": "Civilians",
};

const colors = {
  "Explosions / Remote violence": "#ff6384",
  "Battles": "#36a2eb",
  "Strategic developments": "#ffce56",
  "Violence against civilians": "#4bc0c0",
};

const EventTrendChart = () => {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    async function fetchData() {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/event-trend`);
      const rawData = await res.json();

      const labels = rawData.map((d) => d.quarter_year);
      const eventTypes = Object.keys(labelMap);

      const datasets = eventTypes.map((type) => ({
        label: labelMap[type],
        data: rawData.map((d) => d[type] || 0),
        fill: false,
        borderColor: colors[type],
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 6,
      }));

      setChartData({ labels, datasets });
    }

    fetchData();
  }, []);

  const options = {
    responsive: true,
    animation: {
      duration: 1200,
      easing: "easeOutQuart",
    },
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const shortLabel = context.dataset.label;
            const fullLabel =
              Object.entries(labelMap).find(([_, val]) => val === shortLabel)?.[0] || shortLabel;
            const value = context.formattedValue;
            return `${fullLabel}: ${value}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 30,
        },
      },
    },
  };

  if (!chartData)
    return <div className="bg-[#1e1e2f] p-4 rounded">Loading Event Trends...</div>;

  return (
    <div className="bg-[#1e1e2f] p-4 rounded">
      <h2 className="text-lg mb-2 font-semibold">📊 Event Trends Over Time</h2>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default EventTrendChart;
