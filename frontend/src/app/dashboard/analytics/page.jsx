"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import styles from "@/styles/user/analytics.module.css";
import Filters from "@/components/user/analytics/Filters";
import EmptyState from "@/components/user/analytics/EmptyState";
import StatsCards from "@/components/user/analytics/StatsCards";
import ExportPdfButton from "@/components/user/analytics/ExportPdfButton";

import { server } from "@/server/servert";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import dynamic from "next/dynamic";
const Charts = dynamic(() => import("@/components/user/analytics/Charts"), {
  ssr: false,            // disable server-side rendering
  loading: () => <p>Loading chart...</p>, // optional loader
});

export default function AnalyticsPage() {
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    sampleType: "all",
    startDate: null,
    endDate: null,
  });

  const fetchSamples = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${server}/samples`, {
        params: {
          sample_type: filters.sampleType === "all" ? undefined : filters.sampleType,
          start_date: filters.startDate,
          end_date: filters.endDate,
        },
        withCredentials: true,
      });
      setSamples(data.samples || []);
    } catch (error) {
      console.error("Error fetching samples:", error);
      toast.error("Failed to fetch samples");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchSamples();
  }, [fetchSamples]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleDateChange = (key, date) => {
    handleFilterChange(key, date ? date.toISOString().split("T")[0] : null);
  };

  const clearFilters = () => {
    setFilters({ sampleType: "all", startDate: null, endDate: null });
  };

  // Compute stats
  const stats = useMemo(() => {
    if (!samples.length) return { totalSamples: 0, avgPh: null, avgTemp: null, avgSalinity: null };

    const total = samples.length;
    const avgPh = (samples.reduce((sum, s) => sum + (s.ph ?? 0), 0) / total).toFixed(2);
    const avgTemp = (samples.reduce((sum, s) => sum + (s.temperature ?? 0), 0) / total).toFixed(2);
    const avgSalinity = (samples.reduce((sum, s) => sum + (s.salinity ?? 0), 0) / total).toFixed(2);

    return { totalSamples: total, avgPh, avgTemp, avgSalinity };
  }, [samples]);

  // Chart data
  const sampleTypeData = useMemo(() => {
    const counts = samples.reduce((acc, s) => {
      acc[s.sample_type] = (acc[s.sample_type] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [samples]);

  const phData = useMemo(
    () => samples.filter(s => s.ph != null).map(s => ({ name: s.sample_identifier, pH: s.ph })),
    [samples]
  );

  const temperatureData = useMemo(
    () => samples.filter(s => s.temperature != null).map(s => ({ name: s.sample_identifier, temperature: s.temperature })),
    [samples]
  );

  const salinityData = useMemo(
    () => samples.filter(s => s.salinity != null).map(s => ({ name: s.sample_identifier, salinity: s.salinity })),
    [samples]
  );

  const combinedData = useMemo(
    () => samples.map(s => ({
      name: s.sample_identifier,
      pH: s.ph,
      temperature: s.temperature,
      salinity: s.salinity,
    })),
    [samples]
  );

  const handleExportPDF = async () => {
    const content = document.getElementById("pdf-content");
    if (!content) return toast.error("PDF content not found");

    try {
      toast.info("Generating PDF...");
      const canvas = await html2canvas(content, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const fileName =
        filters.startDate && filters.endDate
          ? `Analytics_Report_${filters.startDate}_to_${filters.endDate}.pdf`
          : `Analytics_Report_${new Date().toISOString().split("T")[0]}.pdf`;

      pdf.save(fileName);
      toast.success("PDF exported successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    }
  };

  return (
    <div className={styles.analyticsContainer}>
      <h2 className={styles.pageTitle}>Analytics Dashboard</h2>

      <Filters
        filters={filters}
        startDate={filters.startDate}
        endDate={filters.endDate}
        handleFilterChange={handleFilterChange}
        handleStartDateChange={(date) => handleDateChange("startDate", date)}
        handleEndDateChange={(date) => handleDateChange("endDate", date)}
        clearFilters={clearFilters}
      />

      {samples.length === 0 && !loading ? (
        <EmptyState filters={filters} />
      ) : (
        <>
          <ExportPdfButton onExport={handleExportPDF} />
          <div id="pdf-content">
            <StatsCards stats={stats} />
            <Charts
              sampleTypeData={sampleTypeData}
              phData={phData}
              temperatureData={temperatureData}
              salinityData={salinityData}
              combinedData={combinedData}
            />
          </div>
        </>
      )}
    </div>
  );
}
