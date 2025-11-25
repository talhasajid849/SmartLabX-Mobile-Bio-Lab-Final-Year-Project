"use client";
import React, { useState } from "react";
import styles from "@/styles/admin/dashboard.styles";
import axios from "axios";
import { server } from "@/server/servert";
import { toast } from "react-toastify";

export default function ProtocolModal({ protocol, onClose }) {
  // Initialize form data
  const [formData, setFormData] = useState({
    title: protocol?.title || "",
    description: protocol?.description || "",
    sample_type: protocol?.sample_type || "",
    steps: protocol?.steps
      ? Array.isArray(protocol.steps)
        ? protocol.steps.map((s) => s.instruction).join("\n")
        : (() => {
            try {
              const parsed = JSON.parse(protocol.steps);
              return parsed.map((s) => s.instruction).join("\n");
            } catch {
              return protocol.steps;
            }
          })()
      : "",
    category: protocol?.category || "",
    experiment_type: protocol?.experiment_type || "",
  });

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Convert steps from string to array
    const stepsArray = formData.steps
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line, index) => ({
        step_number: index + 1,
        instruction: line,
      }));

    const payload = {
      ...formData,
      steps: stepsArray, // send as array to backend
    };

    try {
      if (protocol) {
        // Update existing protocol
        await axios.put(`${server}/protocols/${protocol.protocols_id}`, payload, {
          withCredentials: true,
        });
        toast.success("Protocol updated successfully!");
      } else {
        // Create new protocol
        await axios.post(`${server}/protocols`, payload, {
          withCredentials: true,
        });
        toast.success("Protocol created successfully!");
      }
      onClose(); // Close modal after success
    } catch (err) {
      toast.error("Operation failed: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.modalTitle}>
          {protocol ? "Edit Protocol" : "Add New Protocol"}
        </h2>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Title */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Title *</label>
            <input
              style={styles.input}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., DNA Extraction Protocol"
              required
            />
          </div>

          {/* Description */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Description</label>
            <textarea
              style={{ ...styles.input, minHeight: "80px", resize: "vertical" }}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the protocol..."
            />
          </div>

          {/* Category & Sample Type */}
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Category</label>
              <input
                style={styles.input}
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Molecular Biology"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Sample Type</label>
              <select
                style={styles.input}
                value={formData.sample_type}
                onChange={(e) => setFormData({ ...formData, sample_type: e.target.value })}
              >
                <option value="">Select type...</option>
                <option value="water">Water</option>
                <option value="soil">Soil</option>
                <option value="plant">Plant</option>
                <option value="biological_fluid">Biological Fluid</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Experiment Type */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Experiment Type</label>
            <input
              style={styles.input}
              value={formData.experiment_type}
              onChange={(e) =>
                setFormData({ ...formData, experiment_type: e.target.value })
              }
              placeholder="e.g., PCR, Microscopy, etc."
            />
          </div>

          {/* Steps */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Steps (one per line) *</label>
            <textarea
              style={{
                ...styles.input,
                minHeight: "200px",
                resize: "vertical",
                fontFamily: "monospace",
              }}
              value={formData.steps}
              onChange={(e) => setFormData({ ...formData, steps: e.target.value })}
              placeholder={`Step 1: Prepare the sample
Step 2: Add reagents
Step 3: Incubate for 30 minutes
...`}
              required
            />
          </div>

          {/* Modal Actions */}
          <div style={styles.modalActions}>
            <button type="button" style={styles.btnSecondary} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" style={styles.btnPrimary}>
              {protocol ? "Update Protocol" : "Create Protocol"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
