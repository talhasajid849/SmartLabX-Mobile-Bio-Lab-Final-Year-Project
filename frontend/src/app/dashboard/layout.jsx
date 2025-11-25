"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { loadUser, logoutUser } from "@/store/actions/auth.action";
import DashboardSidebar from "@/components/user/DashboardSidebar";
import NotificationBell from "@/components/common/NotificationBell";
import styles from "@/styles/user/dashboard.module.css";
import { getResponsiveStyles } from "@/styles/admin/dashboard.styles";
import "@/styles/user/dashboard-animations.css";
import LoadingSpinner from "@/components/visitor/LoadingSpinner";
import Link from "next/navigation";
import { toast } from "react-toastify";
import axios from "axios";
import { server } from "@/server/servert";
import Image from "next/image";

export default function DashboardLayout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const router = useRouter();
  const dispatch = useDispatch();
  const [isInitialized, setIsInitialized] = useState(false);
  const { isAuthenticated, user, loading, error } = useSelector(
    (state) => state.user
  );

  // Track window size for responsive styles
  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load user on mount
  useEffect(() => {
    if (!isInitialized) {
      dispatch(loadUser()).finally(() => setIsInitialized(true));
    }
  }, [dispatch, isInitialized]);

 

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      // 1. Clear UI immediately
      dispatch({ type: "LogoutUserSuccess" });

      // 2. Logout backend
      dispatch(logoutUser());

      // 3. Prevent stale page on back button
      router.replace("/login");
      window.history.pushState(null, "", "/login");

      toast.success("Logged out successfully!");
    } catch (error) {
      toast.error(error);
    }
  };


   useEffect(() => {
  if (!isAuthenticated) {
    router.push("/login");
  }
}, [isAuthenticated, router]);


if (!isInitialized || loading) {
  return <LoadingSpinner />;
}



  // Get responsive styles
  const isMobile = windowSize.width < 768;
  const isTablet = windowSize.width >= 768 && windowSize.width < 992;
  const isDesktop = windowSize.width >= 992;
  const responsiveStyles = getResponsiveStyles(isMobile, isTablet, isDesktop);

  if (!isAuthenticated || !user) return null;

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          {/* <button className={styles.mobileMenuBtn}
          style={{
            transform: isMobileMenuOpen ? 'scale(1.1)' : 'scale(1)',
          }}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
          onMouseEnter={(e) => (e.currentTarget.style.color = '#3b82f6')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#1e293b')}
          >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button> */}

          <h1 className={styles.logo}>🔬 Mobile Bio Lab</h1>
        </div>
        <div className={styles.sidebarHead}>
          <DashboardSidebar
            isMobileMenuOpen={isMobileMenuOpen}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
          />
          <div>
            <button
              className={styles.mobileMenuBtn}
              style={{
                transform: isMobileMenuOpen ? "scale(1.1)" : "scale(1)",
              }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
              onMouseEnter={(e) => (e.currentTarget.style.color = "#3b82f6")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#ffffffff")}
            >
              {isMobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>
      </header>
      {/* <div className={styles.topHeader}>

        </div> */}

      <div className={styles.mainLayout}>
        <div className={styles.headerRight}>
          <NotificationBell />

          <div
            className={styles.userInfo}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#1e3fa9")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#0f172a")}
          >
            <Image
              src={user.profile_picture || "/placeholder-avatar.png"}
              alt={`${user.first_name}'s profile`}
              className={styles.avatar}
              width={50}
              height={50}
            />
            {!isMobile && (
              <span className={styles.userInfoSpan}>
                {user?.first_name} {user?.last_name}
              </span>
            )}
          </div>

          <button
            onClick={handleLogout}
            className={styles.logoutBtn}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#dc2626";
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#ef4444";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            Logout
          </button>
        </div>

        <main className={styles.mainContent}>{children}</main>
      </div>
    </div>
  );
}
