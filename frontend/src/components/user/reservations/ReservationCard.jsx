'use client';
import '@/styles/user/reservations.styles.css';

export default function ReservationCard({ reservation, onCancel }) {
  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      confirmed: '#10b981',
      completed: '#6366f1',
      cancelled: '#ef4444',
    };
    return colors[status] || '#6b7280';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (time) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="reservationCard">
      <div
        className="reservationCardHeader"
        style={{ borderLeft: `4px solid ${getStatusColor(reservation.status)}` }}
      >
        <div className="reservationInfo">
          <h3 className="reservationDate">{formatDate(reservation.request_date)}</h3>
          <p className="reservationTime">🕐 {formatTime(reservation.request_time)}</p>
        </div>
        <span
          className="statusBadge"
          style={{ backgroundColor: getStatusColor(reservation.status) }}
        >
          {reservation.status}
        </span>
      </div>

      <div className="reservationCardBody">
        {reservation.purpose && (
          <div className="reservationDetail">
            <span className="detailLabel">Purpose:</span>
            <span className="detailValue">{reservation.purpose}</span>
          </div>
        )}

        <div className="reservationDetail">
          <span className="detailLabel">Booking ID:</span>
          <span className="detailValue">#{reservation.request_id}</span>
        </div>

        <div className="reservationDetail">
          <span className="detailLabel">Created:</span>
          <span className="detailValue">{new Date(reservation.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="reservationCardFooter">
        {reservation.status === 'pending' && (
          <button
            className="btnCancel"
            onClick={() => onCancel(reservation.request_id)}
          >
            Cancel Booking
          </button>
        )}
        {reservation.status === 'confirmed' && (
          <div className="confirmedMessage">✅ Your booking is confirmed!</div>
        )}
      </div>
    </div>
  );
}
