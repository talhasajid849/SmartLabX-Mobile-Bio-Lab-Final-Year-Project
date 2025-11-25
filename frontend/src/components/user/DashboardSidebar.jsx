// components/user/DashboardSidebar.jsx
"use client";
import { usePathname, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import styles from "@/styles/user/DashboardSidebar.module.css";

export default function DashboardSidebar({
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}) {
  const pathname = usePathname();
  const router = useRouter();


  // Get unread notification count from Redux
  const { notifications } = useSelector((state) => state.notification);
  const unreadCount = notifications?.filter((n) => !n.is_read).length || 0;
   const { user, loading } = useSelector((state) => state.user);
  const isAdmin = user?.role === "admin";

  const menuItems = [
    { id: "dashboard", label: "Dashboard", path: "/dashboard", icon: "🧬" },
    { id: "samples", label: "Samples", path: "/dashboard/samples", icon: "🧪" },
    {
      id: "reservations",
      label: "Reservations",
      path: "/dashboard/reservations",
      icon: "📅",
    },
    {
      id: "protocols",
      label: "Protocols",
      path: "/dashboard/protocols",
      icon: "📋",
    },
    { id: "reports", label: "Reports", path: "/dashboard/reports", icon: "📈" },
    {
      id: "analytics",
      label: "Analytics",
      path: "/dashboard/analytics",
      icon: "📉",
    },
    {
      id: "notifications",
      label: "Notifications",
      path: "/dashboard/notifications",
      icon: "🔔",
      badge: unreadCount,
    },
    { id: "profile", label: "Profile", path: "/dashboard/profile", icon: "👤" },
    {
      id: "activity",
      label: "Activities",
      path: "/dashboard/activities",
      icon: "⏰",
    },
    ...(isAdmin
      ? [{ id: "admin", label: "Admin", path: "/admin", icon: "🛠" }]
      : []),
  ];

  const handleNavigation = (path) => {
    router.push(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <aside
      className={`${styles.sidebar} ${isMobileMenuOpen ? styles.open : ""}`}
    >
      <nav className={styles.nav}>
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`${styles.navItem} ${
              pathname === item.path ? styles.active : ""
            }`}
            onClick={() => handleNavigation(item.path)}
          >
            <span className={styles.icon}>{item.icon}</span>
            <span className={styles.label}>{item.label}</span>
            {item.badge > 0 && (
              <span className={styles.badge}>
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>
    </aside>
  );
}
