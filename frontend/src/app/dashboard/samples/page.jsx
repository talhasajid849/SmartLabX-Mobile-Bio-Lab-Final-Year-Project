"use client";
import { useState, useEffect, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Link from "next/link";
import styles from "@/styles/user/sampleMain.module.css";
import useLoadMore from "@/hooks/useLoadMore";
import LoadMoreButton from "@/components/common/LoadMoreButton";
import LoadingSpinner from "@/components/visitor/LoadingSpinner";
import axios from "axios";
import { server } from "@/server/servert";

export default function SamplesPage() {
  const router = useRouter();
  const [samples, setSamples] = useState([]);
  const [filteredSamples, setFilteredSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  const loadSamples = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${server}/samples/`, {
        withCredentials: true
      });
      setSamples(response.data.samples || []);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load samples");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    loadSamples();
  }, [loadSamples]);

  const filterSamples = useCallback(() => {
    let filtered = samples;

    if (filterType !== "all") {
      filtered = filtered.filter((s) => s.sample_type === filterType);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (s) =>
          s.sample_identifier
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          s.geolocation?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredSamples(filtered);
  }, [searchTerm, filterType, samples]);

  useEffect(() => {
    filterSamples();
  }, [filterSamples]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this sample?")) return;

    try {
       await axios.delete(`${server}/samples/${id}`, {
        withCredentials: true
      });
      loadSamples();
      toast.success("Sample deleted!");
      loadSamples();
    } catch (error) {
      toast.error("Failed to delete sample");
    }
  };
  
  // console.log(filterSamples)

    const { visibleData, loadMore, hasMore } = useLoadMore(filteredSamples, 6);
  

  if (loading) {
    return (
      <LoadingSpinner name='Loading samples...' />
    );
  }

  return (
    <div className={styles.samplesPage}>
      <div className={styles.header}>
        <h1>My Samples</h1>
        <Link href="/dashboard/samples/new">
          <button className={styles.addBtn}>➕ Add New Sample</button>
        </Link>
      </div>

      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Search samples..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">All Types</option>
          <option value="water">Water</option>
          <option value="soil">Soil</option>
          <option value="plant">Plant</option>
          <option value="biological_fluid">Biological Fluid</option>
        </select>
      </div>

      {filteredSamples.length === 0 ? (
        <div className={styles.empty}>
          <p>No samples found</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {visibleData.map((sample) => (
            <SampleCard
              key={sample.samples_id}
              sample={sample}
              router={router}
              handleDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {hasMore && 
      <LoadMoreButton onClick={loadMore}/>
      }
    </div>
  );
}

const SampleCard =  memo(function SampleCard({ sample, router, handleDelete }) {
  return (
    <div key={sample.samples_id} className={styles.card}>
      <div className={styles.cardHeader}>
        <h3>{sample.sample_identifier}</h3>
        <span className={styles.badge}>{sample.sample_type}</span>
      </div>

      <div className={styles.cardBody}>
        <p>
          <strong>Date:</strong>{" "}
          {new Date(sample.collection_datetime).toLocaleDateString()}
        </p>
        <p>
          <strong>Location:</strong> {sample.geolocation || "N/A"}
        </p>

        {sample.ph && (
          <p>
            <strong>pH:</strong> {sample.ph}
          </p>
        )}
        {sample.temperature && (
          <p>
            <strong>Temp:</strong> {sample.temperature}°C
          </p>
        )}
      </div>

      <div className={styles.cardActions}>
        <button
          onClick={() => router.push(`/dashboard/samples/${sample.samples_id}`)}
          className={styles.viewBtn}
        >
          View
        </button>

        <button
          onClick={() => handleDelete(sample.samples_id)}
          className={styles.deleteBtn}
        >
          Delete
        </button>
      </div>
    </div>
  );
})
