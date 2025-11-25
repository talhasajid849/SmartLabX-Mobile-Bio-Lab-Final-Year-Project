"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { server } from "@/server/servert";
import { useDispatch, useSelector } from "react-redux";
import { loadUser } from "@/store/actions/auth.action";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import LoadingSpinner from "@/components/visitor/LoadingSpinner";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loadinge, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated, loading } = useSelector((state) => state.user);

 useEffect(() => {
  if (!isAuthenticated) {
    dispatch(loadUser());
  }
}, [dispatch, isAuthenticated]);


if (isAuthenticated) {
  router.replace("/dashboard");
}

 
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Errords");
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(
        `${server}/auth/login`,
        {
          email: formData.email,
          password: formData.password,
        },
        {
          withCredentials: true,
        }
      );
      // console.log(res);
      toast.success("Login Successfull....!");
      router.push("/dashboard");
    } catch (err) {
      console.error(err.response || err);
      toast.error(err.response?.data?.error || error.response.data.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.loginContainer}>
      <div style={styles.loginCard}>
        <div style={styles.loginHeader}>
          <h1 style={styles.loginLogo}>🔬 Mobile Bio Lab</h1>
          <h2 style={styles.loginTitle}>Welcome Back</h2>
          <p style={styles.loginSubtitle}>Login to access your account</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.loginForm}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              style={styles.input}
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="your.email@example.com"
              required
              autoComplete="username"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              style={styles.input}
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <div style={styles.forgotPassword}>
            <Link href="/forgot-password" style={styles.link}>
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            style={{
              ...styles.btnLogin,
              opacity: loadinge ? 0.7 : 1,
            }}
            disabled={loadinge}
          >
            {loadinge ? "Logging in..." : "Login"}
          </button>

          <p style={styles.registerLink}>
            Dont have an account?{" "}
            <Link href="/" style={styles.link}>
              Register here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

const styles = {
  loginContainer: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
    padding: "20px",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  loginCard: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "48px 40px",
    maxWidth: "450px",
    width: "100%",
    boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
  },
  loginHeader: {
    textAlign: "center",
    marginBottom: "32px",
  },
  loginLogo: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#3b82f6",
    marginBottom: "16px",
  },
  loginTitle: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: "8px",
  },
  loginSubtitle: {
    fontSize: "16px",
    color: "#64748b",
  },
  loginForm: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#475569",
  },
  input: {
    padding: "12px 16px",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    fontSize: "15px",
    color: "#fff",
    fontFamily: "inherit",
  },
  forgotPassword: {
    textAlign: "right",
    marginTop: "-10px",
  },
  btnLogin: {
    padding: "14px 32px",
    backgroundColor: "#3b82f6",
    border: "none",
    color: "white",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "8px",
  },
  registerLink: {
    textAlign: "center",
    fontSize: "14px",
    color: "#64748b",
  },
  link: {
    color: "#3b82f6",
    textDecoration: "none",
    fontWeight: "600",
  },
};
