"use client";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import styles from "@/styles/user/analytics.module.css";

export default function Filters({
  filters,
  startDate,
  endDate,
  handleFilterChange,
  handleStartDateChange,
  handleEndDateChange,
  clearFilters,
}) {
  return (
    <div className={styles.filtersCard}>
      <h3>Filters</h3>
      <div className={styles.filtersGrid}>
        
        <div className={styles.filterGroup}>
          <label htmlFor="sampleType">Sample Type</label>
          <select
            id="sampleType"
            value={filters.sampleType}
            onChange={(e) => handleFilterChange("sampleType", e.target.value)}
            className={styles.filterInput}
          >
            <option value="all">All Types</option>
            <option value="water">Water</option>
            <option value="soil">Soil</option>
            <option value="plant">Plant</option>
            <option value="biological_fluid">Biological Fluid</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Start Date</label>
          <DatePicker
            selected={startDate}
            onChange={handleStartDateChange}
            dateFormat="yyyy-MM-dd"
            placeholderText="Select start date"
            className={styles.filterInput}
            maxDate={endDate || new Date()}
            showYearDropdown
            showMonthDropdown
            dropdownMode="select"
          />
        </div>

        <div className={styles.filterGroup}>
          <label>End Date</label>
          <DatePicker
            selected={endDate}
            onChange={handleEndDateChange}
            dateFormat="yyyy-MM-dd"
            placeholderText="Select end date"
            className={styles.filterInput}
            minDate={startDate}
            maxDate={new Date()}
            showYearDropdown
            showMonthDropdown
            dropdownMode="select"
          />
        </div>

        <div className={styles.filterGroup}>
          <button onClick={clearFilters} className={styles.clearBtn}>
            Clear Filters
          </button>
        </div>

      </div>
    </div>
  );
}
