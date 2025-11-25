'use client';
import React from 'react';
import styles from '@/styles/admin/dashboard.styles';

export default function PaginationControls({ pagination, onPageChange }) {
  if (pagination.totalPages <= 1) return null;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '24px', padding: '16px 0' }}>
      <button
        style={{ ...styles.btnSecondary, padding: '8px 16px', opacity: pagination.page === 1 ? 0.5 : 1, cursor: pagination.page === 1 ? 'not-allowed' : 'pointer' }}
        onClick={() => onPageChange(pagination.page - 1)}
        disabled={pagination.page === 1}
      >
        Previous
      </button>

      <span style={{ color: '#6b7280', fontSize: '14px' }}>
        Page {pagination.page} of {pagination.totalPages}
      </span>

      <button
        style={{ ...styles.btnSecondary, padding: '8px 16px', opacity: pagination.page === pagination.totalPages ? 0.5 : 1, cursor: pagination.page === pagination.totalPages ? 'not-allowed' : 'pointer' }}
        onClick={() => onPageChange(pagination.page + 1)}
        disabled={pagination.page === pagination.totalPages}
      >
        Next
      </button>
    </div>
  );
}
