"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import styles from "@/styles/admin/dashboard.styles";
import { toast } from "react-toastify";
import SearchBar from "@/components/common/SearchBar";
import Pagination from "@/components/common/Pagination";
import { useDebounce } from "@/hooks/useDebounce";
import {
  loadReservations,
  updateReservationStatus,
} from "@/store/actions/reservation.action";
import ResponsiveTable from "@/components/admin/ResponsiveTable";

export default function ReservationsTab() {
  const dispatch = useDispatch();
  const { reservations, loading, pagination } = useSelector(
    (state) => state.reservations
  );

  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);

  // Debounce search query with 500ms delay
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Load reservations when debounced search, filter, or page changes
  useEffect(() => {
    dispatch(loadReservations(currentPage, limit, debouncedSearchQuery, filter));
  }, [dispatch, currentPage, limit, debouncedSearchQuery, filter]);

  const handleSearch = useCallback((query) => {
    const trimmedQuery = query?.trim() || "";
    setSearchQuery(trimmedQuery);
    setCurrentPage(1); // Reset to first page on new search
  }, []);

  const handleFilterChange = useCallback((newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1); // Reset to first page on filter change
  }, []);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const updateStatus = useCallback(
    async (id, status) => {
      const result = await dispatch(updateReservationStatus(id, status));

      if (result.success) {
        toast.success(`Reservation ${status} successfully!`);
        // Reload current page
        dispatch(loadReservations(currentPage, limit, debouncedSearchQuery, filter));
      } else {
        toast.error(result.error || "Failed to update status");
      }
    },
    [dispatch, currentPage, limit, debouncedSearchQuery, filter]
  );

  const getStatusColor = (status) => {
    const colors = {
      pending: "#f59e0b",
      confirmed: "#10b981",
      cancelled: "#ef4444",
      completed: "#6366f1",
    };
    return colors[status] || "#6b7280";
  };

  if (loading && reservations.length === 0) {
    return (
      <div style={styles.tabContent}>
        <div style={{ textAlign: "center", padding: "40px" }}>
          Loading reservations...
        </div>
      </div>
    );
  }

  return (
    <div style={styles.tabContent}>
      {/* Header Section */}
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
        <h1 style={{ ...styles.pageTitle, margin: 0 }}>Lab Reservations</h1>

        {/* Search Bar */}
        <div
          style={{
            flex: "1 1 auto",
            maxWidth: "500px",
            minWidth: "250px",
          }}
        >
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onSearch={handleSearch}
            placeholder="Search by name, email, purpose, or status..."
            ariaLabel="Search reservations"
          />
        </div>

        {/* Status Filter Dropdown */}
        <select
          style={{
            ...styles.input,
            width: "auto",
            minWidth: "150px",
            padding: "10px 14px",
            borderRadius: "8px",
            border: "1px solid #000000ff",
            backgroundColor: "#2563eb",
            cursor: "pointer",
            color: "#fff",
          }}
          value={filter}
          onChange={(e) => handleFilterChange(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Results Count */}
      <p
        style={{
          margin: "0 0 16px 0",
          color: "#6b7280",
          fontSize: "14px",
        }}
      >
        Showing {reservations.length} of {pagination?.total || 0} reservation
        {pagination?.total !== 1 ? "s" : ""}
        {filter !== "all" && ` (${filter} only)`}
        {debouncedSearchQuery && ` matching "${debouncedSearchQuery}"`}
      </p>

      {/* Loading indicator while searching */}
      {loading && reservations.length > 0 && (
        <div style={{ 
          textAlign: "center", 
          padding: "10px", 
          color: "#6b7280",
          fontSize: "14px",
        }}>
          Updating results...
        </div>
      )}

      {/* Reservations Table */}
      <div style={styles.tableContainer}>
        <ResponsiveTable minWidth="900px" style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>User</th>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Time</th>
              <th style={styles.th}>Purpose</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reservations.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  style={{
                    ...styles.td,
                    textAlign: "center",
                    padding: "48px 20px",
                    color: "#6b7280",
                  }}
                >
                  {debouncedSearchQuery
                    ? `No reservations match "${debouncedSearchQuery}"`
                    : filter !== "all"
                    ? `No ${filter} reservations found`
                    : "No reservations found"}
                </td>
              </tr>
            ) : (
              reservations.map((res) => (
                <tr key={res.request_id} style={styles.tr}>
                  <td style={styles.td}>{res.request_id}</td>
                  <td style={styles.td}>
                    <div>
                      <strong>
                        {res.user?.first_name && res.user?.last_name
                          ? `${res.user.first_name} ${res.user.last_name}`
                          : "N/A"}
                      </strong>
                      {res.user?.email && (
                        <div style={{ fontSize: "12px", color: "#6b7280" }}>
                          {res.user.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td style={styles.td}>
                    {res.request_date
                      ? new Date(res.request_date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "—"}
                  </td>
                  <td style={styles.td}>
                    {res.request_time
                      ? new Date(res.request_time).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })
                      : "—"}
                  </td>
                  <td style={styles.td}>
                    {res.purpose ? (
                      <div
                        style={{
                          maxWidth: "200px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={res.purpose}
                      >
                        {res.purpose}
                      </div>
                    ) : (
                      "N/A"
                    )}
                  </td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.badge,
                        backgroundColor: getStatusColor(res.status),
                        textTransform: "capitalize",
                      }}
                    >
                      {res.status}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {res.status === "pending" && (
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <button
                          style={{
                            ...styles.btnEdit,
                            backgroundColor: "#10b981",
                            border: "none",
                            minWidth: "90px",
                          }}
                          onClick={() =>
                            updateStatus(res.request_id, "confirmed")
                          }
                          type="button"
                          aria-label={`Confirm reservation ${res.request_id}`}
                        >
                          ✓ Confirm
                        </button>
                        <button
                          style={{
                            ...styles.btnDelete,
                            minWidth: "90px",
                          }}
                          onClick={() =>
                            updateStatus(res.request_id, "cancelled")
                          }
                          type="button"
                          aria-label={`Cancel reservation ${res.request_id}`}
                        >
                          ✗ Cancel
                        </button>
                      </div>
                    )}
                    {res.status === "confirmed" && (
                      <button
                        style={{
                          ...styles.btnEdit,
                          backgroundColor: "#6366f1",
                          border: "none",
                          minWidth: "100px",
                        }}
                        onClick={() =>
                          updateStatus(res.request_id, "completed")
                        }
                        type="button"
                        aria-label={`Complete reservation ${res.request_id}`}
                      >
                        ✓ Complete
                      </button>
                    )}
                    {(res.status === "completed" ||
                      res.status === "cancelled") && (
                      <span style={{ color: "#94a3b8", fontSize: "13px" }}>
                        No actions
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </ResponsiveTable>
      </div>

      {/* Pagination Component */}
      {pagination?.totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}