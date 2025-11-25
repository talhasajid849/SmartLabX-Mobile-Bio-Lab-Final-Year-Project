"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { server } from "@/server/servert";
import styles from "@/styles/admin/dashboard.styles";
import { toast } from "react-toastify";

const AdminReportsTab = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // --------------------------
  // SAFE: reuse for refresh after delete/share
  // --------------------------
  const reloadReports = useCallback(async () => {
    try {
      const res = await axios.get(`${server}/reports/admin/all`, {
        withCredentials: true,
      });
      console.log(res, "iyguygiuyh");

      setReports(res.data.reports);
    } catch (err) {
      console.error("Error fetching reports:", err);
    }
  }, []);

  // --------------------------
  // initial load (runs once)
  // --------------------------
  useEffect(() => {
    const loadReports = async () => {
      try {
        const res = await axios.get(`${server}/reports/admin/all`, {
          withCredentials: true,
        });
        setReports(res.data.reports);
      } catch (err) {
        toast.error("Error loading reports:", err);
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  // --------------------------
  // Export PDF
  // --------------------------
  const handleExport = async (reportId) => {
    try {
      toast.info("Exporting report....");
      const response = await axios.get(
        `${server}/reports/admin/${reportId}/export`,
        {
          responseType: "blob",
          withCredentials: true, // <- include here
        }
      );

      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" })
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Report_${reportId}.pdf`);
      document.body.appendChild(link);
      link.click();
      toast.success("Report is exported");
      document.body.removeChild(link); // optional cleanup
      window.URL.revokeObjectURL(url); // free memory
    } catch (error) {
      console.error(error);
      toast.error("Failed to export report.");
    }
  };

  // --------------------------
  // Delete Report
  // --------------------------
  const handleDelete = async (reportId) => {
    try {
      if (window.confirm("Are you sure you want to delete this report?")) {
        await axios.delete(`${server}/reports/admin/${reportId}`, {
          withCredentials: true,
        });
        reloadReports();
      }
      toast.success("Report Deleted Successfully.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete report.");
    }
  };

  // --------------------------
  // Share Report via Email
  // --------------------------
  const handleShare = async (reportId) => {
    const email = prompt("Enter email to share report:");
    if (email) {
      await axios.post(`/api/admin/reports/${reportId}/share`, { email });
      alert("Report shared successfully");
    }
  };

  // --------------------------
  // UI RENDERING
  // --------------------------
  if (loading) {
    return (
      <div style={styles.container}>
        <p style={styles.loading}>Loading reports...</p>
      </div>
    );
  }

  return (
    <>
      <div style={styles.tabContent}>
        <div
          style={{
            ...styles.pageHeader,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            flexWrap: "wrap",
            marginBottom: "24px",
          }}
        >
          <h1 style={{ ...styles.pageTitle, margin: 0 }}>
           Admin Reports
          </h1>
        </div>

        {reports.length === 0 ? (
          <p style={styles.noData}>No reports available.</p>
        ) : (
          <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Title</th>
                <th style={styles.th}>User</th>
                <th style={styles.th}>Sample</th>
                <th style={styles.th}>Generated On</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {reports.map((report) => (
                <tr key={report.reportid}>
                  <td style={styles.td}>{report.report_id}</td>
                  <td style={styles.td}>{report.sample_identifier}</td>
                  <td style={styles.td}>{report.username}</td>
                  <td style={styles.td}>{report.sample_type}</td>
                  <td style={styles.td}>
                    {new Date(report.generated_on).toLocaleString()}
                  </td>

                  <td style={styles.td}>
                    <div style={styles.actions}>
                      <button
                        style={{
                          ...styles.btnEdit,
                          backgroundColor: "#3b82f6",
                        }}
                        onClick={() => handleExport(report.report_id)}
                      >
                        Export PDF
                      </button>

                      <button
                        style={{ ...styles.btnEdit }}
                        onClick={() => handleShare(report.report_id)}
                      >
                        Share
                      </button>

                      <button
                        style={{ ...styles.btnDelete }}
                        onClick={() => handleDelete(report.report_id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminReportsTab;
