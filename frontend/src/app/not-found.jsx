'use client';
import React from 'react';

export default function NotFound() {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.errorCode}>404</h1>
        <h2 style={styles.errorTitle}>Page Not Found</h2>
        <p style={styles.errorMessage}>
          Oops! The page you are looking for does not exist.
        </p>
        <div style={styles.buttonGroup}>
          <button
            style={styles.btnPrimary}
            onClick={() => window.location.href = '/'}
          >
            Go Home
          </button>
          <button
            style={styles.btnSecondary}
            onClick={() => window.history.back()}
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  content: {
    textAlign: 'center',
    padding: '40px'
  },
  errorCode: {
    fontSize: '120px',
    fontWeight: '800',
    color: '#3b82f6',
    margin: '0 0 20px 0',
    lineHeight: 1
  },
  errorTitle: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 16px 0'
  },
  errorMessage: {
    fontSize: '18px',
    color: '#64748b',
    margin: '0 0 32px 0'
  },
  buttonGroup: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  btnPrimary: {
    padding: '14px 32px',
    backgroundColor: '#3b82f6',
    border: 'none',
    color: 'white',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit'
  },
  btnSecondary: {
    padding: '14px 32px',
    backgroundColor: 'transparent',
    border: '2px solid #3b82f6',
    color: '#3b82f6',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit'
  }
};