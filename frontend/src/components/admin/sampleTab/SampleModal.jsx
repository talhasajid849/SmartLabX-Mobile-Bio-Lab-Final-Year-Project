'use client';
import React from 'react';
import styles from '@/styles/admin/dashboard.styles';

const getStatusColor = (status) => {
  const colors = {
    pending: '#f59e0b',
    approved: '#10b981',
    rejected: '#ef4444',
    under_review: '#3b82f6',
  };
  return colors[status] || '#6b7280';
};

export default function SampleModal({ sample, mode, onClose, editFormData, setEditFormData, onUpdateSample, onUpdateStatus, onExportPDF }) {
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.modalTitle}>
          {mode === 'view' && 'Sample Details'}
          {mode === 'edit' && 'Edit Sample'}
          {mode === 'approve' && 'Review Sample'}
        </h2>

        {mode === 'view' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' ,}}>
            <div style={styles.formGroup}><label style={styles.label}>Sample ID :</label><div style={styles.sampleModelData}>{sample.sample_identifier}</div></div>
            <div style={styles.formGroup}><label style={styles.label}>Type :</label><div style={styles.sampleModelData}>{sample.sample_type}</div></div>
            <div style={styles.formGroup}><label style={styles.label}>User :</label><div style={styles.sampleModelData}>{sample.user.first_name} ({sample.user.email})</div></div>
            <div style={styles.formGroup}><label style={styles.label}>Status :</label><span style={{ ...styles.badge, backgroundColor: getStatusColor(sample.status) }}>{sample.status}</span></div>
            <div style={styles.formGroup}><label style={styles.label}>pH :</label><div style={styles.sampleModelData}>{sample.ph || 'N/A'}</div></div>
            <div style={styles.formGroup}><label style={styles.label}>Temperature :</label><div style={styles.sampleModelData}>{sample.temperature || 'N/A'}°C</div></div>
            <div style={styles.formGroup}><label style={styles.label}>Salinity :</label><div style={styles.sampleModelData}>{sample.salinity || 'N/A'}‰</div></div>
            <div style={styles.formGroup}><label style={styles.label}>Location :</label><div style={styles.sampleModelData}>{sample.geolocation || 'N/A'}</div></div>
            <div style={styles.formGroup}><label style={styles.label}>Notes :</label><div style={styles.sampleModelData}>{sample.notes || 'No notes'}</div></div>

            <div style={styles.modalActions}>
              <button style={styles.btnPrimary} onClick={() => onExportPDF(sample.samples_id)}>Export PDF</button>
              <button style={styles.btnSecondary} onClick={onClose}>Close</button>
            </div>
          </div>
        )}

        {mode === 'edit' && (
          <form style={styles.form} onSubmit={(e) => { e.preventDefault(); onUpdateSample(); }}>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Sample Type</label>
                <select style={styles.input} value={editFormData.sample_type} onChange={(e) => setEditFormData({ ...editFormData, sample_type: e.target.value })}>
                  <option value="water">Water</option>
                  <option value="soil">Soil</option>
                  <option value="plant">Plant</option>
                  <option value="biological_fluid">Biological Fluid</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Status</label>
                <select style={styles.input} value={editFormData.status} onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="under_review">Under Review</option>
                </select>
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>pH</label>
                <input type="number" step="0.1" style={styles.input} value={editFormData.ph} onChange={(e) => setEditFormData({ ...editFormData, ph: e.target.value })} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Temperature (°C)</label>
                <input type="number" step="0.1" style={styles.input} value={editFormData.temperature} onChange={(e) => setEditFormData({ ...editFormData, temperature: e.target.value })} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Salinity (‰)</label>
                <input type="number" step="0.1" style={styles.input} value={editFormData.salinity} onChange={(e) => setEditFormData({ ...editFormData, salinity: e.target.value })} />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Geolocation</label>
              <input type="text" style={styles.input} value={editFormData.geolocation} onChange={(e) => setEditFormData({ ...editFormData, geolocation: e.target.value })} />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Notes</label>
              <textarea style={{ ...styles.input, minHeight: '100px', resize: 'vertical' }} value={editFormData.notes} onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })} />
            </div>

            <div style={styles.modalActions}>
              <button type="submit" style={styles.btnPrimary}>Save Changes</button>
              <button type="button" style={styles.btnSecondary} onClick={onClose}>Cancel</button>
            </div>
          </form>
        )}

        {mode === 'approve' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <p style={{ margin: '0 0 8px 0', fontWeight: '600' , color: '#6b7280' }}>Sample: {sample.sample_identifier}</p>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6b7280' }}>User: {sample.user.first_name} ({sample.user.email})</p>
              <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>Type: {sample.sample_type} | pH: {sample.ph || 'N/A'}</p>
            </div>
            <p style={{ margin: 0, color: '#475569' }}>
              Review this sample and choose an action:
            </p>
            <div style={styles.modalActions}>
              <button style={{ ...styles.btnPrimary, backgroundColor: '#10b981' }} onClick={() => onUpdateStatus('approved')}>✓ Approve</button>
              <button style={{ ...styles.btnPrimary, backgroundColor: '#f59e0b' }} onClick={() => onUpdateStatus('under_review')}>⚠ Under Review</button>
              <button style={{ ...styles.btnPrimary, backgroundColor: '#ef4444' }} onClick={() => onUpdateStatus('rejected')}>✗ Reject</button>
              <button style={styles.btnSecondary} onClick={onClose}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
