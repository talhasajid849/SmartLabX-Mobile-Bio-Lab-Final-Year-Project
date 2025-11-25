'use client'
import { useState, useMemo } from "react";

export default function useLoadMore(data = [], itemsPerPage = 9) {
  const [displayCount, setDisplayCount] = useState(itemsPerPage);

  const visibleData = useMemo(() => {
    return data.slice(0, displayCount);
  }, [data, displayCount]);

  const hasMore = displayCount < data.length;

  const loadMore = () => {
    setDisplayCount(prev => prev + itemsPerPage);
  };

  return { visibleData, loadMore, displayCount, hasMore };
}
