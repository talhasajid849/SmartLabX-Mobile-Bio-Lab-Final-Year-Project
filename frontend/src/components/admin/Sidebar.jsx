'use client';
import React, { useState, useLayoutEffect, useEffect,  } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/styles/admin/dashboard.styles';
import { useDispatch } from 'react-redux';
import { loadUser } from '@/store/actions/auth.action';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊', href: '/admin' },
  { id: 'users', label: 'Users', icon: '👥', href: '/admin/users' },
  { id: 'samples', label: 'Samples', icon: '🧪', href: '/admin/samples' },
  { id: 'reports', label: 'Reports', icon: '📄', href: '/admin/reports' },
  { id: 'reservations', label: 'Reservations', icon: '📅', href: '/admin/reservations' },
  { id: 'protocols', label: 'Protocols', icon: '📋', href: '/admin/protocols' },
  { id: 'logs', label: 'Activity Logs', icon: '📜', href: '/admin/logs' },
];

export default function Sidebar({ activeTab, setActiveTab, isMobileOpen, setIsMobileOpen }) {
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(loadUser())
  }, [dispatch])

  useLayoutEffect(() => {
    const checkScreen = () => setIsMobile(window.innerWidth < 1024);
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  const handleMenuClick = (id, href) => {
    setActiveTab(id);
    router.push(href);
    if (isMobile) setIsMobileOpen(false);
  };

  const sidebarStyle = {
    ...styles.sidebar,
    ...(isMobile && !isMobileOpen ? styles.sidebarMobile : {}),
    ...(isMobile && isMobileOpen ? styles.sidebarOpen : {}),
  };

  return (
    <>
      {isMobileOpen && (
        <div
          style={{ ...styles.sidebarOverlay, ...(isMobileOpen ? styles.sidebarOverlayActive : {}) }}
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside style={sidebarStyle}>
        <div style={styles.sidebarHeader}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={styles.logo}>🔬 Mobile Bio Lab</h2>
              <p style={styles.logoSubtitle}>Admin Panel</p>
            </div>
            {isMobile && (
              <button
                onClick={() => setIsMobileOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}
                aria-label="Close sidebar"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <nav style={styles.nav}>
          {menuItems.map((item) => {
            const navItemStyle = {
              ...styles.navItem,
              ...(activeTab === item.id ? styles.navItemActive : {}),
            };
            return (
              <button
                key={item.id}
                style={navItemStyle}
                onClick={() => handleMenuClick(item.id, item.href)}
                aria-current={activeTab === item.id ? 'page' : undefined}
              >
                <span style={styles.navIcon}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
