"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import axios from "axios";
import Link from "next/link";
import styles from "@/styles/user/protocolDetail.module.css";
import { server } from "@/server/servert";
import LoadingSpinner from "@/components/visitor/LoadingSpinner";

export default function ProtocolDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [protocol, setProtocol] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [notes, setNotes] = useState({});

  const loadProtocol = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${server}/protocols/${params.id}`, {
        withCredentials: true,
      });
      setProtocol(response.data.protocol);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load protocol");
      router.push("/dashboard/protocols");
    } finally {
      setLoading(false);
    }
  }, [router, params.id]);

  useEffect(() => {
    if (params.id) {
      loadProtocol();
    }
  }, [params.id, loadProtocol]);

  const toggleStep = (index) => {
    setCompletedSteps((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleNoteChange = (index, value) => {
    setNotes((prev) => ({ ...prev, [index]: value }));
  };

  if (loading) {
    return <LoadingSpinner name="Loading protocol..." />;
  }

  if (!protocol) return null;

  let steps = Array.isArray(protocol.steps) ? protocol.steps : [];

  const progress =
    steps.length > 0 ? (completedSteps.length / steps.length) * 100 : 0;

  return (
    <div className={styles.protocolDetail}>
      <Link href="/dashboard/protocols">
        <button className={styles.backBtn}>← Back to Protocols</button>
      </Link>

      <div className={styles.header}>
        <h1>{protocol.title}</h1>
        <div className={styles.meta}>
          {protocol.category && (
            <span className={styles.badge}>{protocol.category}</span>
          )}
          {protocol.sample_type && (
            <span className={styles.badge}>🔬 {protocol.sample_type}</span>
          )}
          {protocol.experiment_type && (
            <span className={styles.badge}>⚗️ {protocol.experiment_type}</span>
          )}
        </div>
      </div>

      {protocol.description && (
        <div className={styles.section}>
          <h2>Description</h2>
          <p>{protocol.description}</p>
        </div>
      )}

      <div className={styles.section}>
        <h2>Procedure</h2>

        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${progress}%` }}
          />
          <span className={styles.progressText}>
            {completedSteps.length} of {steps.length} steps completed (
            {Math.round(progress)}%)
          </span>
        </div>

        <div className={styles.stepsList}>
          {steps.map((step, index) => (
            <div
              key={index}
              className={`${styles.stepItem} ${
                completedSteps.includes(index) ? styles.completed : ""
              }`}
            >
              <div className={styles.stepHeader}>
                <input
                  type="checkbox"
                  checked={completedSteps.includes(index)}
                  onChange={() => toggleStep(index)}
                  className={styles.checkbox}
                />

                <div className={styles.stepNumber}>Step {step.step_number}</div>
              </div>

              <div className={styles.stepContent}>
                <p>{step.instruction}</p>

                <textarea
                  placeholder="Add notes for this step..."
                  value={notes[index] || ""}
                  onChange={(e) => handleNoteChange(index, e.target.value)}
                  className={styles.noteInput}
                  rows="2"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
