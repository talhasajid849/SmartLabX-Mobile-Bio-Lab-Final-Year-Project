"use client";
import React, { useState, useEffect, useCallback } from "react";
import styles from "@/styles/admin/dashboard.styles.js";
import axios from "axios";
import { server } from "@/server/servert.js";
import LoadingSpinner from "@/components/visitor/LoadingSpinner";

export default function SampleAnalyticsTab() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [sampleTypeFilter, setSampleTypeFilter] = useState("all");

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const filters = {};
      if (dateRange.startDate) filters.startDate = dateRange.startDate;
      if (dateRange.endDate) filters.endDate = dateRange.endDate;
      if (sampleTypeFilter !== "all") filters.sampleType = dateRange.endDate;

      const { data } = await axios.get(`${server}/samples/admin-chart`, {
        params: filters,
        withCredentials: true,
      });
      setAnalytics(data.analytics);
    } catch (err) {
      console.error("Failed to load analytics:", err);
      alert("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [dateRange.startDate, dateRange.endDate, sampleTypeFilter]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const handleApplyFilters = () => {
    loadAnalytics();
  };

  if (loading) {
    return (
      <div style={styles.tabContent}>
        <LoadingSpinner />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div style={styles.tabContent}>
        <div style={{ textAlign: "center", padding: "40px" }}>
          No analytics data available
        </div>
      </div>
    );
  }

  const { overview, samplesByType, samplesByStatus, samplesTrend, topUsers } =
    analytics;

  return (
    <div style={styles.tabContent}>
      {/* Header */}
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Sample Analytics</h1>
      </div>

      {/* Filters */}
      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "10px",
          marginBottom: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            alignItems: "end",
          }}
        >
          <div style={styles.formGroup}>
            <label style={styles.label}>Start Date</label>
            <input
              type="date"
              style={styles.input}
              value={dateRange.startDate}
              onChange={(e) =>
                setDateRange({ ...dateRange, startDate: e.target.value })
              }
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>End Date</label>
            <input
              type="date"
              style={styles.input}
              value={dateRange.endDate}
              onChange={(e) =>
                setDateRange({ ...dateRange, endDate: e.target.value })
              }
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Sample Type</label>
            <select
              style={styles.input}
              value={sampleTypeFilter}
              onChange={(e) => setSampleTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="water">Water</option>
              <option value="soil">Soil</option>
              <option value="plant">Plant</option>
              <option value="biological_fluid">Biological Fluid</option>
            </select>
          </div>
          <button style={styles.btnPrimary} onClick={handleApplyFilters}>
            Apply Filters
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div style={styles.statsGrid}>
        <div style={styles.statsCard}>
          <div
            style={{
              ...styles.statsIcon,
              backgroundColor: "#eff6ff",
              color: "#3b82f6",
            }}
          >
            📊
          </div>
          <div style={styles.statsContent}>
            <p style={styles.statsTitle}>Total Samples</p>
            <h3 style={styles.statsValue}>{overview.total_samples || 0}</h3>
          </div>
        </div>

        <div style={styles.statsCard}>
          <div
            style={{
              ...styles.statsIcon,
              backgroundColor: "#fef3c7",
              color: "#f59e0b",
            }}
          >
            ⏳
          </div>
          <div style={styles.statsContent}>
            <p style={styles.statsTitle}>Pending</p>
            <h3 style={styles.statsValue}>{overview.pending_samples || 0}</h3>
          </div>
        </div>

        <div style={styles.statsCard}>
          <div
            style={{
              ...styles.statsIcon,
              backgroundColor: "#d1fae5",
              color: "#10b981",
            }}
          >
            ✓
          </div>
          <div style={styles.statsContent}>
            <p style={styles.statsTitle}>Approved</p>
            <h3 style={styles.statsValue}>{overview.approved_samples || 0}</h3>
          </div>
        </div>

        <div style={styles.statsCard}>
          <div
            style={{
              ...styles.statsIcon,
              backgroundColor: "#fee2e2",
              color: "#ef4444",
            }}
          >
            ✗
          </div>
          <div style={styles.statsContent}>
            <p style={styles.statsTitle}>Rejected</p>
            <h3 style={styles.statsValue}>{overview.rejected_samples || 0}</h3>
          </div>
        </div>
      </div>

      {/* Environmental Averages */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
          marginTop: "20px",
        }}
      >
        <div style={styles.statsCard}>
          <div style={styles.statsContent}>
            <p style={styles.statsTitle}>Average pH</p>
            <h3 style={styles.statsValue}>{Math.floor(overview.avg_ph) || "N/A"}</h3>
          </div>
        </div>

        <div style={styles.statsCard}>
          <div style={styles.statsContent}>
            <p style={styles.statsTitle}>Average Temperature</p>
            <h3 style={styles.statsValue}>
              {overview.avg_temperature
                ? `${Math.floor(overview.avg_temperature)}°C`
                : "N/A"}
            </h3>
          </div>
        </div>

        <div style={styles.statsCard}>
          <div style={styles.statsContent}>
            <p style={styles.statsTitle}>Average Salinity</p>
            <h3 style={styles.statsValue}>
              {overview.avg_salinity ? `${Math.floor(overview.avg_salinity)}%` : "N/A"}
            </h3>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: "20px",
          marginTop: "24px",
        }}
      >
        {/* Samples by Type */}
        <div
          style={{
            backgroundColor: "white",
            padding: "24px",
            borderRadius: "10px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <h3
            style={{
              margin: "0 0 20px 0",
              fontSize: "18px",
              color: "#000",
              fontWeight: "600",
            }}
          >
            Samples by Type
          </h3>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {samplesByType.map((item, index) => (
              <div
                key={index}
                style={{
                  color: "#000",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px",
                  backgroundColor: "#f9fafb",
                  borderRadius: "8px",
                }}
              >
                <span
                  style={{ textTransform: "capitalize", fontWeight: "500" }}
                >
                  {item.sample_type.replace("_", " ")}
                </span>
                <span
                  style={{
                    padding: "4px 12px",
                    backgroundColor: "#3b82f6",
                    color: "white",
                    borderRadius: "12px",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Samples by Status */}
        <div
          style={{
            backgroundColor: "white",
            padding: "24px",
            borderRadius: "10px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <h3
            style={{
              margin: "0 0 20px 0",
              fontSize: "18px",
              fontWeight: "600",
              color: "#000",
            }}
          >
            Samples by Status
          </h3>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {samplesByStatus.map((item, index) => {
              const statusColors = {
                pending: "#f59e0b",
                approved: "#10b981",
                rejected: "#ef4444",
                under_review: "#3b82f6",
              };
              return (
                <div
                  key={index}
                  style={{
                    color: "#000",

                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px",
                    backgroundColor: "#f9fafb",
                    borderRadius: "8px",
                  }}
                >
                  <span
                    style={{ textTransform: "capitalize", fontWeight: "500" }}
                  >
                    {item.status.replace("_", " ")}
                  </span>
                  <span
                    style={{
                      padding: "4px 12px",
                      backgroundColor: statusColors[item.status] || "#6b7280",
                      color: "white",
                      borderRadius: "12px",
                      fontSize: "14px",
                      fontWeight: "600",
                    }}
                  >
                    {item.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Users */}
      <div
        style={{
          backgroundColor: "white",
          padding: "24px",
          borderRadius: "10px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          marginTop: "24px",
          color: "#000",
        }}
      >
        <h3
          style={{ margin: "0 0 20px 0", fontSize: "18px", fontWeight: "600" }}
        >
          Top Contributors
        </h3>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Rank</th>
                <th style={styles.th}>User</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Sample Count</th>
              </tr>
            </thead>
            <tbody>
              {topUsers.map((user, index) => (
                <tr key={user.users_id} style={styles.tr}>
                  <td style={styles.td}>
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        backgroundColor: index < 3 ? "#3b82f6" : "#e5e7eb",
                        color: index < 3 ? "white" : "#475569",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                      }}
                    >
                      {index + 1}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <strong>{user.user_name}</strong>
                  </td>
                  <td style={styles.td}>{user.email}</td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.badge,
                        backgroundColor: "#10b981",
                      }}
                    >
                      {user.sample_count}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Samples Trend */}
      {samplesTrend && samplesTrend.length > 0 && (
        <div
          style={{
            backgroundColor: "white",
            padding: "24px",
            borderRadius: "10px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            marginTop: "24px",
          }}
        >
          <h3
            style={{
              margin: "0 0 20px 0",
              fontSize: "18px",
              fontWeight: "600",
              color: "#000",
            }}
          >
            Sample Submissions (Last 30 Days)
          </h3>
          <div
            style={{
              display: "flex",
              alignItems: "end",
              gap: "4px",
              height: "200px",
              padding: "20px 0",
            }}
          >
            {samplesTrend.map((item, index) => {
              const maxCount = Math.max(...samplesTrend.map((t) => t.count));
              const height = (item.count / maxCount) * 100;
              return (
                <div
                  key={index}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: `${height}%`,
                      backgroundColor: "#3b82f6",
                      borderRadius: "4px 4px 0 0",
                      minHeight: "4px",
                      position: "relative",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        top: "-24px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#3b82f6",
                      }}
                    >
                      {item.count}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: "10px",
                      color: "#6b7280",
                      transform: "rotate(-45deg)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {new Date(item.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
