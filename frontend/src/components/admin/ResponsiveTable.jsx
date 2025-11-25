// /src/components/admin/ResponsiveTable.js
'use client';
import React from 'react';
import { useResponsive } from '@/hooks/useResponsive';
import styles from '@/styles/admin/dashboard.styles';

export default function ResponsiveTable({ children, minWidth = '800px' }) {
  const { isMobile } = useResponsive();

  return (
    <div style={styles.tableContainer}>
      {isMobile && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#fef3c7',
          color: '#92400e',
          fontSize: '13px',
          borderBottom: '1px solid #fcd34d'
        }}>
          💡 Tip: Scroll horizontally to view all columns
        </div>
      )}
      <div style={{
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}>
        <table style={{...styles.table, minWidth}}>
          {children}
        </table>
      </div>
    </div>
  );
}

// Mobile Card View Alternative Component
export function MobileCardView({ data, renderCard }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      {data.map((item, index) => (
        <div
          key={index}
          style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}
        >
          {renderCard(item)}
        </div>
      ))}
    </div>
  );
}