'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import styles from '@/styles/admin/dashboard.styles.js';
import SearchBar from '@/components/common/SearchBar';
import Pagination from '@/components/common/Pagination';
import dynamic from 'next/dynamic';
import { deleteProtocol, loadProtocols } from '@/store/actions/protocols.action.js';
import LoadingSpinner from '@/components/visitor/LoadingSpinner';
import ResponsiveTable from '@/components/admin/ResponsiveTable';
const ProtocolModal = dynamic(() => import('@/components/admin/ProtocolModal'), { ssr: false });

export default function ProtocolsTab() {
  const dispatch = useDispatch();
  const { protocols, loading, pagination } = useSelector((state) => state.protocols);
  
  const [showModal, setShowModal] = useState(false);
  const [editingProtocol, setEditingProtocol] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);

  useEffect(() => {
    dispatch(loadProtocols(currentPage, limit, searchQuery));
  }, [dispatch, currentPage, limit, searchQuery]);

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handleEdit = useCallback((protocol) => {
    setEditingProtocol(protocol);
    setShowModal(true);
  }, []);

  const handleDelete = useCallback(async (id) => {
    if (window.confirm('Are you sure you want to delete this protocol?')) {
       dispatch(deleteProtocol(id));
 
        toast.success('Protocol deleted successfully!');
        dispatch(loadProtocols(currentPage, limit, searchQuery));
    
    }
  }, [dispatch, currentPage, limit, searchQuery]);

  const handleModalClose = useCallback(() => {
    setShowModal(false);
    setEditingProtocol(null);
    dispatch(loadProtocols(currentPage, limit, searchQuery));
  }, [dispatch, currentPage, limit, searchQuery]);

  const handleAddNew = useCallback(() => {
    setEditingProtocol(null);
    setShowModal(true);
  }, []);


  if(loading) return <LoadingSpinner name='Loading protocols...' />
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
        <h1 style={{ ...styles.pageTitle, margin: 0 }}>
          Protocol Management
        </h1>

        {/* Search Bar */}
        <div style={{ 
          flex: '1 1 auto', 
          maxWidth: '500px',
          minWidth: '250px'
        }}>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onSearch={handleSearch}
            placeholder="Search by title, category, type..."
            ariaLabel="Search protocols"
          />
        </div>

        <button
          style={styles.btnPrimary}
          onClick={handleAddNew}
          type="button"
        >
          ➕ Add New Protocol
        </button>
      </div>

      {/* Results Count */}
      <p style={{ 
        margin: '0 0 16px 0', 
        color: '#6b7280', 
        fontSize: '14px' 
      }}>
        Showing {protocols.length} of {pagination?.total} protocol{pagination?.total !== 1 ? 's' : ''}
        {searchQuery && ` matching "${searchQuery}"`}
      </p>

      {/* Protocols Table */}
      <div style={styles.tableContainer}>
        <ResponsiveTable minWidth="900px" style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Title</th>
              <th style={styles.th}>Category</th>
              <th style={styles.th}>Sample Type</th>
              <th style={styles.th}>Experiment Type</th>
              <th style={styles.th}>Created</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {protocols.length === 0 ? (
              <tr>
                <td 
                  colSpan="7" 
                  style={{
                    ...styles.td, 
                    textAlign: 'center', 
                    padding: '48px 20px',
                    color: '#6b7280'
                  }}
                >
                  {searchQuery 
                    ? `No protocols match "${searchQuery}"` 
                    : 'No protocols found. Click "Add New Protocol" to create one.'}
                </td>
              </tr>
            ) : (
              protocols.map(protocol => (
                <tr key={protocol.protocols_id} style={styles.tr}>
                  <td style={styles.td}>{protocol.protocols_id}</td>
                  <td style={styles.td}>
                    <strong>{protocol.title}</strong>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.badge}>{protocol.category || 'N/A'}</span>
                  </td>
                  <td style={styles.td}>{protocol.sample_type || 'N/A'}</td>
                  <td style={styles.td}>{protocol.experiment_type || 'N/A'}</td>
                  <td style={styles.td}>
                    {protocol.created_at 
                      ? new Date(protocol.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })
                      : '—'}
                  </td>
                  <td style={styles.td}>
                    <button
                      style={{ ...styles.btnEdit, marginRight: '8px' }}
                      onClick={() => handleEdit(protocol)}
                      type="button"
                      aria-label={`Edit ${protocol.title}`}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      style={styles.btnDelete}
                      onClick={() => handleDelete(protocol.protocols_id)}
                      type="button"
                      aria-label={`Delete ${protocol.title}`}
                    >
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </ResponsiveTable>
      </div>

      {/* Pagination */}
      {pagination?.totalPages > 1 && (
        <Pagination 
          currentPage={currentPage}
          totalPages={pagination?.totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {showModal && (
        <ProtocolModal
          protocol={editingProtocol}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}