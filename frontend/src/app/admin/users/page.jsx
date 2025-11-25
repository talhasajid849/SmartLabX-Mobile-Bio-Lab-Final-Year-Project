'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadUsersAdmin } from '@/store/actions/auth.action.js';
import styles from '@/styles/admin/dashboard.styles.js';
import axios from 'axios';
import { server } from '@/server/servert.js';
import { toast } from 'react-toastify';
import SearchBar from '@/components/common/SearchBar';
import ResponsiveTable from '@/components/admin/ResponsiveTable';
import UserModal from '@/components/admin/UserModal';
import Pagination from '@/components/common/Pagination';
import { useDebounce } from '@/hooks/useDebounce.js';

export default function UsersTab() {
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const limit = 50;

  const dispatch = useDispatch();
  const { users, pagination } = useSelector((state) => state.user);
  const usersArray = Array.isArray(users) ? users : [];

  // Debounce the search input to avoid too many server calls
  const debouncedSearch = useDebounce(searchQuery, 500);

  useEffect(() => {
    // Load users from server with page, limit, search, role
    dispatch(loadUsersAdmin(page, limit, debouncedSearch, roleFilter));
  }, [dispatch, page, debouncedSearch, roleFilter]);

  const getRoleColor = (role) => {
    const colors = {
      researcher: '#10b981',
      technician: '#f59e0b',
      admin: '#3b82f6'
    };
    return colors[role] || '#6b7280';
  };

  const handleEdit = useCallback((user) => {
    setEditingUser(user);
    setShowModal(true);
  }, []);

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await axios.delete(`${server}/admin/users/${id}`, { withCredentials: true });
      toast.success('User deleted successfully!');
      dispatch(loadUsersAdmin(page, limit, debouncedSearch, roleFilter));
    } catch (err) {
      toast.error('Delete failed: ' + err.message);
    }
  }, [dispatch, page, debouncedSearch, roleFilter]);

  const handleModalClose = useCallback(() => {
    setShowModal(false);
    setEditingUser(null);
    dispatch(loadUsersAdmin(page, limit, debouncedSearch, roleFilter));
  }, [dispatch, page, debouncedSearch, roleFilter]);

  const handleAddNew = useCallback(() => {
    setEditingUser(null);
    setShowModal(true);
  }, []);

  return (
    <div style={styles.tabContent}>
      {/* Header Section */}
      <div style={{
        ...styles.pageHeader,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        flexWrap: 'wrap',
        marginBottom: '24px'
      }}>
        <h1 style={{ ...styles.pageTitle, margin: 0 }}>User Management</h1>

        <div style={{ flex: '1 1 auto', maxWidth: '500px', minWidth: '250px' }}>
          <SearchBar
            value={searchQuery}
            onChange={(v) => { setPage(1); setSearchQuery(v); }}
            onSearch={(v) => { setPage(1); setSearchQuery(v); }}
            placeholder="Search by name, email, role, city..."
            ariaLabel="Search users"
          />
        </div>

        <select
          style={{
            ...styles.input,
            width: 'auto',
            minWidth: '150px',
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid #000',
            backgroundColor: '#2563eb',
            cursor: 'pointer'
          }}
          value={roleFilter}
          onChange={(e) => { setPage(1); setRoleFilter(e.target.value); }}
        >
          <option value="all">All Roles</option>
          <option value="researcher">Researcher</option>
          <option value="technician">Technician</option>
          <option value="admin">Admin</option>
        </select>

        <button
          style={styles.btnPrimary}
          onClick={handleAddNew}
          type="button"
        >
          ➕ Add New User
        </button>
      </div>

      {/* Results Count */}
      {(searchQuery || roleFilter !== 'all') && (
        <p style={{
          margin: '0 0 16px 0',
          color: '#6b7280',
          fontSize: '14px'
        }}>
          Showing {usersArray?.length} user{usersArray?.length !== 1 ? 's' : ''}
          {roleFilter !== 'all' && ` (${roleFilter} only)`}
        </p>
      )}

      {/* Users Table */}
      <div style={styles.tableContainer}>
        <ResponsiveTable minWidth="900px" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Role</th>
              <th style={styles.th}>City</th>
              <th style={styles.th}>Mobile</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {usersArray.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ ...styles.td, textAlign: 'center', padding: '48px 20px', color: '#6b7280' }}>
                  No users found
                </td>
              </tr>
            ) : (
              usersArray.map(user => (
                <tr key={user.users_id} style={styles.tr}>
                  <td style={styles.td}>{user.users_id}</td>
                  <td style={styles.td}><strong>{user.first_name} {user.last_name}</strong></td>
                  <td style={styles.td}><a href={`mailto:${user.email}`} style={{ color: '#3b82f6', textDecoration: 'none' }}>{user.email}</a></td>
                  <td style={styles.td}>
                    <span style={{ ...styles.badge, backgroundColor: getRoleColor(user.role), textTransform: 'capitalize' }}>{user.role}</span>
                  </td>
                  <td style={styles.td}>{user.city || 'N/A'}</td>
                  <td style={styles.td}>{user.mobile_no || 'N/A'}</td>
                  <td style={styles.td}>
                    <button style={{ ...styles.btnEdit, marginRight: '8px' }} onClick={() => handleEdit(user)}>✏️ Edit</button>
                    <button style={styles.btnDelete} onClick={() => handleDelete(user.users_id)}>🗑️ Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </ResponsiveTable>
      </div>

      {/* Pagination */}


      {(pagination && pagination.totalPages > 1) && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={(p) => setPage(p)}
        />
      )}

      {showModal && (
        <UserModal user={editingUser} onClose={handleModalClose} />
      )}
    </div>
  );
}
