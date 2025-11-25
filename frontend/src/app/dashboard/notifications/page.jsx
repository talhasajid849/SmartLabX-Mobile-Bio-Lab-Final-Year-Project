// app/dashboard/notifications/page.jsx
"use client";
import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-toastify";
import { loadNotificationUser } from "@/store/actions/notification.action";
import { server } from "@/server/servert";
import styles from "@/styles/user/notification.module.css";
import useLoadMore from "@/hooks/useLoadMore";
import LoadMoreButton from "@/components/common/LoadMoreButton";
import LoadingSpinner from "@/components/visitor/LoadingSpinner";

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, unread, read
  const dispatch = useDispatch();
  const router = useRouter();
  
  
  const { notifications } = useSelector((state) => state.notification);
  
  
  
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      dispatch(loadNotificationUser());
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  // console.log(notifications)
  
  const handleMarkAsRead = async (id) => {
    try {
      await axios.put(
        `${server}/notifications/${id}/read`,
        {},
        {
          withCredentials: true,
        }
      );
      dispatch(loadNotificationUser());
      toast.success("Marked as read");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to mark as read");
    }
  };

   useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAllAsRead = async () => {
    if (!window.confirm("Mark all notifications as read?")) {
      return;
    }

    try {
      await axios.put(
        `${server}/notifications/read-all`,
        {},
        {
          withCredentials: true,
        }
      );
       dispatch(loadNotificationUser());
      toast.success("All notifications marked as read!");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to mark all as read");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this notification?")) {
      return;
    }

    try {
      await axios.delete(`${server}/notifications/${id}`, {
        withCredentials: true,
      });
      dispatch(loadNotificationUser());
      toast.success("Notification deleted");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to delete notification");
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      info: "💡",
      success: "✅",
      warning: "⚠️",
      error: "❌",
      report: "📊",
      sample: "🧪",
      reservation: "📅",
    };
    return icons[type] || "💡";
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";

    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";

    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";

    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";

    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";

    return "Just now";
  };

  // Filter notifications
  const filteredNotifications =
    notifications?.filter((n) => {
      if (filter === "unread") return !n.is_read;
      if (filter === "read") return n.is_read;
      return true;
    }) || [];

  const unreadCount = notifications?.filter((n) => !n.is_read).length || 0;


  const {visibleData, loadMore, hasMore } = useLoadMore(filteredNotifications, 6)
  if (loading) {
    return <LoadingSpinner name="Loading notifications..." />
  }

  return (
    <div className={styles.notificationsPage}>
      {/* Fixed Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <h1>🔔 All Notifications</h1>
          <p className={styles.subtitle}>
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${
                  unreadCount > 1 ? "s" : ""
                }`
              : "You're all caught up!"}
          </p>
        </div>
        <div className={styles.headerActions}>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllAsRead} className={styles.markAllBtn}>
              ✓ Mark All as Read
            </button>
          )}
        </div>
      </div>

      {/* Fixed Filter Tabs */}
      <div className={styles.filterTabs}>
        <button
          className={`${styles.filterTab} ${
            filter === "all" ? styles.active : ""
          }`}
          onClick={() => setFilter("all")}
        >
          All ({notifications?.length || 0})
        </button>
        <button
          className={`${styles.filterTab} ${
            filter === "unread" ? styles.active : ""
          }`}
          onClick={() => setFilter("unread")}
        >
          Unread ({unreadCount})
        </button>
        <button
          className={`${styles.filterTab} ${
            filter === "read" ? styles.active : ""
          }`}
          onClick={() => setFilter("read")}
        >
          Read ({(notifications?.length || 0) - unreadCount})
        </button>
      </div>

      {/* Scrollable Content Area */}
      <div className={styles.contentArea}>
        {visibleData.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              {filter === "unread" ? "✅" : "🔕"}
            </div>
            <h3 className={styles.emptyTitle}>
              {filter === "unread"
                ? "No unread notifications"
                : filter === "read"
                ? "No read notifications"
                : "No notifications yet"}
            </h3>
            <p className={styles.emptyText}>
              {filter === "unread"
                ? "You're all caught up!"
                : "Notifications will appear here"}
            </p>
          </div>
        ) : (
          <div className={styles.notificationsList}>
            {visibleData.map((notif) => (
              <div
                key={notif.notifications_id}
                className={`${styles.notificationItem} ${
                  !notif.is_read ? styles.unread : ""
                }`}
              >
                <div className={styles.notifIcon}>
                  {getNotificationIcon(notif.type)}
                </div>

                <div className={styles.notifContent}>
                  <div className={styles.notifHeader}>
                    <h3 className={styles.notifTitle}>
                      {notif.title || "Notification"}
                    </h3>
                    {!notif.is_read && (
                      <span className={styles.unreadBadge}>New</span>
                    )}
                  </div>
                  <p className={styles.notifMessage}>{notif.message}</p>
                  <span className={styles.notifTime}>
                    {getTimeAgo(notif.created_at)}
                  </span>
                </div>

                <div className={styles.notifActions}>
                  {!notif.is_read && (
                    <button
                      onClick={() => handleMarkAsRead(notif.notifications_id)}
                      className={styles.readBtn}
                      title="Mark as read"
                    >
                      ✓
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notif.notifications_id)}
                    className={styles.deleteBtn}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
            {hasMore &&
            <LoadMoreButton onClick={loadMore} />
            }
          </div>
        )}
      </div>
    </div>
  );
}
