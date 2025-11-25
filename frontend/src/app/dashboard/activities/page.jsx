'use client';
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import styles from '@/styles/admin/dashboard.styles';
import SearchBar from '@/components/common/SearchBar';
import Pagination from '@/components/common/Pagination';
import { useDebounce } from '@/hooks/useDebounce';
import { server } from '@/server/servert';
import LoadingSpinner from '@/components/visitor/LoadingSpinner';
import ResponsiveTable from '@/components/admin/ResponsiveTable';

export default function ActivityLogsTabUser() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(40);

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Fetch logs from backend
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${server}/auth/get-user-activities`, {
        params: {
          page: currentPage,
          limit,
          search: debouncedSearchQuery
        },
        withCredentials: true
      });

      if (response.data.success) {
        setLogs(response.data.logs);
        setPagination({
          total: response.data.total,
          totalPages: response.data.totalPages
        });
      } else {
        toast.error('Failed to fetch activity logs');
      }
    } catch (error) {
      toast.error('Error fetching logs: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, debouncedSearchQuery]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);


  if(loading) return <LoadingSpinner name='Activities Loading....' />
  // console.log(logs)

  return (
    <div style={styles.tabContent}>
      <div style={{
        ...styles.pageHeader,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        flexWrap: 'wrap',
        marginBottom: '24px'
      }}>
        <h1 style={{ ...styles.pageTitle, margin: 0, color: "#fff" }}>
          My Activity Logs
        </h1>

        <div style={{ flex: '1 1 auto', maxWidth: '500px', minWidth: '250px' }}>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onSearch={handleSearch}
            placeholder="Search by action or details..."
            ariaLabel="Search activity logs"
          />
        </div>

        <button
          style={styles.btnPrimary}
          onClick={fetchLogs}
          disabled={loading}
        >
          🔄 Refresh
        </button>
      </div>

      <p style={{ margin: '0 0 16px 0', color: "#6b7280", fontSize: '14px' }}>
        Showing {logs.length} of {pagination.total} log{pagination.total !== 1 ? 's' : ''}
        {debouncedSearchQuery && ` matching "${debouncedSearchQuery}"`}
      </p>

      <div style={styles.tableContainer}>
        <ResponsiveTable minWidth="900px" style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Action</th>
              <th style={styles.th}>Details</th>
              <th style={styles.th}>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ ...styles.td, textAlign: 'center', padding: '48px 20px', color: '#6b7280' }}>
                  {debouncedSearchQuery ? `No logs match "${debouncedSearchQuery}"` : 'No activity logs found'}
                </td>
              </tr>
            ) : (
              logs.map(log => (
                <tr key={log.log_id} style={styles.tr}>
                  <td style={styles.td}>{log.log_id}</td>
                  <td style={styles.td}>{log.action.replace(/_/g, ' ')}</td>
                  <td style={styles.td}>{log.details || '—'}</td>
                  <td style={styles.td}>
                    {log.timestamp ? (
                      <div>
                        <div>{new Date(log.timestamp).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}</div>
                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                          {new Date(log.timestamp).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </div>
                      </div>
                    ) : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </ResponsiveTable>
      </div>

      {pagination.totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
