'use client';
import React from 'react';
import styles from '@/styles/admin/dashboard.styles';
import ResponsiveTable from '../ResponsiveTable';

const getSampleTypeColor = (type) => {
  const colors = {
    water: '#3b82f6',
    soil: '#92400e',
    plant: '#10b981',
    biological_fluid: '#ef4444',
  };
  return colors[type] || '#6b7280';
};

const getStatusColor = (status) => {
  const colors = {
    pending: '#f59e0b',
    approved: '#10b981',
    rejected: '#ef4444',
    under_review: '#3b82f6',
  };
  return colors[status] || '#6b7280';
};

export default function SamplesTable({ samples, sortBy, sortOrder, onSort, onView, onEdit, onApproveReject, onDelete }) {
  return (
    
  
    <div style={styles.tableContainer}>
      <ResponsiveTable minWidth="900px" style={styles.table}>
        <thead>
          <tr>
            <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => onSort('samples_id')}>
              ID {sortBy === 'samples_id' && (sortOrder === 'ASC' ? '↑' : '↓')}
            </th>
            <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => onSort('sample_identifier')}>
              Sample Name {sortBy === 'sample_identifier' && (sortOrder === 'ASC' ? '↑' : '↓')}
            </th>
            <th style={styles.th}>Type</th>
            <th style={styles.th}>User</th>
            <th style={styles.th}>Status</th>
            <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => onSort('collection_datetime')}>
              Collection Date {sortBy === 'collection_datetime' && (sortOrder === 'ASC' ? '↑' : '↓')}
            </th>
            <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => onSort('ph')}>
              pH {sortBy === 'ph' && (sortOrder === 'ASC' ? '↑' : '↓')}
            </th>
            <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => onSort('temperature')}>
              Temp (°C) {sortBy === 'temperature' && (sortOrder === 'ASC' ? '↑' : '↓')}
            </th>
            <th style={styles.th}>Location</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {samples.length === 0 ? (
            <tr>
              <td colSpan="10" style={{ ...styles.td, textAlign: 'center', padding: '48px 20px', color: '#6b7280' }}>
                No samples found
              </td>
            </tr>
          ) : (
            samples.map(sample => (
              <tr key={sample.samples_id} style={styles.tr}>
                <td style={styles.td}>{sample.samples_id}</td>
                <td style={styles.td}>
                  <strong>{sample.sample_identifier}</strong>
                </td>
                <td style={styles.td}>
                  <span style={{ ...styles.badge, backgroundColor: getSampleTypeColor(sample.sample_type), textTransform: 'capitalize' }}>
                    {sample.sample_type?.replace('_', ' ')}
                  </span>
                </td>
                <td style={styles.td}>
                  <div>
                    <div style={{ fontWeight: '500' }}>{sample.user.first_name || 'N/A'}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{sample.email}</div>
                  </div>
                </td>
                <td style={styles.td}>
                  <span style={{ ...styles.badge, backgroundColor: getStatusColor(sample.status), textTransform: 'capitalize' }}>
                    {sample.status?.replace('_', ' ')}
                  </span>
                </td>
                <td style={styles.td}>
                  {sample.collection_datetime
                    ? new Date(sample.collection_datetime).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                    : '—'}
                </td>
                <td style={styles.td}>
                  {sample.ph ? <span style={{ color: sample.ph >= 7 ? '#10b981' : sample.ph >= 4 ? '#f59e0b' : '#ef4444', fontWeight: '500' }}>{sample.ph}</span> : 'N/A'}
                </td>
                <td style={styles.td}>{sample.temperature ? `${sample.temperature}°` : 'N/A'}</td>
                <td style={styles.td}>
                  {sample.geolocation ? (
                    <div style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {sample.geolocation}
                    </div>
                  ) : (
                    'N/A'
                  )}
                </td>
                <td style={{ ...styles.td, display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button style={{ ...styles.btnEdit, backgroundColor: '#3b82f6', padding: '4px 8px', fontSize: '12px' }} onClick={() => onView(sample)}>View</button>
                  <button style={{ ...styles.btnEdit, padding: '4px 8px', fontSize: '12px' }} onClick={() => onEdit(sample)}>Edit</button>
                  {sample.status === 'pending' && (
                    <button style={{ ...styles.btnEdit, backgroundColor: '#f59e0b', padding: '4px 8px', fontSize: '12px' }} onClick={() => onApproveReject(sample)}>Review</button>
                  )}
                  <button style={{ ...styles.btnDelete, padding: '4px 8px', fontSize: '12px' }} onClick={() => onDelete(sample.samples_id)}>Delete</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </ResponsiveTable>
    </div>
  );
}
