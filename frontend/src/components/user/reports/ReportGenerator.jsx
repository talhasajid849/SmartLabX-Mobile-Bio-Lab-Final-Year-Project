
'use client';
import { useState } from 'react';
import styles from '@/styles/user/ReportGenerator.module.css';

export default function ReportGenerator({ sample, onClose }) {
  const [reportTitle, setReportTitle] = useState('');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [emailAddress, setEmailAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [reportId, setReportId] = useState(null);
  const [shareLink, setShareLink] = useState('');

  const generateReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/reports/generate/${sample.samples_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: reportTitle,
          includeCharts
        })
      });

      if (res.ok) {
        const data = await res.json();
        setReportId(data.report.report_id);
        alert('Report generated successfully!');
      } else {
        alert('Failed to generate report');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = async () => {
    if (!reportId) return;

    try {
      const res = await fetch(`http://localhost:5000/api/reports/${reportId}/export`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportTitle || 'report'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to export PDF');
    }
  };

  const shareViaEmail = async () => {
    if (!emailAddress || !reportId) return;

    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/reports/${reportId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          email: emailAddress
        })
      });

      if (res.ok) {
        alert('Report shared via email successfully!');
        setEmailAddress('');
      } else {
        alert('Failed to share report');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to share report');
    } finally {
      setLoading(false);
    }
  };

  const generateShareLink = async () => {
    if (!reportId) return;

    try {
      const res = await fetch(`http://localhost:5000/api/reports/${reportId}/share-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        const link = `${window.location.origin}/shared/report/${data.shareToken}`;
        setShareLink(link);
        setShowShareModal(true);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to generate share link');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    alert('Link copied to clipboard!');
  };

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <h2>Generate Report</h2>
        
        <div className={styles.sampleInfo}>
          <strong>Sample:</strong> {sample.sample_identifier}
          <br />
          <strong>Type:</strong> {sample.sample_type}
          <br />
          <strong>Date:</strong> {new Date(sample.collection_datetime).toLocaleDateString()}
        </div>

        {!reportId ? (
          <div className={styles.generateSection}>
            <div className={styles.group}>
              <label>Report Title *</label>
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="e.g., Water Quality Analysis Report"
              />
            </div>

            <div className={styles.checkbox}>
              <input
                type="checkbox"
                id="includeCharts"
                checked={includeCharts}
                onChange={(e) => setIncludeCharts(e.target.checked)}
              />
              <label htmlFor="includeCharts">Include data visualization charts</label>
            </div>

            <button 
              onClick={generateReport}
              disabled={loading || !reportTitle}
              className={styles.generateBtn}
            >
              {loading ? 'Generating...' : '📄 Generate Report'}
            </button>
          </div>
        ) : (
          <div className={styles.actionsSection}>
            <h3>Report Generated Successfully!</h3>
            
            <div className={styles.actionButtons}>
              <button onClick={exportToPDF} className={styles.actionBtn}>
                📥 Download PDF
              </button>
              <button onClick={generateShareLink} className={styles.actionBtn}>
                🔗 Get Share Link
              </button>
            </div>

            <div className={styles.emailSection}>
              <h4>Share via Email</h4>
              <div className={styles.emailForm}>
                <input
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  placeholder="recipient@example.com"
                />
                <button 
                  onClick={shareViaEmail}
                  disabled={loading || !emailAddress}
                >
                  {loading ? 'Sending...' : '📧 Send'}
                </button>
              </div>
            </div>
          </div>
        )}

        <button onClick={onClose} className={styles.closeBtn}>Close</button>

        {showShareModal && (
          <div className={styles.shareLinkModal}>
            <div className={styles.shareLinkContent}>
              <h3>Share Link Generated</h3>
              <div className={styles.linkBox}>
                <input type="text" value={shareLink} readOnly />
                <button onClick={copyToClipboard}>📋 Copy</button>
              </div>
              <button onClick={() => setShowShareModal(false)}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}