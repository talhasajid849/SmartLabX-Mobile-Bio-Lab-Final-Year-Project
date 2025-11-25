'use client';
import React, { useState, useEffect, useCallback } from 'react';
import styles from '@/styles/admin/dashboard.styles.js';
import axios from 'axios';
import { server } from '@/server/servert.js';
import StatsCard from '@/components/admin/StatsCard';
import LoadingSpinner from '@/components/visitor/LoadingSpinner';

export default function DashboardTab() {
  const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({});


  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      confirmed: '#10b981',
      cancelled: '#ef4444',
      completed: '#6366f1'
    };
    return colors[status] || '#6b7280';
  };

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${server}/admin/dashboard/stats`, {
        withCredentials: true,
      });
      if (res.data.success) setStats(res.data.stats);
      else toast.error("Failed to load dashboard stats");
    } catch (err) {
      console.error(err);
      toast.error("Failed to load dashboard statistics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if(loading){
    return (
      <LoadingSpinner />
    )
  }

  return (
    <div style={styles.tabContent}>
      <h1 style={styles.pageTitle}>Dashboard Overview</h1>

      {/* Primary Stats Cards */}
      <div style={styles.statsGrid}>
        <StatsCard
          icon="👥"
          title="Total Users"
          value={stats?.totalUsers || 0}
          color="#3b82f6"
          subtitle={`Active: ${stats?.activeUsers || 0}`}
        />
        <StatsCard
          icon="🧪"
          title="Total Samples"
          value={stats?.totalSamples || 0}
          color="#10b981"
          subtitle={`This week: +${stats?.newSamplesThisWeek || 0}`}
        />
        <StatsCard
          icon="📅"
          title="Lab Reservations"
          value={stats?.totalRequests || 0}
          color="#f59e0b"
          subtitle={`Pending: ${stats?.pendingRequests || 0}`}
        />
        <StatsCard
          icon="📋"
          title="Protocols"
          value={stats?.totalProtocols || 0}
          color="#8b5cf6"
          subtitle={`Categories: ${stats?.protocolCategories || 0}`}
        />
      </div>

      {/* Secondary Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        marginTop: '24px'
      }}>
        {/* User Role Breakdown */}
        <div style={{
          background: '#ffffff',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ 
            margin: '0 0 16px 0', 
            fontSize: '16px', 
            fontWeight: '600',
            color: '#111827'
          }}>
            User Role Distribution
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>
                👨‍🔬 Researchers
              </span>
              <span style={{ 
                fontWeight: '600', 
                fontSize: '16px',
                color: '#10b981'
              }}>
                {stats?.usersByRole?.researcher || 0}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>
                🔬 Technicians
              </span>
              <span style={{ 
                fontWeight: '600', 
                fontSize: '16px',
                color: '#f59e0b'
              }}>
                {stats?.usersByRole?.technician || 0}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>
                🎓 Students
              </span>
              <span style={{ 
                fontWeight: '600', 
                fontSize: '16px',
                color: '#3b82f6'
              }}>
                {stats?.usersByRole?.student || 0}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>
                👑 Admins
              </span>
              <span style={{ 
                fontWeight: '600', 
                fontSize: '16px',
                color: '#8b5cf6'
              }}>
                {stats?.usersByRole?.admin || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Reservation Status Overview */}
        <div style={{
          background: '#ffffff',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ 
            margin: '0 0 16px 0', 
            fontSize: '16px', 
            fontWeight: '600',
            color: '#111827'
          }}>
            Reservation Status
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>
                ⏳ Pending
              </span>
              <span style={{ 
                fontWeight: '600', 
                fontSize: '16px',
                color: '#f59e0b'
              }}>
                {stats?.reservationsByStatus?.pending || 0}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>
                ✅ Confirmed
              </span>
              <span style={{ 
                fontWeight: '600', 
                fontSize: '16px',
                color: '#10b981'
              }}>
                {stats?.reservationsByStatus?.confirmed || 0}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>
                ✔️ Completed
              </span>
              <span style={{ 
                fontWeight: '600', 
                fontSize: '16px',
                color: '#6366f1'
              }}>
                {stats?.reservationsByStatus?.completed || 0}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>
                ❌ Cancelled
              </span>
              <span style={{ 
                fontWeight: '600', 
                fontSize: '16px',
                color: '#ef4444'
              }}>
                {stats?.reservationsByStatus?.cancelled || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Sample Type Distribution */}
        <div style={{
          background: '#ffffff',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ 
            margin: '0 0 16px 0', 
            fontSize: '16px', 
            fontWeight: '600',
            color: '#111827'
          }}>
            Sample Types
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>
                💧 Water
              </span>
              <span style={{ 
                fontWeight: '600', 
                fontSize: '16px',
                color: '#3b82f6'
              }}>
                {stats?.samplesByType?.water || 0}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>
                🌱 Plant
              </span>
              <span style={{ 
                fontWeight: '600', 
                fontSize: '16px',
                color: '#10b981'
              }}>
                {stats?.samplesByType?.plant || 0}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>
                🪨 Soil
              </span>
              <span style={{ 
                fontWeight: '600', 
                fontSize: '16px',
                color: '#92400e'
              }}>
                {stats?.samplesByType?.soil || 0}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>
                🩸 Biological Fluid
              </span>
              <span style={{ 
                fontWeight: '600', 
                fontSize: '16px',
                color: '#ef4444'
              }}>
                {stats?.samplesByType?.biological_fluid || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginTop: '24px'
      }}>
        <div style={{
          background: '#eff6ff',
          padding: '16px',
          borderRadius: '8px',
          textAlign: 'center',
          border: '1px solid #dbeafe'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e40af' }}>
            {stats?.todayReservations || 0}
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
            Reservations Today
          </div>
        </div>

        <div style={{
          background: '#f0fdf4',
          padding: '16px',
          borderRadius: '8px',
          textAlign: 'center',
          border: '1px solid #dcfce7'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#15803d' }}>
            {stats?.newUsersThisWeek || 0}
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
            New Users This Week
          </div>
        </div>

        <div style={{
          background: '#fef3c7',
          padding: '16px',
          borderRadius: '8px',
          textAlign: 'center',
          border: '1px solid #fde68a'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#b45309' }}>
            {stats?.totalReports || 0}
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
            Total Reports Generated
          </div>
        </div>

        <div style={{
          background: '#fae8ff',
          padding: '16px',
          borderRadius: '8px',
          textAlign: 'center',
          border: '1px solid #f5d0fe'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#7e22ce' }}>
            {stats?.systemUptime || '99.9%'}
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
            System Uptime
          </div>
        </div>
      </div>
    </div>
  );
}
