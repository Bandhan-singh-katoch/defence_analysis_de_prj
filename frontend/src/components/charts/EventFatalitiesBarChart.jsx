import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const EventFatalitiesBarChart = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/event-fatalities`);
      const json = await res.json();

      const labels = json.map((item) => item.event_type);
      const fatalities = json.map((item) => item.fatalities);

      setData({
        labels,
        datasets: [
          {
            label: "Fatalities",
            data: fatalities,
            backgroundColor: "#f87171", // Tailwind red-400
            borderRadius: 6,
          }
        ]
      });
    };

    fetchData();
  }, []);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: "white",
        }
      },
      title: {
        display: true,
        text: "Fatalities by Event Type",
        color: "white",
        font: {
          size: 16
        }
      },
      tooltip: {
        mode: "index",
        intersect: false,
      }
    },
    scales: {
      x: {
        ticks: { color: "white" },
        grid: { color: "#2e2e3e" },
      },
      y: {
        beginAtZero: true,
        ticks: { color: "white" },
        grid: { color: "#2e2e3e" },
      }
    }
  };

  if (!data) return <div className="bg-[#1e1e2f] p-4 rounded">Loading Fatalities...</div>;

  return (
    <div className="bg-[#1e1e2f] p-4 rounded">
      <h2 className="text-lg font-semibold mb-4">💀 Fatalities by Event Type</h2>
      <Bar data={data} options={options} />
    </div>
  );
};

export default EventFatalitiesBarChart;
