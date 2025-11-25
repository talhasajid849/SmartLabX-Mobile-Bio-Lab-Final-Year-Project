"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loadSamples, updateSample, updateSampleStatus, deleteSample } from "@/store/actions/sample.action";
import styles from "@/styles/admin/dashboard.styles";
import SamplesTable from "./SamplesTable";
import Filters from "./Filters";
import PaginationControls from "./PaginationControls";
import SampleModal from "./SampleModal";
import { toast } from "react-toastify";
import SearchBar from "@/components/common/SearchBar";
import { useDebounce } from "@/hooks/useDebounce";
import axios from "axios";
import { server } from "@/server/servert";

export default function SamplesTab() {
  const dispatch = useDispatch();
  const { samples, loading, pagination } = useSelector((state) => state.samples);

  // Filters and pagination state
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(20);
  const [sortBy, setSortBy] = useState("collection_datetime");
  const [sortOrder, setSortOrder] = useState("DESC");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("view");
  const [selectedSample, setSelectedSample] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  
  const debouncedSearchQuery = useDebounce(searchQuery, 800);

  useEffect(() => {
    dispatch(loadSamples(currentPage, limit, debouncedSearchQuery, typeFilter, statusFilter, sortBy, sortOrder));
  }, [dispatch, currentPage, limit, debouncedSearchQuery, typeFilter, statusFilter, sortBy, sortOrder]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === "ASC" ? "DESC" : "ASC"));
    } else {
      setSortBy(column);
      setSortOrder("DESC");
    }
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openModal = (sample, mode) => {
    setSelectedSample(sample);
    setModalMode(mode);
    if (mode === "edit") {
      setEditFormData({
        sample_type: sample.sample_type,
        collection_datetime: sample.collection_datetime,
        geolocation: sample.geolocation || "",
        latitude: sample.latitude || "",
        longitude: sample.longitude || "",
        ph: sample.ph || "",
        temperature: sample.temperature || "",
        salinity: sample.salinity || "",
        notes: sample.notes || "",
        status: sample.status || "pending",
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const updateSampleHandler = async () => {
    const result = dispatch(updateSample(selectedSample.samples_id, editFormData));
    if (result) {
      toast.success("Sample updated successfully");
      setShowModal(false);
      dispatch(loadSamples(currentPage, limit, debouncedSearchQuery, typeFilter, statusFilter, sortBy, sortOrder));
    } else {
      toast.error(result.error || "Failed to update sample");
    }
  };

  const updateStatusHandler = async (newStatus) => {
    const result = await dispatch(updateSampleStatus(selectedSample.samples_id, newStatus));
    if (result.success) {
      toast.success(`Sample ${newStatus} successfully`);
      setShowModal(false);
      dispatch(loadSamples(currentPage, limit, debouncedSearchQuery, typeFilter, statusFilter, sortBy, sortOrder));
    } else {
      toast.error(result.error || "Failed to update status");
    }
  };

  const deleteSampleHandler = async (sampleId) => {
    if (!confirm("Are you sure you want to delete this sample? This action cannot be undone.")) return;
    
    const result = await dispatch(deleteSample(sampleId));
    if (result.success) {
      toast.success("Sample deleted successfully");
      dispatch(loadSamples(currentPage, limit, debouncedSearchQuery, typeFilter, statusFilter, sortBy, sortOrder));
    } else {
      toast.error(result.error || "Failed to delete sample");
    }
  };

 const exportPDF = async (sampleId) => {
  try {
    const response = await axios.get(`${server}/samples/${sampleId}/export`, {
      withCredentials: true,
      responseType: "blob", // IMPORTANT for PDF
    });

    // Create a blob URL
    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);

    // Trigger download
    const link = document.createElement("a");
    link.href = url;
    link.download = `Sample-${sampleId}-Report.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error(err);
    toast.error("Failed to export PDF");
  }
};

  if (loading && samples.length === 0) {
    return (
      <div style={styles.tabContent}>
        <div style={{ textAlign: "center", padding: "40px" }}>
          Loading samples...
        </div>
      </div>
    );
  }

  return (
    <div style={styles.tabContent}>
      <h1 style={{ color: "#111", fontSize: "25px", marginBottom: "54px" }}>
        Sample Management
      </h1>
      <header
        style={{
          margin: "29px",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-evenly",
          gap: "16px",
          alignItems: "center",
        }}
      >
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={handleSearch}
          placeholder="Search by name, user..."
          ariaLabel="Search samples"
        />
        <Filters
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          setPagination={() => setCurrentPage(1)}
        />
      </header>

      <p style={{ color: "#111", fontSize: "14px", marginBottom: "16px" }}>
        Showing {samples.length} sample{samples.length !== 1 ? "s" : ""}{" "}
        {pagination.total > 0 &&
          ` (${(currentPage - 1) * limit + 1}-${Math.min(
            currentPage * limit,
            pagination.total
          )} of ${pagination.total} total)`}
        {typeFilter !== "all" && ` • ${typeFilter.replace("_", " ")}`}
        {statusFilter !== "all" && ` • ${statusFilter}`}
      </p>

      <SamplesTable
        samples={samples}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        onView={(sample) => openModal(sample, "view")}
        onEdit={(sample) => openModal(sample, "edit")}
        onApproveReject={(sample) => openModal(sample, "approve")}
        onDelete={deleteSampleHandler}
      />

      <PaginationControls
        pagination={pagination}
        onPageChange={handlePageChange}
      />

      {showModal && selectedSample && (
        <SampleModal
          sample={selectedSample}
          mode={modalMode}
          onClose={closeModal}
          editFormData={editFormData}
          setEditFormData={setEditFormData}
          onUpdateSample={updateSampleHandler}
          onUpdateStatus={updateStatusHandler}
          onExportPDF={exportPDF}
        />
      )}
    </div>
  );
}