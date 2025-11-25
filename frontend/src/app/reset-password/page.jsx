'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-toastify';
import { server } from '@/server/servert';
import { useDispatch, useSelector } from 'react-redux';
import { loadUser } from '@/store/actions/auth.action';
import LoadingSpinner from '@/components/visitor/LoadingSpinner';

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [loadinge, setLoading] = useState(false);
  const [token, setToken] = useState('');
  const router = useRouter();
   const dispatch = useDispatch();
  const { isAuthenticated, loading } = useSelector((state) => state.user)

  // Wait until the token is available
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const t = urlParams.get('token'); // get ?token=...
    if (t) setToken(t);
  }, []);

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated && !loading) {
      return router.push('/dashboard');
    }
  }, [loading, isAuthenticated, router]);


  if (isAuthenticated && !loading) {
    return <LoadingSpinner />;
  }

  

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }

    try {
      setLoading(true);
      await axios.post(`${server}/auth/reset-password`, { token, newPassword });
      toast.success('Password reset successfully! You can now login.');
      router.push('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.logo}>🔬 Mobile Bio Lab</h1>
          <h2 style={styles.title}>Reset Your Password</h2>
          <p style={styles.subtitle}>Enter a new password for your account</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>New Password</label>
            <input
              type="password"
              style={styles.input}
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            style={{ ...styles.button, opacity: loadinge ? 0.7 : 1 }}
            disabled={loadinge || !token}
          >
            {loadinge ? 'Resetting...' : 'Reset Password'}
          </button>

          <p style={styles.footer}>
            Remembered your password?{' '}
            <a href="/login" style={styles.link}>
              Login here
            </a>
          </p>
        </form>
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
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '48px 40px',
    maxWidth: '450px',
    width: '100%',
    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  logo: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#3b82f6',
    marginBottom: '16px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '16px',
    color: '#64748b',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#475569',
  },
  input: {
    padding: '12px 16px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '15px',
    color: '#111827',
    fontFamily: 'inherit',
  },
  button: {
    padding: '14px 32px',
    backgroundColor: '#3b82f6',
    border: 'none',
    color: 'white',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
  },
  footer: {
    textAlign: 'center',
    fontSize: '14px',
    color: '#64748b',
    marginTop: '16px',
  },
  link: {
    color: '#3b82f6',
    textDecoration: 'none',
    fontWeight: '600',
  },
};
