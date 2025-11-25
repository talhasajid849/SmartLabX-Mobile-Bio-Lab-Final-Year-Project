// app/dashboard/page.jsx
'use client';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import StatsCards from '@/components/user/StatsCards';
import QuickActions from '@/components/user/QuickActions';
import styles from "@/styles/user/dashboard.module.css";
import axios from 'axios';
import { server } from '@/server/servert';
import { useSelector } from 'react-redux';
import LoadingSpinner from '@/components/visitor/LoadingSpinner';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    samples: 0,
    reservations: 0,
    reports: 0,
    protocols: 0
  });
  const [loading, setLoading] = useState(true);
  const {user} = useSelector((state) => state.user)
// console.log(user)

 

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const [samplesRes, reservationsRes, reportsRes, protocolsRes] = await Promise.all([
        axios.get(`${server}/samples`, { withCredentials: true }),
        axios.get(`${server}/reservations/my`, { withCredentials: true }),
        axios.get(`${server}/reports`, { withCredentials: true }),
        axios.get(`${server}/protocols`, { withCredentials: true })
      ]);
      

      setStats({
        samples: samplesRes.data.samples?.length || 0,
        reservations: reservationsRes.data.requests?.length || 0,
        reports: reportsRes.data.reports?.length || 0,
        protocols: protocolsRes.data.protocols?.length || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  },[]);

   useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className={styles.dashboardPage}>
      <div className={styles.welcomeSection}>
        <div className={styles.welcomeContent}>
          <h1 className={styles.welcomeTitle}>
            Welcome back, {user.first_name}! 👋
          </h1>
          <p className={styles.welcomeSubtitle}>
            Here`s what`s happening with your Mobile Bio Lab today
          </p>
        </div>
        <div className={styles.welcomeIllustration}>
          <span className={styles.illustrationIcon}>🔬</span>
        </div>
      </div>

      <StatsCards stats={stats} />
      <QuickActions />
    </div>
  );
}
