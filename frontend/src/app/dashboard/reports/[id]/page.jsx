"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-toastify";
import Link from "next/link";
import axios from "axios";
import styles from "@/styles/user/ReportDetail.module.css";
import { server } from "@/server/servert";
import LoadingSpinner from "@/components/visitor/LoadingSpinner";

export default function ReportDetailPage() {
  const router = useRouter();
  const params = useParams();
  const reportId = params.id;

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [sharing, setSharing] = useState(false);
  // console.log(report)

  // Safely parse chart_data
  const parseChartData = (data) => {
    try {
      return data ? JSON.parse(data) : {};
    } catch (err) {
      console.error("Error parsing chart_data:", err);
      return {};
    }
  };

  const loadReportDetail = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${server}/reports/${reportId}`, {
        withCredentials: true,
      });

      if (response.data.success) {
        setReport(response.data.report);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.response?.data?.message || "Failed to load report");
      router.push("/dashboard/reports");
    } finally {
      setLoading(false);
    }
  }, [reportId, router]);

  useEffect(() => {
    if (reportId) loadReportDetail();
  }, [reportId, loadReportDetail]);

  const handleExportPDF = async () => {
    try {
      toast.info("Preparing PDF...");

      const response = await axios.get(`${server}/reports/${reportId}/export`, {
        responseType: "blob",
        withCredentials: true,
        headers: { Accept: "application/pdf" },
      });

      const pdfBlob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");

      // Truncate long title for filename
      const safeTitle = report.title.replace(/[^a-z0-9]/gi, "-").slice(0, 50);
      link.href = url;
      link.download = `Report-${safeTitle}-${Date.now()}.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("✅ PDF downloaded successfully");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error(error.response?.data?.message || "Failed to export PDF");
    }
  };


  const handleShareEmail = async (e) => {
    e.preventDefault();
    if (!shareEmail.trim() || !shareEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      setSharing(true);
      const response = await axios.post(
        `${server}/reports/${reportId}/share`,
        { email: shareEmail },
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success(`✅ Report shared successfully with ${shareEmail}`);
        setShowShareModal(false);
        setShareEmail("");
      }
    } catch (error) {
      console.error("Error sharing report:", error);
      toast.error(error.response?.data?.message || "Failed to share report");
    } finally {
      setSharing(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("⚠️ Are you sure you want to delete this report? This action cannot be undone.")) return;

    try {
      const res = await axios.delete(`${server}/reports/${reportId}`, {
        withCredentials: true,
      });

      if (res.data.success) {
        toast.success("✅ Report deleted successfully");
        router.push("/dashboard/reports");
      }
    } catch (error) {
      console.error("Error deleting report:", error);
      toast.error(error.response?.data?.message || "Failed to delete report");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("📋 Copied to clipboard!");
  };

  if (loading) {
    return (
      <LoadingSpinner name="Loading report details..." />
    );
  }

  if (!report) {
    return (
      <div className={styles.errorContainer}>
        <h2>❌ Report Not Found</h2>
        <p>The report you`re looking for doesn`t exist or has been deleted.</p>
        <Link href="/dashboard/reports">
          <button className={styles.backBtn}>← Back to Reports</button>
        </Link>
      </div>
    );
  }

  const chartData = parseChartData(report.chart_data.content);
// console.log(chartData)
  return (
    <div className={styles.reportDetailPage}>
      {/* Header */}
      <div className={styles.header}>
        <Link href="/dashboard/reports">
          <button className={styles.backBtn}>← Back</button>
        </Link>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <h1>{report.title}</h1>
            <span className={`${styles.statusBadge} ${styles[report.status]}`}>{report.status}</span>
          </div>
          <div className={styles.actionButtons}>
            <button onClick={handleExportPDF} className={styles.pdfBtn}>📄 Export PDF</button>
            <button onClick={() => setShowShareModal(true)} className={styles.shareBtn}>📤 Share via Email</button>
            <button onClick={handleDelete} className={styles.deleteBtn}>🗑️ Delete</button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Left Section */}
        <div className={styles.leftSection}>
          {/* Report Info */}
          <div className={styles.card}>
            <h2>📊 Report Information</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}><label>Report ID:</label><span>{report.report_id}</span></div>
              <div className={styles.infoItem}>
                <label>Generated On:</label>
                <span>{new Date(report.generated_on).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className={styles.infoItem}><label>Status:</label><span className={styles.statusText}>{report.status}</span></div>
              <div className={styles.infoItem}><label>Report Type:</label><span>{chartData.type || "Analysis"}</span></div>
            </div>
          </div>

          {/* Sample Info */}
          <div className={styles.card}>
            <h2>🔬 Sample Information</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}><label>Sample ID:</label><span>{report.sample.sample_identifier}</span></div>
              <div className={styles.infoItem}><label>Sample Type:</label><span className={styles.sampleTypeBadge}>{report.sample.sample_type}</span></div>
              <div className={styles.infoItem}><label>Collection Date:</label><span>{new Date(report.sample.collection_datetime).toLocaleString()}</span></div>
              <div className={styles.infoItem}><label>Geolocation:</label><span>{report.sample.geolocation || "Not specified"}</span></div>
            </div>
          </div>

          {/* Location */}
          {report.latitude && report.longitude && (
            <div className={styles.card}>
              <h2>📍 Location</h2>
              <div className={styles.sample.locationInfo}>
                <p><strong>Latitude:</strong> {report.sample.latitude}°N</p>
                <p><strong>Longitude:</strong> {report.sample.longitude}°E</p>
                <a
                  href={`https://www.google.com/maps?q=${report.latitude},${report.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.mapLink}
                >
                  🗺️ View on Google Maps
                </a>
                <button onClick={() => copyToClipboard(`${report.latitude}, ${report.longitude}`)} className={styles.copyBtn}>📋 Copy Coordinates</button>
              </div>
            </div>
          )}

          {/* Environmental Conditions */}
          <div className={styles.card}>
            <h2>🌡️ Environmental Conditions</h2>
            <div className={styles.conditionsGrid}>
              <div className={styles.conditionCard}>
                <div className={styles.conditionIcon}>🌡️</div>
                <div className={styles.conditionInfo}><label>Temperature</label><span>{report.sample.temperature !== null ? `${report.sample.temperature}°C` : "N/A"}</span></div>
              </div>
              <div className={styles.conditionCard}>
                <div className={styles.conditionIcon}>⚗️</div>
                <div className={styles.conditionInfo}><label>pH Level</label><span>{report.sample.ph !== null ? report.sample.ph : "N/A"}</span></div>
              </div>
              <div className={styles.conditionCard}>
                <div className={styles.conditionIcon}>💧</div>
                <div className={styles.conditionInfo}><label>Salinity</label><span>{report.sample.salinity !== null ? `${report.sample.salinity} ppt` : "N/A"}</span></div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {report.notes && (
            <div className={styles.card}>
              <h2>📝 Field Notes</h2>
              <p className={styles.notes}>{report.notes}</p>
            </div>
          )}
        </div>

        {/* Right Section */}
        <div className={styles.rightSection}>
          {/* Quick Actions */}
          <div className={styles.card}>
            <h2>⚡ Quick Actions</h2>
            <div className={styles.quickActions}>
              <button onClick={handleExportPDF} className={styles.actionCard}><span className={styles.actionIcon}>📥</span>Download PDF</button>
              <button onClick={() => setShowShareModal(true)} className={styles.actionCard}><span className={styles.actionIcon}>✉️</span>Share via Email</button>
              <button onClick={() => router.push(`/dashboard/samples/${report.samples_id}`)} className={styles.actionCard}><span className={styles.actionIcon}>🔬</span>View Sample</button>
            </div>
          </div>

          {/* Report Statistics */}
          <div className={styles.card}>
            <h2>📈 Report Statistics</h2>
            <div className={styles.statsGrid}>
              <div className={styles.statItem}><label>Database ID</label><span>#{report.report_id}</span></div>
              <div className={styles.statItem}><label>Created</label><span>{new Date(report.generated_on).toLocaleDateString()}</span></div>
              <div className={styles.statItem}><label>Last Modified</label><span>{new Date(report.updated_at || report.generated_on).toLocaleDateString()}</span></div>
            </div>
          </div>

          {/* Report Content Preview */}
          {chartData.content && (
            <div className={styles.card}>
              <h2>📄 Report Content Preview</h2>
              <div className={styles.contentPreview}><pre>{chartData.content}</pre></div>
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className={styles.modalOverlay} onClick={() => !sharing && setShowShareModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>📤 Share Report via Email</h2>
              <button onClick={() => setShowShareModal(false)} className={styles.closeBtn} disabled={sharing}>✕</button>
            </div>
            <form onSubmit={handleShareEmail}>
              <p className={styles.modalDescription}>Enter the email of the recipient. They will receive a secure link to view this report.</p>
              <div className={styles.formGroup}>
                <label htmlFor="shareEmail">Recipient Email: *</label>
                <input
                  id="shareEmail"
                  type="email"
                  placeholder="colleague@example.com"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  className={styles.emailInput}
                  required
                  disabled={sharing}
                />
              </div>
              <div className={styles.shareInfo}><p><strong>ℹ️ Note:</strong> The share link will expire in 30 days.</p></div>
              <div className={styles.modalActions}>
                <button type="submit" className={styles.confirmBtn} disabled={sharing}>
                  {sharing ? <><span className={styles.spinner} /> Sending...</> : '✉️ Send Email'}
                </button>
                <button type="button" onClick={() => setShowShareModal(false)} className={styles.cancelBtn} disabled={sharing}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
