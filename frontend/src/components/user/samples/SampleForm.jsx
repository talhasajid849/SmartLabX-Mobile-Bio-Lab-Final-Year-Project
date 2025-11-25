// /src/components/user/samples/SampleForm.js

'use client';
import { useState, useEffect } from 'react';
import styles from '@/styles/user/samples.styles';

export default function SampleForm({ sample, onSubmit }) {
  const [formData, setFormData] = useState({
    sample_identifier: sample?.sample_identifier || '',
    collection_datetime: sample?.collection_datetime || '',
    sample_type: sample?.sample_type || 'water',
    geolocation: sample?.geolocation || '',
    latitude: sample?.latitude || '',
    longitude: sample?.longitude || '',
    ph: sample?.ph || '',
    temperature: sample?.temperature || '',
    salinity: sample?.salinity || '',
    notes: sample?.notes || '',
    qr_code_data: sample?.qr_code_data || '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Get current location
  const getCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
            geolocation: `${position.coords.latitude}, ${position.coords.longitude}`,
          });
        },
        (error) => {
          alert('Failed to get location: ' + error.message);
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.sample_identifier.trim()) {
      newErrors.sample_identifier = 'Sample identifier is required';
    }

    if (!formData.collection_datetime) {
      newErrors.collection_datetime = 'Collection date/time is required';
    }

    if (formData.ph && (formData.ph < 0 || formData.ph > 14)) {
      newErrors.ph = 'pH must be between 0 and 14';
    }

    if (formData.temperature && formData.temperature < -100) {
      newErrors.temperature = 'Invalid temperature';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.formSection}>
        <h3 style={styles.formSectionTitle}>Basic Information</h3>

        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Sample Identifier *</label>
            <input
              type="text"
              style={{
                ...styles.input,
                ...(errors.sample_identifier ? { borderColor: '#ef4444' } : {}),
              }}
              value={formData.sample_identifier}
              onChange={(e) =>
                setFormData({ ...formData, sample_identifier: e.target.value })
              }
              placeholder="e.g., SAMPLE-001"
            />
            {errors.sample_identifier && (
              <span style={styles.error}>{errors.sample_identifier}</span>
            )}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Collection Date & Time *</label>
            <input
              type="datetime-local"
              style={{
                ...styles.input,
                ...(errors.collection_datetime ? { borderColor: '#ef4444' } : {}),
              }}
              value={formData.collection_datetime}
              onChange={(e) =>
                setFormData({ ...formData, collection_datetime: e.target.value })
              }
            />
            {errors.collection_datetime && (
              <span style={styles.error}>{errors.collection_datetime}</span>
            )}
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Sample Type *</label>
          <select
            style={styles.input}
            value={formData.sample_type}
            onChange={(e) =>
              setFormData({ ...formData, sample_type: e.target.value })
            }
          >
            <option value="water">Water</option>
            <option value="soil">Soil</option>
            <option value="plant">Plant</option>
            <option value="biological_fluid">Biological Fluid</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div style={styles.formSection}>
        <h3 style={styles.formSectionTitle}>Location Information</h3>

        <div style={styles.formGroup}>
          <label style={styles.label}>Geolocation</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              style={styles.input}
              value={formData.geolocation}
              onChange={(e) =>
                setFormData({ ...formData, geolocation: e.target.value })
              }
              placeholder="Location name or coordinates"
            />
            <button
              type="button"
              style={styles.btnSecondary}
              onClick={getCurrentLocation}
            >
              📍 Get Location
            </button>
          </div>
        </div>

        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Latitude</label>
            <input
              type="number"
              step="0.000001"
              style={styles.input}
              value={formData.latitude}
              onChange={(e) =>
                setFormData({ ...formData, latitude: e.target.value })
              }
              placeholder="e.g., 33.8688"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Longitude</label>
            <input
              type="number"
              step="0.000001"
              style={styles.input}
              value={formData.longitude}
              onChange={(e) =>
                setFormData({ ...formData, longitude: e.target.value })
              }
              placeholder="e.g., 73.0522"
            />
          </div>
        </div>
      </div>

      <div style={styles.formSection}>
        <h3 style={styles.formSectionTitle}>Environmental Data</h3>

        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>pH Level</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="14"
              style={{
                ...styles.input,
                ...(errors.ph ? { borderColor: '#ef4444' } : {}),
              }}
              value={formData.ph}
              onChange={(e) =>
                setFormData({ ...formData, ph: e.target.value })
              }
              placeholder="0-14"
            />
            {errors.ph && <span style={styles.error}>{errors.ph}</span>}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Temperature (°C)</label>
            <input
              type="number"
              step="0.1"
              style={{
                ...styles.input,
                ...(errors.temperature ? { borderColor: '#ef4444' } : {}),
              }}
              value={formData.temperature}
              onChange={(e) =>
                setFormData({ ...formData, temperature: e.target.value })
              }
              placeholder="e.g., 25.5"
            />
            {errors.temperature && (
              <span style={styles.error}>{errors.temperature}</span>
            )}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Salinity (ppt)</label>
            <input
              type="number"
              step="0.1"
              style={styles.input}
              value={formData.salinity}
              onChange={(e) =>
                setFormData({ ...formData, salinity: e.target.value })
              }
              placeholder="e.g., 35.0"
            />
          </div>
        </div>
      </div>

      <div style={styles.formSection}>
        <h3 style={styles.formSectionTitle}>Additional Information</h3>

        <div style={styles.formGroup}>
          <label style={styles.label}>Notes</label>
          <textarea
            style={{ ...styles.input, minHeight: '100px', resize: 'vertical' }}
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            placeholder="Any additional observations or notes..."
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>QR Code Data (Optional)</label>
          <input
            type="text"
            style={styles.input}
            value={formData.qr_code_data}
            onChange={(e) =>
              setFormData({ ...formData, qr_code_data: e.target.value })
            }
            placeholder="QR code identifier"
          />
        </div>
      </div>

      <div style={styles.formActions}>
        <button
          type="submit"
          style={{
            ...styles.btnPrimary,
            opacity: loading ? 0.7 : 1,
          }}
          disabled={loading}
        >
          {loading ? 'Saving...' : sample ? 'Update Sample' : 'Add Sample'}
        </button>
      </div>
    </form>
  );
}