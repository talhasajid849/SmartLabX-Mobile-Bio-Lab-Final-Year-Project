"use client";
import { useMemo } from "react";

/**
 * Custom hook to filter array data by keyword across multiple object keys
 * @param {Array} data - Array of objects to filter
 * @param {string} keyword - Search keyword
 * @param {string[]} keys - Array of object keys to search in
 * @returns {Array} Filtered array
 */
export function useSearch(data, keyword, keys = []) {
  return useMemo(() => {
    // Early return if no keyword
    if (!keyword || typeof keyword !== "string" || !keyword.trim()) {
      return data;
    }

    // Validate data is array
    if (!Array.isArray(data)) {
      console.warn("useSearch: data must be an array");
      return [];
    }

    // Validate keys is array
    if (!Array.isArray(keys) || keys.length === 0) {
      console.warn("useSearch: keys must be a non-empty array");
      return data;
    }

    const searchTerm = keyword.toLowerCase().trim();

    return data.filter((item) => {
      if (!item || typeof item !== "object") return false;

      return keys.some((key) => {
        const value = item[key];
        
        // Handle null/undefined
        if (value == null) return false;
        
        // Convert to string and search
        return String(value).toLowerCase().includes(searchTerm);
      });
    });
  }, [data, keyword, keys]);
}
