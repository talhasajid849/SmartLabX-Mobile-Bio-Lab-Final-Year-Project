'use client';
import { useState } from 'react';
import styles from '@/styles/user/ProtocolSteps.module.css';

export default function ProtocolSteps({ steps }) {
  const [completedSteps, setCompletedSteps] = useState([]);
  const [notes, setNotes] = useState({});

  const toggleStep = (index) => {
    setCompletedSteps(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleNoteChange = (index, value) => {
    setNotes(prev => ({ ...prev, [index]: value }));
  };

  const progress = steps.length > 0 ? (completedSteps.length / steps.length) * 100 : 0;

  return (
    <div className={styles.protocolSteps}>
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        <span className={styles.progressText}>
          {completedSteps.length} of {steps.length} steps completed
        </span>
      </div>

      <div className={styles.stepsList}>
        {steps.map((step, index) => (
          <div
            key={index}
            className={`${styles.stepItem} ${completedSteps.includes(index) ? styles.completed : ''}`}
          >
            <div className={styles.stepHeader}>
              <input
                type="checkbox"
                checked={completedSteps.includes(index)}
                onChange={() => toggleStep(index)}
                className={styles.checkbox}
              />
              <div className={styles.stepNumber}>Step {index + 1}</div>
            </div>
            <div className={styles.stepContent}>
              <p>{step}</p>
              <textarea
                placeholder="Add notes for this step..."
                value={notes[index] || ''}
                onChange={(e) => handleNoteChange(index, e.target.value)}
                className={styles.noteInput}
                rows="2"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
