'use client';
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { toast } from "react-toastify";
import Link from "next/link";
import styles from "@/styles/user/ReportDetail.module.css";
import { server } from "@/server/servert";

export default function SharedReportPage() {
  const params = useParams();
  const token = params.token;

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadSharedReport = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(`${server}/reports/shared/${token}`);

        if (response.data.success) {
          setReport(response.data.report);
        }
      } catch (err) {
        console.error("Error loading shared report:", err);
        const errorMsg = err.response?.data?.message || "Invalid or expired report link";
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    if (token) loadSharedReport();
  }, [token]);

  const handleExportPDF = async () => {
    if (!report) return;

    try {
      toast.info("Preparing PDF...");
      const response = await axios.get(
        `${server}/reports/shared/${token}/export`,
        { responseType: "blob", headers: { Accept: "application/pdf" } }
      );

      const pdfBlob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Shared-Report-${report.title.replace(/[^a-z0-9]/gi, '-')}.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("✅ PDF downloaded successfully");
    } catch (err) {
      console.error("Error exporting PDF:", err);
      toast.error("Failed to export PDF. Please contact the report owner.");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("📋 Copied to clipboard!");
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Loading shared report...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>⚠️</div>
        <h2>Report Not Available</h2>
        <p>{error || "This report link may have expired or been deleted."}</p>
        <p className={styles.errorHint}>
          Please contact the person who shared this report with you.
        </p>
        <Link href="/">
          <button className={styles.backBtn}>← Go to Homepage</button>
        </Link>
      </div>
    );
  }

  const chartData = (() => {
    try {
      return report.chart_data ? JSON.parse(report.chart_data) : {};
    } catch {
      return {};
    }
  })();

  return (
    <div className={styles.reportDetailPage}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.sharedBanner}>
          <span className={styles.sharedIcon}>🔗</span>
          <span>Shared Report - View Only</span>
        </div>

        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <h1>{report.title}</h1>
            <span className={`${styles.statusBadge} ${styles[report.status]}`}>
              {report.status}
            </span>
          </div>
          <div className={styles.actionButtons}>
            <button onClick={handleExportPDF} className={styles.pdfBtn}>
              📄 Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Left Section */}
        <div className={styles.leftSection}>
          <div className={styles.card}>
            <h2>📊 Report Information</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label>Report Title:</label>
                <span>{report.title}</span>
              </div>
              <div className={styles.infoItem}>
                <label>Generated On:</label>
                <span>
                  {new Date(report.generated_on).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <div className={styles.infoItem}>
                <label>Status:</label>
                <span className={styles.statusText}>{report.status}</span>
              </div>
              {report.expires_at && (
                <div className={styles.infoItem}>
                  <label>Link Expires:</label>
                  <span className={styles.expiryDate}>
                    {new Date(report.expires_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className={styles.card}>
            <h2>🔬 Sample Information</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label>Sample ID:</label>
                <span>{report.sample_identifier}</span>
              </div>
              <div className={styles.infoItem}>
                <label>Sample Type:</label>
                <span className={styles.sampleTypeBadge}>{report.sample_type}</span>
              </div>
              <div className={styles.infoItem}>
                <label>Collection Date:</label>
                <span>{new Date(report.collection_datetime).toLocaleString()}</span>
              </div>
              <div className={styles.infoItem}>
                <label>Location:</label>
                <span>{report.geolocation || "Not specified"}</span>
              </div>
            </div>
          </div>

          {report.latitude && report.longitude && (
            <div className={styles.card}>
              <h2>📍 Location</h2>
              <div className={styles.locationInfo}>
                <p><strong>Latitude:</strong> {report.latitude}°N</p>
                <p><strong>Longitude:</strong> {report.longitude}°E</p>
                <a
                  href={`https://www.google.com/maps?q=${report.latitude},${report.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.mapLink}
                >
                  🗺️ View on Google Maps
                </a>
                <button
                  onClick={() => copyToClipboard(`${report.latitude}, ${report.longitude}`)}
                  className={styles.copyBtn}
                >
                  📋 Copy Coordinates
                </button>
              </div>
            </div>
          )}

          <div className={styles.card}>
            <h2>🌡️ Environmental Conditions</h2>
            <div className={styles.conditionsGrid}>
              <div className={styles.conditionCard}>
                <div className={styles.conditionIcon}>🌡️</div>
                <div className={styles.conditionInfo}>
                  <label>Temperature</label>
                  <span>{report.temperature !== null ? `${report.temperature}°C` : "N/A"}</span>
                </div>
              </div>
              <div className={styles.conditionCard}>
                <div className={styles.conditionIcon}>⚗️</div>
                <div className={styles.conditionInfo}>
                  <label>pH Level</label>
                  <span>{report.ph !== null ? report.ph : "N/A"}</span>
                </div>
              </div>
              <div className={styles.conditionCard}>
                <div className={styles.conditionIcon}>💧</div>
                <div className={styles.conditionInfo}>
                  <label>Salinity</label>
                  <span>{report.salinity !== null ? `${report.salinity} ppt` : "N/A"}</span>
                </div>
              </div>
            </div>
          </div>

          {report.notes && (
            <div className={styles.card}>
              <h2>📝 Field Notes</h2>
              <p className={styles.notes}>{report.notes}</p>
            </div>
          )}

          {chartData.content && (
            <div className={styles.card}>
              <h2>📄 Report Content</h2>
              <pre className={styles.contentText}>
                {chartData.content || "No content available"}
              </pre>
            </div>
          )}
        </div>

        {/* Right Section */}
        <div className={styles.rightSection}>
          <div className={styles.card}>
            <h2>ℹ️ About This Report</h2>
            <p><strong>Shared With:</strong> {report.shared_with_email}</p>
            <p className={styles.disclaimer}>
              This is a shared report. You have read-only access. Contact the owner for more information.
            </p>
          </div>

          <div className={styles.card}>
            <h2>⚡ Available Actions</h2>
            <div className={styles.quickActions}>
              <button onClick={handleExportPDF} className={styles.actionCard}>
                <span className={styles.actionIcon}>📥</span> Download PDF
              </button>
              {report.latitude && report.longitude && (
                <a
                  href={`https://www.google.com/maps?q=${report.latitude},${report.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.actionCard}
                >
                  <span className={styles.actionIcon}>🗺️</span> View Location
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.sharedFooter}>
        <p>Powered by <strong>Mobile Bio Lab</strong> - ABC Laboratories</p>
      </div>
    </div>
  );
}
