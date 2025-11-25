"use client";
import { useState, useRef, useEffect } from "react";
import styles from "@/styles/user/QRScanner.module.css";

export default function QRScanner({ onScanSuccess, onClose }) {
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setScanning(true);
        scanQRCode();
      }
    } catch (error) {
      console.error("Camera error:", error);
      alert("Unable to access camera. Please enter code manually.");
    }
  };

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current || !scanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Using jsQR library for actual QR code detection
      // In production, add: npm install jsqr
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

      // Simulated QR detection - replace with actual jsQR
      // const code = jsQR(imageData.data, imageData.width, imageData.height);
      // if (code) {
      //   handleCodeDetected(code.data);
      //   return;
      // }
    }

    if (scanning) {
      requestAnimationFrame(scanQRCode);
    }
  };

  const handleCodeDetected = (code) => {
    stopCamera();
    fetchSampleData(code);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      fetchSampleData(manualCode.trim());
    }
  };

  const fetchSampleData = async (sampleId) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/samples/qr/${sampleId}`
      );
      if (res.ok) {
        const data = await res.json();
        onScanSuccess(data.sample);
        onClose();
      } else {
        alert("Sample not found");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to fetch sample data");
    }
  };

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <h2>Scan QR/Barcode</h2>

        <div className={styles.scannerSection}>
          {!scanning ? (
            <button onClick={startCamera} className={styles.startBtn}>
              📷 Start Camera
            </button>
          ) : (
            <div className={styles.videoContainer}>
              <video ref={videoRef} autoPlay playsInline />
              <canvas ref={canvasRef} style={{ display: "none" }} />
              <button onClick={stopCamera} className={styles.stopBtn}>
                Stop Scanning
              </button>
            </div>
          )}
        </div>

        <div className={styles.divider}>OR</div>

        <form onSubmit={handleManualSubmit} className={styles.manualForm}>
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Enter sample code manually"
          />
          <button type="submit">Submit</button>
        </form>

        <button onClick={onClose} className={styles.closeBtn}>
          Close
        </button>
      </div>
    </div>
  );
}
