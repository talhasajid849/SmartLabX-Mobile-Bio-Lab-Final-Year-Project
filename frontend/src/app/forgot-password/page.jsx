'use client';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { server } from '@/server/servert';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { loadUser } from '@/store/actions/auth.action';
import LoadingSpinner from '@/components/visitor/LoadingSpinner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loadinge, setLoading] = useState(false);
   const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated, loading } = useSelector((state) => state.user)

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
    if (!email) return toast.error("Email is required");

    try {
      setLoading(true);
      const { data } = await axios.post(`${server}/auth/forgot-password`, { email });
      toast.success("Password reset link sent! Check your email.");
      console.log("Reset Token (dev only):", data.token); // for development
      setEmail('');
    } catch (err) {
      console.error(err.response || err);
      toast.error(err.response?.data?.error || err.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.logo}>🔬 Mobile Bio Lab</h1>
          <h2 style={styles.title}>Forgot Password</h2>
          <p style={styles.subtitle}>Enter your email to reset your password</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              style={styles.input}
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            style={{ ...styles.btn, opacity: loadinge ? 0.7 : 1 }}
            disabled={loadinge}
          >
            {loadinge ? 'Sending...' : 'Send Reset Link'}
          </button>

          <p style={styles.footerText}>
            Remembered your password? <Link href="/login" style={styles.link}>Login here</Link>
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
    backgroundColor: '#f0f4f8',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '48px 40px',
    maxWidth: '450px',
    width: '100%',
    boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px'
  },
  logo: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#3b82f6',
    marginBottom: '16px'
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '8px'
  },
  subtitle: {
    fontSize: '16px',
    color: '#64748b'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#475569'
  },
  input: {
    padding: '12px 16px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '15px',
    color: '#1e293b',
    fontFamily: 'inherit'
  },
  btn: {
    padding: '14px 32px',
    backgroundColor: '#3b82f6',
    border: 'none',
    color: 'white',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px'
  },
  footerText: {
    textAlign: 'center',
    fontSize: '14px',
    color: '#64748b',
    marginTop: '12px'
  },
  link: {
    color: '#3b82f6',
    textDecoration: 'none',
    fontWeight: '600'
  }
};
