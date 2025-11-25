'use client';
import { useState } from 'react';
import '@/styles/user/reservations.styles.css';

export default function Calendar({ onDateSelect }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day) => {
    const selected = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selected < today) {
      alert('Cannot book dates in the past');
      return;
    }
    setSelectedDate(selected);
    onDateSelect(selected.toISOString().split('T')[0]);
  };

  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear();
  };

  const isPast = (day) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  return (
    <div className="calendarContainer">
      <div className="calendarHeader">
        <button className="calendarNavBtn" onClick={previousMonth}>‹</button>
        <h3 className="calendarTitle">
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        <button className="calendarNavBtn" onClick={nextMonth}>›</button>
      </div>

      <div className="calendarGrid">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(day => (
          <div key={day} className="calendarDayName">{day}</div>
        ))}

        {[...Array(startingDayOfWeek)].map((_, index) => (
          <div key={`empty-${index}`} className="calendarDayEmpty"></div>
        ))}

        {[...Array(daysInMonth)].map((_, index) => {
          const day = index + 1;
          return (
            <button
              key={day}
              className="calendarDay"
              style={{
                ...(isToday(day) ? { border: '2px solid #3b82f6', fontWeight: 600 } : {}),
                ...(isPast(day) ? { color: '#9ca3af', cursor: 'not-allowed' } : {})
              }}
              onClick={() => handleDateClick(day)}
              disabled={isPast(day)}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
