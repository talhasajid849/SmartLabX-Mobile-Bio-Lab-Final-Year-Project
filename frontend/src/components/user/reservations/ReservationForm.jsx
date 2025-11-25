'use client';
import { useState } from 'react';
import '@/styles/user/reservations.styles.css';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { server } from '@/server/servert';
import { toast } from 'react-toastify';

export default function ReservationForm({ date, time, onSubmit, onSuccess }) {
  const [formData, setFormData] = useState({ purpose: '' });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

   const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Current timestamp
      const currentDateTime = new Date().toISOString();

      // Prepare the final data object
      const reservationData = {
        ...formData,
        request_date : date, // passed prop
        request_time: time, // passed prop
        createdAt: currentDateTime,
      };

      // Send reservation data to backend
      const { data } = await axios.post(`${server}/reservations`, reservationData, {
        withCredentials: true,
      });

      toast.success('Reservation submitted successfully ✅');

      // Optional callback
      if (onSubmit) onSubmit(reservationData);
      if (onSuccess) onSuccess(data);

      // Redirect to reservations page
      setTimeout(() => {
        router.push('/dashboard/reservations');
      }, 1500);
    } catch (error) {
      console.error(error);
      const message =
        error.response?.data?.message || 'Failed to submit reservation ❌';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };
 


  return (
    <div className="reservationFormContainer">
      <h3 className="stepTitle">Booking Details</h3>

      <div className="bookingSummary">
        <h4 className="summaryTitle">Your Selection</h4>
        <div className="summaryItem">
          <span className="summaryLabel">Date:</span>
          <span className="summaryValue">
            {date ? new Date(date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }) : '-'}
          </span>
        </div>
        <div className="summaryItem">
          <span className="summaryLabel">Time:</span>
          <span className="summaryValue">{time || '-'}</span>
        </div>
      </div>

      <form className="form" onSubmit={handleSubmit}>
        <div className="formGroup">
          <label className="label">Purpose of Visit *</label>
          <textarea
            className="input"
            style={{ minHeight: '120px', resize: 'vertical' }}
            value={formData.purpose}
            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
            placeholder="Describe the purpose of your lab session..."
            required
          />
        </div>

        <div className="formActions">
          <button type="button" className="btnSecondary" onClick={() => {
            router.push('/dashboard/reservations')
          }}>← Back</button>
          <button type="submit" className="btnPrimary" disabled={loading}>
            {loading ? 'Booking...' : 'Confirm Booking'}
          </button>
        </div>
      </form>
    </div>
  );
}
