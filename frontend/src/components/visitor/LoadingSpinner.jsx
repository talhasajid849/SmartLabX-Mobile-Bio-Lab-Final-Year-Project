'use client';
import React from 'react';

export default function LoadingSpinner({
  size = 50,
  color = '#3b82f6',
  showText = true,
  name = 'Mobile Bio Lab',
}) {
  return (
    <div style={wrapper}>
      <div
        className="smartlabx-spinner"
        style={{
          width: size,
          height: size,
          borderColor: `${color}40`,
          borderTopColor: color,
        }}
      />
      {showText && (
        <p style={{ marginTop: 12, color: color, fontWeight: 600 }}>
          {name}
        </p>
      )}
    </div>
  );
}

const wrapper = {
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

// Inject CSS once
if (typeof window !== 'undefined' && !document.getElementById('smartlabx-style')) {
  const style = document.createElement('style');
  style.id = 'smartlabx-style';
  style.innerHTML = `
    .smartlabx-spinner {
      border-width: 4px;
      border-style: solid;
      border-radius: 50%;
      animation: smart-spin 0.9s linear infinite, smart-pulse 1.5s ease-in-out infinite;
    }

    @keyframes smart-spin {
      to { transform: rotate(360deg); }
    }

    @keyframes smart-pulse {
      0%, 100% { transform: scale(1); opacity: 0.9; }
      50% { transform: scale(1.15); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}
