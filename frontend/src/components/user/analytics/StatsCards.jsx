"use client";
import styles from "@/styles/user/analytics.module.css";

export default function StatsCards({ stats }) {
  return (
    <div className={styles.statsGrid}>
      <div className={styles.statCard}>
        <div className={styles.statIcon}>🧪</div>
        <div className={styles.statContent}>
          <span className={styles.statLabel}>Total Samples</span>
          <span className={styles.statValue}>{stats.totalSamples}</span>
        </div>
      </div>

      <div className={styles.statCard}>
        <div className={styles.statIcon}>⚗️</div>
        <div className={styles.statContent}>
          <span className={styles.statLabel}>Avg pH Level</span>
          <span className={styles.statValue}>{stats.avgPh || "N/A"}</span>
        </div>
      </div>

      <div className={styles.statCard}>
        <div className={styles.statIcon}>🌡️</div>
        <div className={styles.statContent}>
          <span className={styles.statLabel}>Avg Temperature</span>
          <span className={styles.statValue}>
            {stats.avgTemp ? `${stats.avgTemp}°C` : "N/A"}
          </span>
        </div>
      </div>

      <div className={styles.statCard}>
        <div className={styles.statIcon}>💧</div>
        <div className={styles.statContent}>
          <span className={styles.statLabel}>Avg Salinity</span>
          <span className={styles.statValue}>
            {stats.avgSalinity ? `${stats.avgSalinity} ppt` : "N/A"}
          </span>
        </div>
      </div>
    </div>
  );
}
