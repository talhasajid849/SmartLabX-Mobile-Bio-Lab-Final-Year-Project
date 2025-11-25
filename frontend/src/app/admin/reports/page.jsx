"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import styles from "@/styles/admin/dashboard.styles.js";
import { toast } from "react-toastify";
import SearchBar from "@/components/common/SearchBar";
import Pagination from "@/components/common/Pagination";
import { deleteReport, exportReportPDF, loadReports } from "@/store/actions/reports.action.js";
import LoadingSpinner from "@/components/visitor/LoadingSpinner";
import ResponsiveTable from "@/components/admin/ResponsiveTable";

const AdminReportsTab = () => {
  const dispatch = useDispatch();
  const { reports, loading, pagination } = useSelector((state) => state.reports);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);

  useEffect(() => {
    dispatch(loadReports(currentPage, limit, searchQuery));
  }, [dispatch, currentPage, limit, searchQuery]);

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handleExport = async (reportId) => {
    toast.info("Exporting report....");
    const result = dispatch(exportReportPDF(reportId));
  };
  console.log(reports)

  const handleDelete = async (reportId) => {
    if (window.confirm("Are you sure you want to delete this report?")) {
      const result = await dispatch(deleteReport(reportId));
      if (result.success) {
        toast.success("Report Deleted Successfully.");
        dispatch(loadReports(currentPage, limit, searchQuery));
      } else {
        toast.error(result.error || "Failed to delete report.");
      }
    }
  };

  const handleShare = async (reportId) => {
    const email = prompt("Enter email to share report:");
    if (email) {
      // TODO: Implement share functionality
      alert("Report shared successfully");
    }
  };

  if (loading && reports.length === 0) {
    return <LoadingSpinner name="Loading reports..." />
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

          {/* Search Bar */}
          <div style={{ 
            flex: '1 1 auto', 
            maxWidth: '500px',
            minWidth: '250px'
          }}>
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onSearch={handleSearch}
              placeholder="Search by title, user, sample..."
              ariaLabel="Search reports"
            />
          </div>
        </div>

        {/* Results Count */}
        <p style={{ 
          margin: '0 0 16px 0', 
          color: '#6b7280', 
          fontSize: '14px' 
        }}>
          Showing {reports.length} of {pagination?.total} report{pagination?.total !== 1 ? 's' : ''}
          {searchQuery && ` matching "${searchQuery}"`}
        </p>

        {reports.length === 0 ? (
          <p style={styles.noData}>
            {searchQuery ? `No reports match "${searchQuery}"` : 'No reports available.'}
          </p>
        ) : (
          <div style={styles.tableContainer}>
            <ResponsiveTable minWidth="900px" style={styles.table}>
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
                  <tr key={report.report_id}>
                    <td style={styles.td}>{report.report_id}</td>
                    <td style={styles.td}>{report.sample.sample_identifier}</td>
                    <td style={styles.td}>{report.user.first_name+ " " + report.user.last_name}</td>
                    <td style={styles.td}>{report.sample.sample_type}</td>
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
            </ResponsiveTable>
          </div>
        )}

        {/* Pagination */}
        {pagination?.totalPages > 1 && (
          <Pagination 
            currentPage={currentPage}
            totalPages={pagination?.totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </>
  );
};

export default AdminReportsTab;