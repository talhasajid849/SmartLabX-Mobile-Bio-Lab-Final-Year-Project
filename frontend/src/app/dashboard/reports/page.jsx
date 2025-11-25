"use client";
import { useState, useEffect, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import axios from "axios";
import styles from "@/styles/user/ReportGenerator.module.css";
import { server } from "@/server/servert";
import LoadingSpinner from "@/components/visitor/LoadingSpinner";
import LoadMoreButton from "@/components/common/LoadMoreButton";
import useLoadMore from "@/hooks/useLoadMore";

const ITEMS_PER_PAGE = 9;

export default function ReportsPage() {
  const router = useRouter();

  const [realReports, setReports] = useState([]);
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Modal state
  const [selectedSample, setSelectedSample] = useState("");
  const [reportTitle, setReportTitle] = useState("");
  const [reportType, setReportType] = useState("analysis");

  // ------------------------------ //
  //        USE LOAD MORE LOGIC
  // ------------------------------ //
  const {
    visibleData: reports,
    loadMore,
    hasMore,
  } = useLoadMore(realReports, ITEMS_PER_PAGE);

  // ------------------------------ //
  //        FETCH REPORTS
  // ------------------------------ //
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);

      const res = await axios.get(`${server}/reports`, {
        withCredentials: true,
      });

      if (res.data.success) {
        setReports(res.data.reports || []);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, []);

  // ------------------------------ //
  //        FETCH SAMPLES
  // ------------------------------ //
  const fetchSamples = useCallback(async () => {
    try {
      const res = await axios.get(`${server}/samples`, {
        withCredentials: true,
      });

      if (res.data.success) {
        setSamples(res.data.samples || []);
      }
    } catch (error) {
      toast.error("Failed to load samples");
    }
  }, []);

  useEffect(() => {
    fetchReports();
    fetchSamples();
  }, [fetchReports, fetchSamples]);

  // ------------------------------ //
  //    GENERATE REPORT HANDLER
  // ------------------------------ //
  const handleGenerateReport = async (e) => {
    e.preventDefault();

    if (!selectedSample || !reportTitle) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setGenerating(true);
      toast.info("Generating report...");

      const res = await axios.post(
        `${server}/reports/generate/${selectedSample}`,
        { reportTitle, reportType },
        { withCredentials: true }
      );

      if (res.data.success) {
        toast.success("Report generated successfully!");

        setShowModal(false);
        setSelectedSample("");
        setReportTitle("");
        setReportType("analysis");

        fetchReports();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  // ------------------------------ //
  //        EXPORT REPORT
  // ------------------------------ //
  const handleExport = async (reportId) => {
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
      link.href = url;
      link.download = `Report-${reportId}-${Date.now()}.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("PDF downloaded successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to export PDF");
    }
  };

  // ------------------------------ //
  //      DELETE REPORT LOGIC
  // ------------------------------ //
  const handleDelete = async (reportId) => {
    if (!window.confirm("Are you sure you want to delete this report?")) return;

    try {
      const res = await axios.delete(`${server}/reports/${reportId}`, {
        withCredentials: true,
      });

      if (res.data.success) {
        toast.success("Report deleted successfully");
        fetchReports();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete report");
    }
  };

  const handleViewReport = (reportId) => {
    router.push(`/dashboard/reports/${reportId}`);
  };

  // ------------------------------ //
  //        LOADING SCREEN
  // ------------------------------ //
  if (loading) {
    return (
     <LoadingSpinner name="Loading Reports..." />
    );
  }

  // ------------------------------ //
  //        MAIN UI
  // ------------------------------ //
  return (
    <div className={styles.reportsPage}>
      <div className={styles.pageHeader}>
        <div>
          <h1>📊 Analysis Reports</h1>
          <p className={styles.subtitle}>
            Generate, view, and manage your sample analysis reports
          </p>
        </div>

        <button
          className={styles.primaryBtn}
          onClick={() => setShowModal(true)}
        >
          + Generate New Report
        </button>
      </div>

      {reports.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📋</div>
          <h3>No Reports Yet</h3>
          <p>Generate your first report to get started.</p>
          <button
            onClick={() => setShowModal(true)}
            className={styles.emptyStateBtn}
          >
            Generate Your First Report
          </button>
        </div>
      ) : (
        <div className={styles.reportsGrid}>
          {reports.map((report) => (
            <ReportCard
              key={report.report_id}
              report={report}
              handleDelete={handleDelete}
              handleExport={handleExport}
              handleViewReport={handleViewReport}
            />
          ))}
        </div>
      )}

      {/* ---------------- Load More Button ---------------- */}
      {hasMore && (
        <div
          style={{ display: "flex", justifyContent: "center", marginTop: 40 }}
        >
          <LoadMoreButton onClick={loadMore} />
        </div>
      )}

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>Generate New Report</h2>

            <form onSubmit={handleGenerateReport}>
              <div className={styles.formGroup}>
                <label htmlFor="sampleSelect">Select Sample</label>
                <select
                  id="sampleSelect"
                  value={selectedSample}
                  onChange={(e) => setSelectedSample(e.target.value)}
                  required
                >
                  <option value="" disabled>Select a sample</option>
                  {samples.map(sample => (
                    <option key={sample.samples_id} value={sample.samples_id}>
                      {sample.sample_identifier}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="reportTitle">Report Title</label>
                <input
                  id="reportTitle"
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="Enter report title"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="reportType">Report Type</label>
                <select
                  id="reportType"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <option value="analysis">Analysis</option>
                  <option value="summary">Summary</option>
                </select>
              </div>

              <div className={styles.modalActions}>
                <button type="submit" className={styles.confirmBtn} disabled={generating}>
                  {generating ? "Generating..." : "Generate Report"}
                </button>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowModal(false)}
                  disabled={generating}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

const ReportCard = memo(function ReportCard({
  report,
  handleDelete,
  handleExport,
  handleViewReport,
}) {
  return (
    <div className={styles.reportCard}>
      <div className={styles.cardHeader}>
        <h3>{report.title}</h3>
        <span className={`${styles.status} ${styles[report.status]}`}>
          {report.status}
        </span>
      </div>

      <div className={styles.cardBody}>
        <p className={styles.sampleInfo}>
          <strong>Sample:</strong> {report.sample_identifier} (
          {report.sample_type})
        </p>

        <p className={styles.dateInfo}>
          <strong>Generated:</strong>{" "}
          {new Date(report.generated_on).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>

      <div className={styles.cardActions}>
        <button
          onClick={() => handleViewReport(report.report_id)}
          className={styles.viewBtn}
        >
          👁️ View
        </button>
        <button
          onClick={() => handleExport(report.report_id)}
          className={styles.exportBtn}
        >
          📥 PDF
        </button>
        <button
          onClick={() => handleDelete(report.report_id)}
          className={styles.deleteBtn}
        >
          🗑️ Delete
        </button>
      </div>


    </div>
  );
});
