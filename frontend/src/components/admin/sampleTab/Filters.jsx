'use client';
import React from 'react';
import styles from '@/styles/admin/dashboard.styles';

export default function Filters({ typeFilter, setTypeFilter, statusFilter, setStatusFilter, setPagination }) {
  return (
    <>
      <select
        style={{
          ...styles.input,
          width: 'auto',
          minWidth: '160px',
          padding: '10px 14px',
          borderRadius: '8px',
          backgroundColor: '#2563eb',
          cursor: 'pointer',
        }}
        value={typeFilter}
        onChange={(e) => {
          setTypeFilter(e.target.value);
          setPagination(prev => ({ ...prev, page: 1 }));
        }}
      >
        <option value="all">All Types</option>
        <option value="water">Water</option>
        <option value="soil">Soil</option>
        <option value="plant">Plant</option>
        <option value="biological_fluid">Biological Fluid</option>
      </select>

      <select
        style={{
          ...styles.input,
          width: 'auto',
          minWidth: '160px',
          padding: '10px 14px',
          borderRadius: '8px',
          backgroundColor: '#2563eb',
          cursor: 'pointer',
        }}
        value={statusFilter}
        onChange={(e) => {
          setStatusFilter(e.target.value);
          setPagination(prev => ({ ...prev, page: 1 }));
        }}
      >
        <option value="all">All Status</option>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
        <option value="under_review">Under Review</option>
      </select>
    </>
  );
}
