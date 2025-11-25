"use client";

import { useState, useEffect } from "react";
import "@/styles/user/reservations.styles.css";
import { toast } from "react-toastify";
import axios from "axios";
import { server } from "@/server/servert";

// const mockCheckSlots = async (date) => {
//   await new Promise((resolve) => setTimeout(resolve, 500));
//   const bookedTimes = ["10:00:00", "14:00:00"];
//   const slots = [];

//   for (let hour = 9; hour < 17; hour++) {
//     const time = `${hour.toString().padStart(2, "0")}:00:00`;
//     slots.push({
//       time,
//       available: !bookedTimes.includes(time),
//     });
//   }

//   return slots;
// };

export default function ImprovedReservationFlow() {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [purpose, setPurpose] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (selectedDate) loadAvailableSlots(selectedDate);
  }, [selectedDate]);

  const loadAvailableSlots = async (date) => {
    setLoadingSlots(true);
    try {
      const { data } = await axios.get(`${server}/reservations/slots`, {
        params: { date },
        withCredentials: true,
      });
      // console.log(data.slots)
      setAvailableSlots(data.slots);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleDateSelect = (date) => {
    const formattedDate = new Date(date).toISOString().split("T")[0];
    setSelectedDate(formattedDate);
    setSelectedTime(null);
    setStep(2);
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    setStep(3);
  };

  const handleSubmit = async () => {
    if (!purpose.trim()) {
      toast.error("Please enter the purpose of your visit");
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(
        `${server}/reservations/`,
        {
          request_date: selectedDate,
          request_time: selectedTime,
          purpose,
        },
        {
          withCredentials: true,
        }
      );
      toast.success("Reservation submitted successfully!");

      setStep(1);
      setSelectedDate(null);
      setSelectedTime(null);
      setPurpose("");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (time24) => {
    const [hour] = time24.split(":");
    const h = parseInt(hour);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:00 ${ampm}`;
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return {
      daysInMonth: lastDay.getDate(),
      startingDayOfWeek: firstDay.getDay(),
    };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);

  const isPastDate = (day) => {
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isSelectedDate = (day) => {
    if (!selectedDate) return false;
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    return date.toISOString().split("T")[0] === selectedDate;
  };

  const isPastTime = (time) => {
    if (!selectedDate) return false;

    const now = new Date();
    const selected = new Date(selectedDate);

    // If the selected date is not today → no past time
    if (
      selected.getFullYear() !== now.getFullYear() ||
      selected.getMonth() !== now.getMonth() ||
      selected.getDate() !== now.getDate()
    ) {
      return false;
    }

    // Compare times
    const [hour] = time.split(":");
    const slotHour = parseInt(hour);
    const currentHour = now.getHours();

    return slotHour <= currentHour;
  };

  // console.log(selectedDate)

  return (
    <div className="reservation-container">
      <h1 className="page-title">Book Mobile Bio Lab</h1>
      {/* Progress Bar */}
      <div className="progress-wrapper">
        {[1, 2, 3].map((num) => (
          <div
            key={num}
            className={`progress-step ${step >= num ? "active" : ""}`}
          />
        ))}
      </div>
      {/* STEP 1 */}
      {step === 1 && (
        <SelectDateTab
          currentMonth={currentMonth}
          setCurrentMonth={setCurrentMonth}
          handleDateSelect={handleDateSelect}
          isPastDate={isPastDate}
          isSelectedDate={isSelectedDate}
          daysInMonth={daysInMonth}
          startingDayOfWeek={startingDayOfWeek}
        />
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <TimeSlotSelector
        isPastTime={isPastTime}
          selectedDate={selectedDate}
          availableSlots={availableSlots}
          loadingSlots={loadingSlots}
          selectedTime={selectedTime}
          handleTimeSelect={handleTimeSelect}
          setStep={setStep}
          formatTime={formatTime}
        />
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <BookingDetails
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          purpose={purpose}
          setPurpose={setPurpose}
          handleSubmit={handleSubmit}
          setStep={setStep}
          submitting={submitting}
          formatTime={formatTime}
        />
      )}
    </div>
  );
}

function SelectDateTab({
  currentMonth,
  setCurrentMonth,
  handleDateSelect,
  isPastDate,
  isSelectedDate,
  daysInMonth,
  startingDayOfWeek,
}) {
  return (
    <div className="card-box">
      <h2>Select a Date</h2>
      <div className="month-header">
        <button
          className="calender_btn"
          onClick={() =>
            setCurrentMonth(
              new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
            )
          }
        >
          ‹‹ Prev
        </button>
        <h3>
          {currentMonth.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </h3>
        <button
          className="calender_btn"
          onClick={() =>
            setCurrentMonth(
              new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
            )
          }
        >
          Next ››
        </button>
      </div>

      <div className="calendar-grid">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="calendar-day-label">
            {day}
          </div>
        ))}

        {[...Array(startingDayOfWeek)].map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {[...Array(daysInMonth)].map((_, i) => {
          const day = i + 1;
          const past = isPastDate(day);
          const selected = isSelectedDate(day);

          return (
            <button
              key={day}
              disabled={past}
              className={`calendar-day ${past ? "past" : ""} ${
                selected ? "selected" : ""
              }`}
              onClick={() =>
                handleDateSelect(
                  new Date(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth(),
                    day + 1
                  )
                    .toISOString()
                    .split("T")[0]
                )
              }
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TimeSlotSelector({
  isPastTime,
  selectedDate,
  availableSlots,
  loadingSlots,
  selectedTime,
  handleTimeSelect,
  setStep,
  formatTime,
}) {
  return (
    <div className="card-box">
      <h2 className="step-title">Step 2: Select a Time Slot</h2>

      <p className="selected-date-text">
        Selected Date:{" "}
        <strong>
          {new Date(selectedDate).toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </strong>
      </p>

      {loadingSlots ? (
        <div className="loading-wrapper">
          <div className="loader" />
          <p className="loading-text">Loading available slots...</p>
        </div>
      ) : (
        <div className="time-slot-grid">
          {availableSlots.map((slot) => (
            <button
              key={slot.time}
              disabled={!slot.available || isPastTime(slot.time)}
              className={`time-slot-btn 
      ${selectedTime === slot.time ? "selected" : ""} 
      ${!slot.available || isPastTime(slot.time) ? "booked" : ""}`}
              onClick={() => handleTimeSelect(slot.time)}
            >
              {formatTime(slot.time)}
              {!slot.available && <div className="booked-text">Booked</div>}
            </button>
          ))}
        </div>
      )}

      <div className="action-row">
        <button className="back-btn" onClick={() => setStep(1)}>
          ← Back
        </button>
        <button
          className={`next-btn ${selectedTime ? "active" : ""}`}
          disabled={!selectedTime}
          onClick={() => setStep(3)}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function BookingDetails({
  selectedDate,
  selectedTime,
  purpose,
  setPurpose,
  handleSubmit,
  setStep,
  submitting,
  formatTime,
}) {
  return (
    <div className="card-box">
      <h2 className="step-title">Step 3: Booking Details</h2>

      <div className="selection-box">
        <h3 className="selection-title">Your Selection</h3>

        <div className="selection-details">
          <div>
            <span>Date:</span>{" "}
            <strong>
              {new Date(selectedDate).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </strong>
          </div>

          <div>
            <span>Time:</span> <strong>{formatTime(selectedTime)}</strong>
          </div>
        </div>
      </div>

      <label className="label">Purpose of Visit *</label>
      <textarea
        value={purpose}
        onChange={(e) => setPurpose(e.target.value)}
        className="purpose-input"
        placeholder="Describe the purpose of your lab session..."
      />

      <div className="action-row">
        <button className="back-btn" onClick={() => setStep(2)}>
          ← Back
        </button>

        <button
          className={`submit-btn ${
            purpose.trim() && !submitting ? "active" : ""
          }`}
          disabled={submitting || !purpose.trim()}
          onClick={handleSubmit}
        >
          {submitting ? "Booking..." : "Confirm Booking"}
        </button>
      </div>
    </div>
  );
}
