'use client';
import React, { useState } from 'react';
import styles from '@/styles/admin/dashboard.styles';
import axios from 'axios';
import { server } from '@/server/servert';
import { toast } from 'react-toastify';

export default function UserModal({ user, onClose }) {
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'student',
    mobile_no: user?.mobile_no || '',
    city: user?.city || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (user) {
        // Check if role is changed to admin
        if (formData.role === 'admin' && user.role !== 'admin') {
          // Call promoteToAdmin endpoint
          await axios.put(`${server}/admin/users/${user.users_id}/promote`, {}, {
            withCredentials: true
          });
          toast.success('User promoted to admin successfully!');
          return;
        } else {
          // Regular update user
          await axios.put(`${server}/admin/users/${user.users_id}`, formData, {
            withCredentials: true
          });
          toast.success('User updated successfully!');
        }
      } else {
        // Regular update user
        await axios.post(`${server}/admin/users/`, formData, {
          withCredentials: true
        });
        toast.success('User created successfully!');
      }

      onClose();
    } catch (err) {
      toast.error('Operation failed: ' + (err.response?.data?.message || err.message));
    }
  };


  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.modalTitle}>
          {user ? 'Edit User' : 'Add New User'}
        </h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>First Name</label>
              <input
                style={styles.input}
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Last Name</label>
              <input
                style={styles.input}
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              style={styles.input}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Password {user && '(leave blank to keep current)'}</label>
            <input
              type="password"
              style={styles.input}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!user}
            />
          </div>

          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Role</label>
              <select
                style={styles.input}
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="student">Student</option>
                <option value="researcher">Researcher</option>
                <option value="technician">Technician</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>City</label>
              <input
                style={styles.input}
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Mobile Number</label>
            <input
              style={styles.input}
              value={formData.mobile_no}
              onChange={(e) => setFormData({ ...formData, mobile_no: e.target.value })}
              required
            />
          </div>

          <div style={styles.modalActions}>
            <button type="button" style={styles.btnSecondary} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" style={styles.btnPrimary}>
              {user ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}