import React, { useState } from "react";
import Select from "react-select";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import moment from "moment";

const STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
  "Chandigarh", "Chhattisgarh", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh",
  "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
  "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttarakhand", "Uttar Pradesh", "West Bengal"
];

const EVENT_TYPES = [
  "Battles",
  "Explosions/Remote violence",
  "Strategic developments",
  "Violence against civilians"
];

const MIN_DATE = moment("2022-01-01");
const MAX_DATE = moment();

const FilterPanel = ({ onApplyFilters }) => {
  const [selectedStates, setSelectedStates] = useState([]);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [dateRange, setDateRange] = useState([0, MAX_DATE.diff(MIN_DATE, "days")]);

  const applyFilters = () => {
    const fromDate = MIN_DATE.clone().add(dateRange[0], "days").format("YYYY-MM-DD");
    const toDate = MIN_DATE.clone().add(dateRange[1], "days").format("YYYY-MM-DD");

    onApplyFilters({
      state: selectedStates.map(s => s.value).join(","),
      event_type: selectedEvents.map(e => e.value).join(","),
      from_date: fromDate,
      to_date: toDate
    });
  };

  return (
    <div className="p-4 bg-[#1e1e2f] text-white rounded-md shadow-lg border border-[#2e2e3e] w-full sm:w-[300px] space-y-5 text-sm">
      <div>
        <label className="block font-medium mb-1">🎯 States</label>
        <Select
          isMulti
          options={STATES.map(s => ({ value: s, label: s }))}
          value={selectedStates}
          onChange={setSelectedStates}
          className="text-sm"
          classNamePrefix="react-select"
          styles={{
            control: (base) => ({ ...base, backgroundColor: '#2e2e3e', borderColor: '#444' }),
            menu: (base) => ({ ...base, backgroundColor: '#2e2e3e' }),
            multiValue: (base) => ({ ...base, backgroundColor: '#444' }),
            multiValueLabel: (base) => ({ ...base, color: '#fff' }),
            singleValue: (base) => ({ ...base, color: '#fff' }),
            option: (base, state) => ({
              ...base,
              backgroundColor: state.isFocused ? '#3e3e4e' : '#2e2e3e',
              color: '#fff',
            }),
          }}
        />
      </div>

      <div>
        <label className="block font-medium mb-1">🧨 Event Types</label>
        <Select
          isMulti
          options={EVENT_TYPES.map(e => ({ value: e, label: e }))}
          value={selectedEvents}
          onChange={setSelectedEvents}
          className="text-sm"
          classNamePrefix="react-select"
          styles={{
            control: (base) => ({ ...base, backgroundColor: '#2e2e3e', borderColor: '#444' }),
            menu: (base) => ({ ...base, backgroundColor: '#2e2e3e' }),
            multiValue: (base) => ({ ...base, backgroundColor: '#444' }),
            multiValueLabel: (base) => ({ ...base, color: '#fff' }),
            singleValue: (base) => ({ ...base, color: '#fff' }),
            option: (base, state) => ({
              ...base,
              backgroundColor: state.isFocused ? '#3e3e4e' : '#2e2e3e',
              color: '#fff',
            }),
          }}
        />
      </div>

      <div>
        <label className="block font-medium mb-1">📅 Date Range</label>
        <Slider
          range
          min={0}
          max={MAX_DATE.diff(MIN_DATE, "days")}
          value={dateRange}
          onChange={setDateRange}
          marks={{
            0: MIN_DATE.format("YYYY"),
            [MAX_DATE.diff(MIN_DATE, "days")]: MAX_DATE.format("YYYY")
          }}
          trackStyle={[{ backgroundColor: "#3b82f6" }]}
          handleStyle={[{ borderColor: "#3b82f6", backgroundColor: "#3b82f6" }, { borderColor: "#3b82f6", backgroundColor: "#3b82f6" }]}
          railStyle={{ backgroundColor: "#2e2e3e" }}
        />
        <div className="text-xs mt-2 text-center text-gray-400">
          {MIN_DATE.clone().add(dateRange[0], "days").format("YYYY-MM-DD")} —{" "}
          {MIN_DATE.clone().add(dateRange[1], "days").format("YYYY-MM-DD")}
        </div>
      </div>

      <button
        onClick={applyFilters}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full text-sm font-medium"
      >
        ✅ Apply Filters
      </button>
    </div>
  );
};

export default FilterPanel;
