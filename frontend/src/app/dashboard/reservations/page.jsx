"use client";
import { useState, useEffect, useCallback, memo } from "react";
import { toast } from "react-toastify";
import Link from "next/link";
import "@/styles/user/reservations.styles.css";
import axios from "axios";
import { server } from "@/server/servert";
import LoadMoreButton from "@/components/common/LoadMoreButton";
import useLoadMore from "@/hooks/useLoadMore";
import LoadingSpinner from "@/components/visitor/LoadingSpinner";

export default function ReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { visibleData, loadMore, hasMore } = useLoadMore(reservations, 9);

  const loadReservations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${server}/reservations/my`, {
        withCredentials: true,
      });
      setReservations(response.data.requests || []);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load reservations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this reservation?")) return;

    try {
      await axios.put(
        `${server}/reservations/${id}/cancel`,
        {},
        {
          withCredentials: true,
        }
      );
      toast.success("Reservation cancelled!");
      loadReservations();
    } catch (error) {
      toast.error("Failed to cancel reservation");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "#f59e0b",
      confirmed: "#10b981",
      completed: "#6366f1",
      cancelled: "#ef4444",
    };
    return colors[status] || "#6b7280";
  };

  if (loading) {
    return (
      <LoadingSpinner name='Loading reservations...' />
    );
  }

  return (
    <div className="reservationsPage">
      <div className="pageHeader">
        <h1 className="pageTitle">My Reservations</h1>
        <Link href="/dashboard/reservations/new">
          <button className="primaryBtn">➕ New Reservation</button>
        </Link>
      </div>

      {reservations.length === 0 ? (
        <div className="emptyState">
          <p>No reservations yet</p>
        </div>
      ) : (
        <div className="reservationsGrid">
          {visibleData.map((res) => (
            <ReservationCard
              key={res.request_id}
              res={res}
              handleCancel={handleCancel}
              getStatusColor={getStatusColor}
            />
          ))}
        </div>
      )}
      {hasMore && <LoadMoreButton onClick={loadMore} />}
    </div>
  );
}

// Reservation CArd
const ReservationCard = memo(function ReservationCard({
  res,
  handleCancel,
  getStatusColor,
}) {
  return (
    <div className="reservationCard">
      <div className="reservationCardHeader">
        <h3>Lab Reservation #{res.request_id}</h3>
        <span
          className="statusBadge"
          style={{ backgroundColor: getStatusColor(res.status) }}
        >
          {res.status}
        </span>
      </div>
      <div className="reservationCardBody">
        <p>
          <strong>Date:</strong>{" "}
          {new Date(res.request_date).toLocaleDateString()}
        </p>
        <p>
          <strong>Time:</strong>{" "}
          {new Date(res.request_time).toLocaleTimeString("en-PK", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
            timeZone: "Asia/Karachi",
          })}
        </p>
        <p>
          <strong>Purpose:</strong> {res.purpose || "N/A"}
        </p>
      </div>
      {res.status === "pending" && (
        <div className="reservationCardFooter">
          <button
            onClick={() => handleCancel(res.request_id)}
            className="btnCancel"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
});
