// ===== 13. src/components/user/samples/SampleCard.jsx =====
import { useRouter } from 'next/navigation';
import styles from '@/styles/user/SampleCard.module.css';

export default function SampleCard({ sample, onDelete }) {
  const router = useRouter();

  return (
    <div className={styles.sampleCard}>
      <div className={styles.header}>
        <h3>{sample.sample_identifier}</h3>
        <span className={`${styles.badge} ${styles[sample.sample_type]}`}>
          {sample.sample_type}
        </span>
      </div>
      <div className={styles.details}>
        <p>📅 {new Date(sample.collection_datetime).toLocaleString()}</p>
        {sample.geolocation && <p>📍 {sample.geolocation}</p>}
        {sample.temperature && <p>🌡️ {sample.temperature}°C</p>}
        {sample.ph && <p>pH: {sample.ph}</p>}
      </div>
      <div className={styles.actions}>
        <button onClick={() => router.push(`/dashboard/samples/${sample.samples_id}`)}>
          Edit
        </button>
        <button onClick={() => onDelete(sample.samples_id)} className={styles.deleteBtn}>
          Delete
        </button>
      </div>
    </div>
  );
}