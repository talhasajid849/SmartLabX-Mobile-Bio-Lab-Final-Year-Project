'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import axios from 'axios';
import styles from '@/styles/user/protocols.module.css';
import LoadingSpinner from '@/components/visitor/LoadingSpinner';
import { server } from '@/server/servert';
import LoadMoreButton from '@/components/common/LoadMoreButton';

const ITEMS_PER_PAGE = 9;

export default function ProtocolsPage() {
  const router = useRouter();
  const [protocols, setProtocols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);

  useEffect(() => {
    fetchProtocols();
    fetchCategories();
  }, []);

  // Reset display count when search or category changes
  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE);
  }, [searchTerm, selectedCategory]);

  const fetchProtocols = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${server}/protocols`, {
        withCredentials: true
      });
      setProtocols(response.data.protocols || []);
    } catch (error) {
      console.error('Error fetching protocols:', error);
      toast.error('Failed to load protocols');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${server}/protocols/categories`, {
        withCredentials: true
      });
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const filteredProtocols = protocols.filter(p => {
    const matchesSearch = p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get protocols to display (limited by displayCount)
  const displayedProtocols = filteredProtocols.slice(0, displayCount);
  const hasMore = displayCount < filteredProtocols.length;

  const handleLoadMore = () => {
    setDisplayCount(prev => prev + ITEMS_PER_PAGE);
  };

  const handleProtocolClick = (protocol) => {
    console.log(protocol.protocols_id)
    router.push(`/dashboard/protocols/${protocol.protocols_id}`);
  };

  if (loading) {
    return (
      <LoadingSpinner name='Loading Protocols....' />
    );
  }

  return (
    <div className={styles.protocolsPage}>
      <div className={styles.pageHeader}>
        <h1>📚 Experiment Protocols</h1>
        <p className={styles.subtitle}>
          Browse and follow step-by-step biological experiment protocols
        </p>
      </div>

      <div className={styles.filtersSection}>
        <input
          type="text"
          placeholder="Search protocols..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />

        <div className={styles.categoryFilters}>
          <button
            className={`${styles.categoryBtn} ${selectedCategory === 'all' ? styles.active : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            All
          </button>
          {categories.map(category => (
            <button
              key={category}
              className={`${styles.categoryBtn} ${selectedCategory === category ? styles.active : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className={styles.resultsInfo}>
        <p>
          Showing <strong>{displayedProtocols.length}</strong> of{' '}
          <strong>{filteredProtocols.length}</strong> protocol{filteredProtocols.length !== 1 ? 's' : ''}
        </p>
      </div>

      {filteredProtocols.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📚</div>
          <h3>No protocols found</h3>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      ) : (
        <>
          <div className={styles.protocolsGrid}>
            {displayedProtocols.map(protocol => (
              <div
                key={protocol.protocols_id}
                className={styles.protocolCard}
                onClick={() => handleProtocolClick(protocol)}
              >
                <div className={styles.cardHeader}>
                  <h3>{protocol.title}</h3>
                  {protocol.category && (
                    <span className={styles.category}>{protocol.category}</span>
                  )}
                </div>
                <p className={styles.description}>
                  {protocol.description || 'No description available'}
                </p>
                <div className={styles.cardFooter}>
                  {protocol.sample_type && (
                    <span className={styles.sampleType}>
                      🔬 {protocol.sample_type}
                    </span>
                  )}
                  {protocol.experiment_type && (
                    <span className={styles.experimentType}>
                      ⚗️ {protocol.experiment_type}
                    </span>
                  )}
                </div>
                <div className={styles.cardAction}>
                  <span>View Protocol →</span>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <LoadMoreButton onClick={handleLoadMore} />            
          )}
        </>
      )}
    </div>
  );
}
