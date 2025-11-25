// components/common/NotificationBell.jsx
'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-toastify';
import { loadNotificationUser } from '@/store/actions/notification.action';
import { server } from '@/server/servert';
import styles from '@/styles/user/NotificationBell.module.css';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const dropdownRef = useRef(null);

  const dispatch = useDispatch();
  const router = useRouter();
  const { notifications } = useSelector((state) => state.notification);
  const unreadCount = notifications?.filter((n) => !n.is_read).length || 0;

  // Track screen width
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 958);
    handleResize(); // initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      dispatch(loadNotificationUser());
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [loadNotifications]);

  // Actions
  const markAsRead = async (id) => {
    try {
      await axios.put(`${server}/notifications/${id}/read`, {}, { withCredentials: true });
      dispatch(loadNotificationUser());
    } catch (error) {
      console.error('Failed to mark as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(`${server}/notifications/read-all`, {}, { withCredentials: true });
      await dispatch(loadNotificationUser());
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const deleteNotification = async (id, event) => {
    event.stopPropagation(); // prevent marking as read
    if (!window.confirm('Delete this notification?')) return;

    try {
      await axios.delete(`${server}/notifications/${id}`, { withCredentials: true });
      dispatch(loadNotificationUser());
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const handleViewAll = () => {
    setIsOpen(false);
    router.push('/dashboard/notifications');
  };

  // Helpers
  const getNotificationIcon = (type) => {
    const icons = {
      info: '💡',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      report: '📊',
      sample: '🧪',
      reservation: '📅',
    };
    return icons[type] || '💡';
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';
    return 'Just now';
  };

  return (
    <div className={styles.notificationBellContainer} ref={dropdownRef}>
      {isMobile ? (
        // Mobile: navigate directly to notifications page
        <button
          className={styles.bellButton}
          onClick={() => router.push('/dashboard/notifications')}
          aria-label="Notifications"
        >
          <span className={styles.bellIcon}>🔔</span>
          {unreadCount > 0 && (
            <span className={styles.badge}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      ) : (
        // Desktop: toggle dropdown
        <button
          className={styles.bellButton}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Notifications"
        >
          <span className={styles.bellIcon}>🔔</span>
          {unreadCount > 0 && (
            <span className={styles.badge}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {!isMobile && isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <div className={styles.headerLeft}>
              <h3 className={styles.dropdownTitle}>Notifications</h3>
              {unreadCount > 0 && <span className={styles.unreadBadge}>{unreadCount} new</span>}
            </div>
            {unreadCount > 0 && (
              <button className={styles.markAllBtn} onClick={markAllAsRead}>
                Mark all read
              </button>
            )}
          </div>

          <div className={styles.notificationList}>
            {loading ? (
              <div className={styles.loadingState}>
                <div className={styles.spinner} />
                <p>Loading notifications...</p>
              </div>
            ) : !notifications || notifications.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>🔕</span>
                <p className={styles.emptyTitle}>No notifications</p>
                <p className={styles.emptyText}>You&apos;re all caught up!</p>
              </div>
            ) : (
              notifications.slice(0, 10).map((notification) => (
                <div
                  key={notification.notifications_id}
                  className={`${styles.notificationItem} ${!notification.is_read ? styles.unread : ''}`}
                  onClick={() =>
                    !notification.is_read && markAsRead(notification.notifications_id)
                  }
                >
                  <div className={styles.itemIcon}>{getNotificationIcon(notification.type)}</div>
                  <div className={styles.itemContent}>
                    <p className={styles.itemTitle}>{notification.title || 'Notification'}</p>
                    <p className={styles.itemMessage}>{notification.message}</p>
                    <p className={styles.itemTime}>{getTimeAgo(notification.created_at)}</p>
                  </div>
                  <div className={styles.itemActions}>
                    {!notification.is_read && <div className={styles.unreadDot} />}
                    <button
                      className={styles.deleteBtn}
                      onClick={(e) => deleteNotification(notification.notifications_id, e)}
                      aria-label="Delete notification"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications && notifications.length > 10 && (
            <div className={styles.dropdownFooter}>
              <button className={styles.viewAllBtn} onClick={handleViewAll}>
                View all notifications →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
