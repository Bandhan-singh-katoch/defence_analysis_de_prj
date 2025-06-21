import React, { useEffect, useState } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const EventTypePieChart = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/event-types-summary`);
      const json = await res.json();

      const labels = Object.keys(json);
      const values = Object.values(json);
      const total = values.reduce((acc, val) => acc + val, 0);

      setData({
        labels: labels,
        datasets: [
          {
            data: values,
            backgroundColor: ["#ff6384", "#36a2eb", "#ffce56", "#4bc0c0"],
            borderColor: "#121212",
            borderWidth: 2,
            cutout: "60%", // Makes it a donut
          }
        ]
      });
    };
    fetchData();
  }, []);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        align: 'center',
        labels: {
          boxWidth: 12,
          padding: 10,
          usePointStyle: true,
          color: 'white'
        }
      }
    }
  };

  if (!data) return <div className="bg-[#1e1e2f] p-4 rounded">Loading Event Types...</div>;

  return (
    <div className="bg-[#1e1e2f] p-4 rounded">
      <h2 className="text-lg mb-4 font-semibold">📌 Event Type Distribution</h2>
      <div className="flex justify-center items-center" style={{ height: '220px' }}>
        <Pie data={data} options={options} />
      </div>
    </div>
  );
};

export default EventTypePieChart;
