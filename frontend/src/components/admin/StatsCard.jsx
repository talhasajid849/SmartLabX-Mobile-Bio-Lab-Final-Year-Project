"use client";


import React from 'react';

export default function StatsCard({ icon, title, value, color, subtitle }) {
  return (
    <div style={{
      background: '#ffffff',
      padding: '24px',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'default'
    }}
    onMouseOver={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
    }}
    >
      <div style={{ fontSize: '32px' }}>{icon}</div>
      <div>
        <div style={{ 
          fontSize: '14px', 
          color: '#6b7280',
          marginBottom: '4px',
          fontWeight: '500'
        }}>
          {title}
        </div>
        <div style={{ 
          fontSize: '32px', 
          fontWeight: '700',
          color: color,
          lineHeight: '1'
        }}>
          {value.toLocaleString()}
        </div>
        {subtitle && (
          <div style={{ 
            fontSize: '12px', 
            color: '#9ca3af',
            marginTop: '8px'
          }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
