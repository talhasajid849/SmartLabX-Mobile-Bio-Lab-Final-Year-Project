'use client';
import React, { useState } from 'react';
import { validateRegistration } from '@/utils/validation';
import styles from '@/styles/visitor/landing.module.css';
import Image from 'next/image';
import axios from 'axios';
import { server } from '@/server/servert';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

export default function RegisterModal({ isOpen, onClose }) {
  const { isAuthisAuthenticated, loading } = useSelector((state) => state.user);
  const router = useRouter();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: '',
    role: 'student',
    mobile_no: '',
    city: '',
    profile_picture: null,
  });
  const [loadinge, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [previewImage, setPreviewImage] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, profile_picture: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const validationErrors = validateRegistration(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key !== 'confirm_password' && formData[key]) {
          if (key === 'profile_picture' && formData[key] instanceof File) {
            formDataToSend.append('profile_picture', formData[key]);
          } else {
            formDataToSend.append(key, formData[key]);
          }
        }
      });

      const config = {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };
      await axios.post(`${server}/auth/register`, formDataToSend, config);
      toast.success('Registration successful! Please login to continue.');
      onClose();
      window.location.href = '/login';
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (isAuthisAuthenticated && !loading) {
    router.push('/');
  }

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.registerModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Create Your Account</h2>
          <button className={styles.modalClose} onClick={onClose}>
            ✕
          </button>
        </div>

        {errors.submit && <div className={styles.errorAlert}>{errors.submit}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>First Name *</label>
              <input
                type="text"
                className={`${styles.input} ${errors.first_name ? styles.errorInput : ''}`}
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="John"
              />
              {errors.first_name && <span className={styles.error}>{errors.first_name}</span>}
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Last Name *</label>
              <input
                type="text"
                className={`${styles.input} ${errors.last_name ? styles.errorInput : ''}`}
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Doe"
              />
              {errors.last_name && <span className={styles.error}>{errors.last_name}</span>}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Email *</label>
            <input
              type="email"
              className={`${styles.input} ${errors.email ? styles.errorInput : ''}`}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john.doe@example.com"
            />
            {errors.email && <span className={styles.error}>{errors.email}</span>}
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Password *</label>
              <input
                type="password"
                className={`${styles.input} ${errors.password ? styles.errorInput : ''}`}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
              />
              {errors.password && <span className={styles.error}>{errors.password}</span>}
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Confirm Password *</label>
              <input
                type="password"
                className={`${styles.input} ${errors.confirm_password ? styles.errorInput : ''}`}
                value={formData.confirm_password}
                onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                placeholder="••••••••"
              />
              {errors.confirm_password && <span className={styles.error}>{errors.confirm_password}</span>}
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Role *</label>
              <select
                className={styles.input}
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="student">Student</option>
                <option value="researcher">Researcher</option>
                <option value="technician">Technician</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>City *</label>
              <input
                type="text"
                className={`${styles.input} ${errors.city ? styles.errorInput : ''}`}
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="New York"
              />
              {errors.city && <span className={styles.error}>{errors.city}</span>}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Mobile Number *</label>
            <input
              type="tel"
              className={`${styles.input} ${errors.mobile_no ? styles.errorInput : ''}`}
              value={formData.mobile_no}
              onChange={(e) => setFormData({ ...formData, mobile_no: e.target.value })}
              placeholder="+1 (555) 123-4567"
            />
            {errors.mobile_no && <span className={styles.error}>{errors.mobile_no}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Profile Picture (Optional)</label>
            <input
              type="file"
              className={styles.inputFile}
              accept="image/*"
              onChange={handleFileChange}
            />
            {previewImage && (
              <Image
                src={previewImage}
                alt="Preview"
                className={styles.imagePreview}
                width={150}
                height={150}
                unoptimized
              />
            )}
          </div>

          <button
            type="submit"
            className={styles.btnRegisterSubmit}
            style={{ opacity: loadinge ? 0.7 : 1 }}
            disabled={loadinge}
          >
            {loadinge ? 'Creating Account...' : 'Create Account'}
          </button>

          <p className={styles.loginLink}>
            Already have an account? <a href="/login" className={styles.link}>Login here</a>
          </p>
        </form>
      </div>
    </div>
  );
}
