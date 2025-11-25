"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-toastify";
import Link from "next/link";
import styles from "@/styles/user/sampleDetail.module.css";
import axios from "axios";
import { server } from "@/server/servert";
import Image from "next/image";

export default function SampleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const sampleId = params.id;

  const [sample, setSample] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState("");

  const loadSampleDetail = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${server}/samples/${sampleId}`, {
        withCredentials: true,
      });
      console.log("Sample data:", response.data);
      setSample(response.data.sample);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load sample details");
      router.push("/dashboard/samples");
    } finally {
      setLoading(false);
    }
  }, [router, sampleId]);

  useEffect(() => {
    if (sampleId) {
      loadSampleDetail();
    }
  }, [sampleId, loadSampleDetail]);

  const handleDownloadQR = () => {
    if (sample?.qr_code_data) {
      // Construct full URL
      const qrImageUrl = `${server}${sample.qr_code_data}`;

      const link = document.createElement("a");
      link.href = qrImageUrl;
      link.download = `QR-${sample.sample_identifier}.png`;
      link.click();
      toast.success("QR Code downloaded");
    }
  };

  const handleExportPDF = async () => {
    try {
      toast.info("Generating PDF report...");
      // Implement PDF export
      const res = await axios.get(`${server}/samples/${sampleId}/export`, {
        responseType: "blob",
        withCredentials: true,
        headers: {
          Accept: "application/pdf",
        },
      });

      // Creast blob from the response
      const pdfBlob = new Blob([res.data], { type: "application/pdf" });

      // create download Link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Sample-${sample.sample_identifier}-Report.pdf`;

      // Trigger Download
      document.body.appendChild(link);
      link.click();

      // clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("PDF report generated successfully");
    } catch (error) {
      toast.error("Failed to generate PDF");
    }
  };

  const handleShareSample = async () => {
    if (!shareEmail.trim()) {
      toast.error("Please enter a valid email");
      return;
    }

    try {
      await axios.post(
        `${server}/samples/${sampleId}/share`,
        { recipientEmail: shareEmail },
        { withCredentials: true }
      );
      toast.success(`Sample shared with ${shareEmail}`);
      setShowShareModal(false);
      setShareEmail("");
    } catch (error) {
      toast.error("Failed to share sample");
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this sample? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await axios.delete(`${server}/samples/${sampleId}`, {
        withCredentials: true,
      });
      toast.success("Sample deleted successfully");
      router.push("/dashboard/samples");
    } catch (error) {
      toast.error("Failed to delete sample");
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Loading sample details...</p>
      </div>
    );
  }

  if (!sample) {
    return (
      <div className={styles.errorContainer}>
        <h2>Sample Not Found</h2>
        <Link href="/dashboard/samples">
          <button className={styles.backBtn}>← Back to Samples</button>
        </Link>
      </div>
    );
  }

  //   console.log('QR code URL:', `${server}${sample.qr_code_data}`);
  return (
    <div className={styles.detailPage}>
      <div className={styles.header}>
        <Link href="/dashboard/samples">
          <button className={styles.backBtn}>← Back</button>
        </Link>
        <h1>Sample Details</h1>
        <div className={styles.actionButtons}>
          <button onClick={handleExportPDF} className={styles.pdfBtn}>
            📄 Export PDF
          </button>
          <button
            onClick={() => setShowShareModal(true)}
            className={styles.shareBtn}
          >
            📤 Share
          </button>
          <button onClick={handleDelete} className={styles.deleteBtn}>
            🗑️ Delete
          </button>
        </div>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.leftSection}>
          <div className={styles.card}>
            <h2>Basic Information</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label>Sample ID:</label>
                <span>{sample.sample_identifier}</span>
              </div>
              <div className={styles.infoItem}>
                <label>Sample Type:</label>
                <span className={styles.badge}>{sample.sample_type}</span>
              </div>
              <div className={styles.infoItem}>
                <label>Collection Date:</label>
                <span>
                  {new Date(sample.collection_datetime).toLocaleString()}
                </span>
              </div>
              <div className={styles.infoItem}>
                <label>Status:</label>
                <span className={styles.statusBadge}>
                  {sample.status || "Active"}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h2>Location Information</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label>Geolocation:</label>
                <span>{sample.geolocation || "Not specified"}</span>
              </div>
              {sample.latitude && sample.longitude && (
                <>
                  <div className={styles.infoItem}>
                    <label>Latitude:</label>
                    <span>{sample.latitude}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <label>Longitude:</label>
                    <span>{sample.longitude}</span>
                  </div>
                  <div className={styles.mapContainer}>
                    <a
                      href={`https://www.google.com/maps?q=${sample.latitude},${sample.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.mapLink}
                    >
                      🗺️ View on Google Maps
                    </a>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className={styles.card}>
            <h2>Environmental Conditions</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label>pH Level:</label>
                <span>{sample.ph !== null ? sample.ph : "Not measured"}</span>
              </div>
              <div className={styles.infoItem}>
                <label>Temperature:</label>
                <span>
                  {sample.temperature !== null
                    ? `${sample.temperature}°C`
                    : "Not measured"}
                </span>
              </div>
              <div className={styles.infoItem}>
                <label>Salinity:</label>
                <span>
                  {sample.salinity !== null
                    ? `${sample.salinity} ppt`
                    : "Not measured"}
                </span>
              </div>
            </div>
          </div>

          {sample.notes && (
            <div className={styles.card}>
              <h2>Notes</h2>
              <p className={styles.notes}>{sample.notes}</p>
            </div>
          )}
        </div>

        <div className={styles.rightSection}>
          <div className={styles.card}>
            <h2>QR Code</h2>
            {sample.qr_code_data ? (
              <div className={styles.qrContainer}>
                <Image
                  src={`${server}${sample.qr_code_data}`} // just append directly
                  alt="Sample QR Code"
                  className={styles.qrImage}
                  width={100}
                  height={100}
                  unoptimized 
                  onError={(e) => {
                    console.error("Failed to load QR code image");
                    e.target.style.display = "none";
                  }}
                />

                <button
                  onClick={handleDownloadQR}
                  className={styles.downloadBtn}
                >
                  ⬇️ Download QR Code
                </button>
                <p className={styles.qrInfo}>
                  Scan this QR code to quickly access sample information
                </p>
              </div>
            ) : (
              <p>QR Code not available</p>
            )}
          </div>

          <div className={styles.card}>
            <h2>Metadata</h2>
            <div className={styles.metaInfo}>
              <p>
                <strong>Created:</strong>{" "}
                {new Date(sample.created_at).toLocaleString()}
              </p>
              <p>
                <strong>Last Updated:</strong>{" "}
                {new Date(
                  sample.updated_at || sample.created_at
                ).toLocaleString()}
              </p>
              <p>
                <strong>Sample ID:</strong> {sample.samples_id}
              </p>
            </div>
          </div>
        </div>
      </div>

      {showShareModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowShareModal(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>Share Sample</h2>
            <p>
              Enter the email address of the person you want to share this
              sample with:
            </p>
            <input
              type="email"
              placeholder="recipient@example.com"
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value)}
              className={styles.emailInput}
            />
            <div className={styles.modalActions}>
              <button onClick={handleShareSample} className={styles.confirmBtn}>
                Send
              </button>
              <button
                onClick={() => setShowShareModal(false)}
                className={styles.cancelBtn}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
