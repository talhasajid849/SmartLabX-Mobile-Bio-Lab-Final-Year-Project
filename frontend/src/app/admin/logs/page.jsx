'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import styles from '@/styles/admin/dashboard.styles';
import SearchBar from '@/components/common/SearchBar';
import { loadActivityLogs } from '@/store/actions/activityLogs.action';
import Pagination from '@/components/common/Pagination';
import { useDebounce } from '@/hooks/useDebounce';
import LoadingSpinner from '@/components/visitor/LoadingSpinner';
import ResponsiveTable from '@/components/admin/ResponsiveTable';

export default function ActivityLogsTabAdmin() {
  const dispatch = useDispatch();
  const { logs, loading, pagination } = useSelector((state) => state.activityLogs);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(50);

  // Debounce search query with 500ms delay
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Load logs when debounced search, filter, or page changes
  useEffect(() => {
    dispatch(loadActivityLogs(currentPage, limit, debouncedSearchQuery, actionFilter));
  }, [dispatch, currentPage, limit, debouncedSearchQuery, actionFilter]);

  const handleSearch = useCallback((query) => {
    const trimmedQuery = query?.trim() || '';
    setSearchQuery(trimmedQuery);
    setCurrentPage(1);
  }, []);

  const handleFilterChange = useCallback((newFilter) => {
    setActionFilter(newFilter);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handleRefresh = useCallback(() => {
    dispatch(loadActivityLogs(currentPage, limit, debouncedSearchQuery, actionFilter));
    toast.success('Activity logs refreshed');
  }, [dispatch, currentPage, limit, debouncedSearchQuery, actionFilter]);

  // Memoize color and icon getters to prevent unnecessary recalculations
  const getActionColor = useCallback((action) => {
    const colors = {
      CREATE_USER: '#10b981',
      UPDATE_USER: '#3b82f6',
      DELETE_USER: '#ef4444',
      PROMOTE_USER: '#8b5cf6',
      CREATE_PROTOCOL: '#10b981',
      UPDATE_PROTOCOL: '#3b82f6',
      DELETE_PROTOCOL: '#ef4444',
      LOGIN: '#6366f1',
      LOGOUT: '#9ca3af',
      CREATED: '#10b981',
      UPDATED: '#3b82f6',
      DELETED: '#ef4444',
      REQUEST_UPDATED: '#f59e0b'
    };
    return colors[action] || '#6b7280';
  }, []);

  const getActionIcon = useCallback((action) => {
    const icons = {
      CREATE_USER: '➕',
      UPDATE_USER: '✏️',
      DELETE_USER: '🗑️',
      PROMOTE_USER: '👑',
      CREATE_PROTOCOL: '📋',
      UPDATE_PROTOCOL: '📝',
      DELETE_PROTOCOL: '🗑️',
      LOGIN: '🔓',
      LOGOUT: '🔒',
      CREATED: '✨',
      UPDATED: '🔄',
      DELETED: '❌',
      REQUEST_UPDATED: '📝'
    };
    return icons[action] || '📌';
  }, []);

  // Memoize the action filter options
  const actionFilterOptions = useMemo(() => [
    { value: 'all', label: 'All Actions' },
    { value: 'CREATE_USER', label: 'Create User' },
    { value: 'UPDATE_USER', label: 'Update User' },
    { value: 'DELETE_USER', label: 'Delete User' },
    { value: 'PROMOTE_USER', label: 'Promote User' },
    { value: 'CREATE_PROTOCOL', label: 'Create Protocol' },
    { value: 'UPDATE_PROTOCOL', label: 'Update Protocol' },
    { value: 'DELETE_PROTOCOL', label: 'Delete Protocol' },
    { value: 'LOGIN', label: 'Login' },
    { value: 'LOGOUT', label: 'Logout' },
    { value: 'CREATED', label: 'Created' },
    { value: 'UPDATED', label: 'Updated' },
    { value: 'DELETED', label: 'Deleted' },
    { value: 'REQUEST_UPDATED', label: 'Request Updated' }
  ], []);


  if(loading) return <LoadingSpinner name='Activities Loading....' />

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
        <h1 style={{ ...styles.pageTitle, margin: 0, color: "#111" }}>
          System Activity Logs
        </h1>

        {/* Search Bar */}
        <div style={{
          flex: '1 1 auto',
          maxWidth: '500px',
          minWidth: '250px'
        }}>
          <SearchBar
            value={searchQuery}
            onChange={(val) => setSearchQuery(val)}
            onSearch={handleSearch}
            placeholder="Search by action, details, or admin name..."
            ariaLabel="Search activity logs"
          />
        </div>

        {/* Action Filter */}
        <select
          style={{
            ...styles.input,
            width: 'auto',
            minWidth: '180px',
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid #000000ff',
            backgroundColor: '#2563eb',
            color: '#fff',
            cursor: 'pointer'
          }}
          value={actionFilter}
          onChange={(e) => handleFilterChange(e.target.value)}
          aria-label="Filter by action type"
        >
          {actionFilterOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <button
          style={{
            ...styles.btnPrimary,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
          onClick={handleRefresh}
          type="button"
          disabled={loading}
          aria-label="Refresh logs"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Results Count */}
      <p style={{
        margin: '0 0 16px 0',
        color: "#6b7280",
        fontSize: '14px'
      }}>
        Showing {logs.length} of {pagination?.total || 0} log{pagination?.total !== 1 ? 's' : ''}
        {actionFilter !== 'all' && ` (${actionFilter.replace(/_/g, ' ').toLowerCase()} only)`}
        {debouncedSearchQuery && ` matching "${debouncedSearchQuery}"`}
      </p>

      {/* Loading indicator while searching */}
      {loading && logs.length > 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '10px', 
          color: '#6b7280',
          fontSize: '14px',
        }}>
          Updating results...
        </div>
      )}

      {/* Activity Logs Table */}
      <div style={styles.tableContainer}>
        <ResponsiveTable minWidth="900px" style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Action</th>
              <th style={styles.th}>Details</th>
              <th style={styles.th}>Admin</th>
              <th style={styles.th}>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  style={{
                    ...styles.td,
                    textAlign: 'center',
                    padding: '48px 20px',
                    color: '#6b7280'
                  }}
                >
                  {debouncedSearchQuery
                    ? `No logs match "${debouncedSearchQuery}"`
                    : actionFilter !== 'all'
                    ? `No ${actionFilter.replace(/_/g, ' ').toLowerCase()} logs found`
                    : 'No activity logs found'}
                </td>
              </tr>
            ) : (
              logs.map(log => (
                <tr key={log.log_id} style={styles.tr}>
                  <td style={styles.td}>{log.log_id}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.badge,
                      backgroundColor: getActionColor(log.action),
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap'
                    }}>
                      <span>{getActionIcon(log.action)}</span>
                      <span>{log.action.replace(/_/g, ' ')}</span>
                    </span>
                  </td>
                  <td style={styles.td}>
                    {log.details ? (
                      <div style={{
                        maxWidth: '300px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }} title={log.details}>
                        {log.details}
                      </div>
                    ) : (
                      <span style={{ color: '#9ca3af' }}>—</span>
                    )}
                  </td>
                  <td style={styles.td}>
                    {log.user ? (
                      <div>
                        <strong>
                          {log.user.first_name && log.user.last_name
                            ? `${log.user.first_name} ${log.user.last_name}`
                            : log.admin_name || 'N/A'}
                        </strong>
                        {(log.user?.email || log.admin_email) && (
                          <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                            {log.user?.email || log.admin_email}
                          </div>
                        )}
                      </div>
                    ) : log.admin_name ? (
                      <div>
                        <strong>{log.admin_name}</strong>
                        {log.admin_email && (
                          <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                            {log.admin_email}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: '#9ca3af' }}>System</span>
                    )}
                  </td>
                  <td style={styles.td}>
                    {log.timestamp ? (
                      <div>
                        <div>
                          {new Date(log.timestamp).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                          {new Date(log.timestamp).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: '#9ca3af' }}>—</span>
                    )}
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
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}