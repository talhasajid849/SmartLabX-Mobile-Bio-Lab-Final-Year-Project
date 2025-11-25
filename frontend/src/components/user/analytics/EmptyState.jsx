"use client";
import styles from "@/styles/user/analytics.module.css";

export default function EmptyState({ filters }) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>📊</div>
      <h3>No Data Available</h3>
      <p>
        {filters.sampleType !== "all" ||
        filters.startDate ||
        filters.endDate
          ? "No samples match your filter criteria"
          : "Start collecting samples to see analytics"}
      </p>
    </div>
  );
}
