"use client";
import styles from "@/styles/user/analytics.module.css";

export default function ExportPdfButton({ onExport }) {
  return (
    <button onClick={onExport} className={styles.exportBtn}>
      Export PDF 📄
    </button>
  );
}
