"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import LoadingSpinner from "@/components/visitor/LoadingSpinner";

export default function ProtectedRoute({ children, role }) {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useSelector(
    (state) => state.user
  );

  // Handle redirection
  useEffect(() => {
    if (loading) return;

    // User not logged in → login page
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    // Role mismatch → dashboard
    if (role && user?.role !== role) {
      router.replace("/dashboard");
      return;
    }
  }, [loading, isAuthenticated, user, role, router]);

  // Still loading user → show loader
  if (loading) return <LoadingSpinner />;

  // User verified → allow access
  return <>{children}</>;
}
