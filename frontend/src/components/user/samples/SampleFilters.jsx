'use client';
import { useState, useEffect } from 'react';
import styles, { getResponsiveFiltersStyles, hoverStyles } from '@/styles/user/samples.styles';

export default function SampleFilters({ onFilter }) {
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    dateFrom: '',
    dateTo: '',
  });

  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [focusedInput, setFocusedInput] = useState(null);
  const [isResetHovered, setIsResetHovered] = useState(false);

  // Track window size for responsive styles
  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowSize.width < 768;
  const isTablet = windowSize.width >= 768 && windowSize.width < 1024;
  const responsiveStyles = getResponsiveFiltersStyles(isMobile, isTablet);

  const handleChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFilter(newFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      search: '',
      type: 'all',
      dateFrom: '',
      dateTo: '',
    };
    setFilters(resetFilters);
    onFilter(resetFilters);
  };

  const getInputStyle = (inputName) => ({
    ...responsiveStyles.filterInput,
    ...(focusedInput === inputName ? hoverStyles.filterInputFocus : {}),
  });

  const getResetButtonStyle = () => ({
    ...responsiveStyles.btnReset,
    ...(isResetHovered ? hoverStyles.btnResetHover : {}),
  });

  return (
    <div style={responsiveStyles.filtersContainer}>
      <div style={responsiveStyles.filtersGrid}>
        {/* Search */}
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>🔍 Search</label>
          <input
            type="text"
            placeholder="Search samples..."
            style={getInputStyle('search')}
            value={filters.search}
            onChange={(e) => handleChange('search', e.target.value)}
            onFocus={() => setFocusedInput('search')}
            onBlur={() => setFocusedInput(null)}
          />
        </div>

        {/* Type Filter */}
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>🧪 Sample Type</label>
          <select
            style={getInputStyle('type')}
            value={filters.type}
            onChange={(e) => handleChange('type', e.target.value)}
            onFocus={() => setFocusedInput('type')}
            onBlur={() => setFocusedInput(null)}
          >
            <option value="all">All Types</option>
            <option value="blood">🩸 Blood</option>
            <option value="water">💧 Water</option>
            <option value="soil">🌱 Soil</option>
            <option value="tissue">🧬 Tissue</option>
            <option value="saliva">💦 Saliva</option>
            <option value="urine">🧪 Urine</option>
            <option value="other">📋 Other</option>
          </select>
        </div>

        {/* Date From */}
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>📅 From Date</label>
          <input
            type="date"
            style={getInputStyle('dateFrom')}
            value={filters.dateFrom}
            onChange={(e) => handleChange('dateFrom', e.target.value)}
            onFocus={() => setFocusedInput('dateFrom')}
            onBlur={() => setFocusedInput(null)}
          />
        </div>

        {/* Date To */}
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>📅 To Date</label>
          <input
            type="date"
            style={getInputStyle('dateTo')}
            value={filters.dateTo}
            onChange={(e) => handleChange('dateTo', e.target.value)}
            onFocus={() => setFocusedInput('dateTo')}
            onBlur={() => setFocusedInput(null)}
          />
        </div>
      </div>

      {/* Reset Button */}
      <button 
        style={getResetButtonStyle()} 
        onClick={handleReset}
        onMouseEnter={() => setIsResetHovered(true)}
        onMouseLeave={() => setIsResetHovered(false)}
      >
        <span>↻</span> Reset Filters
      </button>
    </div>
  );
}
