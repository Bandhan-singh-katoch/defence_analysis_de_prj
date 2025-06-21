import MapView from "./components/MapView";
import KpiCards from "./components/charts/KpiCards";
import EventTrendChart from "./components/charts/EventTrendChart";
import EventTypePieChart from "./components/charts/EventTypePieChart";
import TopLocationsTable from "./components/charts/TopLocationsTable";
import EventTimeline from "./components/charts/EventTimeline";
import EventFatalitiesBarChart from "./components/charts/EventFatalitiesBarChart";
import { CalendarDays, RefreshCcw, Download } from "lucide-react";

function App() {
  return (
  <div className="min-h-screen bg-[#121212] text-white overflow-x-hidden">
  <div className="min-h-screen bg-[#121212] text-white overflow-hidden">
  
  <div className="flex justify-between items-center px-6 py-4 border-b border-[#2e2e3e]">
    <h1 className="text-xl font-bold">🛡️ Military Events Dashboard</h1>
    <div className="flex gap-4 text-sm text-gray-300">
      <button className="hover:text-white">📅 Date Range</button>
      <button className="hover:text-white">🔄 Refresh</button>
      <button className="hover:text-white">⬇ Export</button>
    </div>
  </div>

  {/* Main Layout */}
  <div className="grid grid-cols-1 lg:grid-cols-[1.8fr_1.2fr] gap-4 px-4 py-4">
    {/* Left side - Map */}
    <div className="h-[75vh] text-gray-400">
      <MapView />
    </div>

    {/* Right side - Scrollable content */}
    <div className="pr-2 overflow-visible lg:h-[75vh] lg:overflow-y-auto scrollbar-thin scrollbar-thumb-[#2e2e3e] scrollbar-track-transparent">
      <div className="flex flex-col gap-4">
        <KpiCards />
        <EventTrendChart />
        <EventFatalitiesBarChart />
        <EventTypePieChart />
        <TopLocationsTable />
        <EventTimeline />
      </div>
    </div>
  </div>
</div>
</div>
  );
}

export default App;
