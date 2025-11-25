"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import "@/styles/common/SearchBar.css"; // Import styles globally

export default function SearchBar({
  value = "",
  onChange,
  onSearch,
  placeholder = "Search...",
  delay = 300,
  autoFocus = false,
  ariaLabel = "Search",
  id = "search-input",
  name = "q",
  className = ""
}) {
  const [query, setQuery] = useState(value);
  const timeoutRef = useRef(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debouncedSearch = useCallback(
    (searchTerm) => {
      if (!onSearch) return;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        onSearch(searchTerm);
      }, delay);
    },
    [onSearch, delay]
  );

  const handleChange = useCallback(
    (e) => {
      const newValue = e.target.value;
      setQuery(newValue);
      if (onChange) onChange(newValue);
      debouncedSearch(newValue);
    },
    [onChange, debouncedSearch]
  );

  const handleClear = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setQuery("");
    if (onChange) onChange("");
    if (onSearch) onSearch("");
  }, [onChange, onSearch]);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (onSearch) onSearch(query);
    },
    [query, onSearch]
  );

  return (
    <form 
      className={`searchbar${className ? ` ${className}` : ""}`} 
      role="search" 
      onSubmit={handleSubmit}
      noValidate
    >
      <label className="sr-only" htmlFor={id}>
        {ariaLabel}
      </label>

      <span className="searchbar-icon" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path 
            d="M21 21l-4.2-4.2" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round"
          />
          <circle 
            cx="11" 
            cy="11" 
            r="7" 
            stroke="currentColor" 
            strokeWidth="2"
          />
        </svg>
      </span>

      <input
        id={id}
        name={name}
        type="search"
        className="searchbar-input"
        placeholder={placeholder}
        value={query}
        onChange={handleChange}
        autoFocus={autoFocus}
        autoComplete="off"
        aria-label={ariaLabel}
      />

      {query && (
        <button
          type="button"
          className="searchbar-clear"
          onClick={handleClear}
          aria-label="Clear search"
          title="Clear"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M18 6L6 18M6 6l12 12" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}

      <button 
        type="submit" 
        className="searchbar-submit" 
        aria-label="Submit search"
      >
        Search
      </button>
    </form>
  );
}
