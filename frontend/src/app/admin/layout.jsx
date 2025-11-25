"use client";
import React, { useState, useLayoutEffect, useEffect } from "react";
import Sidebar from "@/components/admin/Sidebar";
import styles, { getResponsiveStyles } from "@/styles/admin/dashboard.styles";
import { useSelector, useDispatch } from "react-redux";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { loadUser, logoutUser } from "@/store/actions/auth.action";
import LoadingSpinner from "@/components/visitor/LoadingSpinner";

export default function AdminLayout({ children }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [currentStyles, setCurrentStyles] = useState(() =>
    getResponsiveStyles()
  );
  const [isInitialized, setIsInitialized] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();
  const { isAuthenticated, user, loading } = useSelector((state) => state.user);
  const pathname = usePathname();

  // Load user on mount
  useEffect(() => {
    dispatch(loadUser()).finally(() => {
      setIsInitialized(true);
    });
  }, [dispatch]);

  // Handle authentication and role-based redirection
  useEffect(() => {
    if (!isInitialized || loading) return;

    // Not authenticated → redirect to login
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    // Not an admin → redirect to user dashboard
    if (user?.role !== "admin") {
      toast.error("Access denied. Admin privileges required.");
      router.replace("/dashboard");
      return;
    }
  }, [isInitialized, loading, isAuthenticated, user, router]);

  // Derive active tab directly
  const activeTab = (() => {
    if (pathname.startsWith("/admin/users")) return "users";
    if (pathname.startsWith("/admin/samples")) return "samples";
    if (pathname.startsWith("/admin/reports")) return "reports";
    if (pathname.startsWith("/admin/reservations")) return "reservations";
    if (pathname.startsWith("/admin/protocols")) return "protocols";
    if (pathname.startsWith("/admin/logs")) return "logs";
    return "dashboard";
  })();

  // Responsive styles
  useLayoutEffect(() => {
    const handleResize = () => setCurrentStyles(getResponsiveStyles());
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isDesktop = currentStyles.main === styles.main;

  // Logout handler
  const handleLogout = async () => {
    try {
      await dispatch(logoutUser());
      toast.success("Logged out successfully");
      router.replace("/login");
    } catch (err) {
      toast.error(err?.message || "Logout failed");
    }
  };

  // // Show loading while checking authentication
  // if (!isInitialized || loading) {
  //   return <LoadingSpinner />;
  // }

  // Don't render anything if not authenticated or not admin (redirect will happen)
  if (!isAuthenticated || user?.role !== "admin") {
    return <LoadingSpinner />;
  }

  return (
    <div style={currentStyles.container}>
      {/* Mobile overlay */}
      {!isDesktop && isMobileOpen && (
        <div
          style={{
            ...currentStyles.sidebarOverlay,
            ...currentStyles.sidebarOverlayActive,
          }}
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={() => {}}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main content */}
      <main style={currentStyles.main}>
        {/* Header */}
        <header style={currentStyles.header}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              style={currentStyles.menuToggle}
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              aria-label="Toggle menu"
            >
              ☰
            </button>
            <h1 style={currentStyles.headerTitle}>Admin Dashboard</h1>
          </div>
          <div style={currentStyles.headerRight}>
            <span style={currentStyles.adminBadge}>
              👤 {user?.name || "Admin"}
            </span>
            <button onClick={handleLogout} style={currentStyles.btnLogout}>
              Logout
            </button>
          </div>
        </header>

        {/* Render passed content */}
        {children}
      </main>
    </div>
  );
}