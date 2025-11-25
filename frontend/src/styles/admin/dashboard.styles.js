// /src/styles/admin/dashboard.styles.js

const styles = {
  // ==================== LAYOUT ====================
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f4f8feff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    position: 'relative'
  },

  // ==================== SIDEBAR ====================
  sidebar: {
    width: '260px',
    backgroundColor: '#1e293b',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    height: '100vh',
    overflowY: 'auto',
    zIndex: 100,
    transition: 'transform 0.3s ease',
    left: 0,
    top: 0
  },

  sidebarMobile: {
    transform: 'translateX(-100%)'
  },

  sidebarOpen: {
    transform: 'translateX(0)'
  },

  sidebarOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 99,
    display: 'none'
  },

  sidebarOverlayActive: {
    display: 'block'
  },

  sidebarHeader: {
    padding: '24px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.1)'
  },

  logo: {
    margin: 0,
    fontSize: '22px',
    fontWeight: '700',
    color: '#fff'
  },

  logoSubtitle: {
    margin: '4px 0 0 0',
    fontSize: '13px',
    color: '#94a3b8',
    fontWeight: '400'
  },

  nav: {
    padding: '20px 0',
    flex: 1
  },

  navItem: {
    width: '100%',
    padding: '14px 20px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#cbd5e1',
    fontSize: '15px',
    textAlign: 'left',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    transition: 'all 0.2s ease',
    fontWeight: '500'
  },

  navItemActive: {
    backgroundColor: '#334155',
    color: '#fff',
    borderLeft: '4px solid #3b82f6'
  },

  navIcon: {
    fontSize: '18px'
  },

  // ==================== MAIN CONTENT ====================
  main: {
    marginLeft: '260px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    width: 'calc(100% - 260px)',
    transition: 'margin-left 0.3s ease, width 0.3s ease'
  },

  mainFullWidth: {
    marginLeft: 0,
    width: '100%'
  },

  // ==================== Sample ====================
sampleModelData: {
 padding: '10px 0',
 color: '#212121'
},

  // ==================== HEADER ====================
  header: {
    backgroundColor: 'white',
    padding: '16px 20px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    gap: '16px',
    flexWrap: 'wrap'
  },

  headerTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '600',
    color: '#1e293b',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },

  menuToggle: {
    display: 'none',
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '8px',
    color: '#1e293b'
  },

  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap'
  },

  adminBadge: {
    backgroundColor: '#f1f5f9',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    color: '#475569',
    fontWeight: '500',
    whiteSpace: 'nowrap'
  },

  btnLogout: {
    padding: '8px 20px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    whiteSpace: 'nowrap',
    color: '#fff'
  },

  // ==================== TAB CONTENT ====================
  tabContent: {
    padding: '24px 20px',
    flex: 1
  },

  pageTitle: {
    margin: '0 0 24px 0',
    fontSize: '24px',
    fontWeight: '700',
    color: '#1e293b'
  },

  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    gap: '16px',
    flexWrap: 'wrap'
  },

  // ==================== STATS GRID ====================
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginTop: '20px'
  },

  statsCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    minWidth: 0
  },

  statsIcon: {
    fontSize: '32px',
    width: '56px',
    height: '56px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: '10px',
    flexShrink: 0
  },

  statsContent: {
    flex: 1,
    minWidth: 0
  },

  statsTitle: {
    margin: 0,
    fontSize: '13px',
    color: '#64748b',
    fontWeight: '500'
  },

  statsValue: {
    margin: '8px 0 0 0',
    fontSize: '24px',
    fontWeight: '700',
    color: '#1e293b'
  },

  // ==================== TABLE ====================
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '10px',
    overflow: 'auto',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    maxWidth: '100%'
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '800px'
  },

  th: {
    padding: '16px 12px',
    textAlign: 'left',
    backgroundColor: '#f8fafc',
    color: '#1e293b',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '2px solid #e5e7eb',
    whiteSpace: 'nowrap'
  },

  tr: {
    borderBottom: '1px solid #f1f5f9',
    transition: 'background-color 0.2s'
  },

  td: {
    padding: '16px 12px',
    color: '#334155',
    fontSize: '14px'
  },

  badge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    backgroundColor: '#3b82f6',
    color: 'white',
    textTransform: 'capitalize',
    whiteSpace: 'nowrap'
  },

  // ==================== BUTTONS ====================
  btnPrimary: {
    padding: '10px 20px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    whiteSpace: 'nowrap'
  },

  btnSecondary: {
    padding: '10px 20px',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    whiteSpace: 'nowrap'
  },

  btnEdit: {
    padding: '6px 12px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    marginRight: '8px',
    transition: 'background-color 0.2s',
    whiteSpace: 'nowrap'
  },

  btnDelete: {
    padding: '6px 12px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    whiteSpace: 'nowrap'
  },

  // ==================== MODAL ====================
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
    overflowY: 'auto'
  },

  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '28px',
    maxWidth: '600px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
    margin: 'auto'
  },

  modalTitle: {
    margin: '0 0 24px 0',
    fontSize: '22px',
    fontWeight: '700',
    color: '#1e293b'
  },

  // ==================== FORM ====================
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },

  formRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px'
  },

  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },

  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#475569'
  },

  input: {
    padding: '10px 14px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '14px',
    color: '#ffffffff',
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: 'inherit',
    width: '100%',
    boxSizing: 'border-box'
  },

  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '8px',
    flexWrap: 'wrap'
  }
};

// ==================== MEDIA QUERIES ====================
// Create a function to apply responsive styles
export const getResponsiveStyles = () => {
  if (typeof window === 'undefined') return styles;

  const width = window.innerWidth;

  // Mobile styles (< 768px)
  if (width < 768) {
    return {
      ...styles,
      main: {
        ...styles.main,
        marginLeft: 0,
        width: '100%'
      },
      menuToggle: {
        ...styles.menuToggle,
        display: 'block'
      },
      header: {
        ...styles.header,
        padding: '12px 16px'
      },
      headerTitle: {
        ...styles.headerTitle,
        fontSize: '18px'
      },
      tabContent: {
        ...styles.tabContent,
        padding: '16px 12px'
      },
      pageTitle: {
        ...styles.pageTitle,
        fontSize: '20px'
      },
      statsGrid: {
        ...styles.statsGrid,
        gridTemplateColumns: '1fr',
        gap: '12px'
      },
      statsCard: {
        ...styles.statsCard,
        padding: '16px'
      },
      statsIcon: {
        ...styles.statsIcon,
        fontSize: '28px',
        width: '48px',
        height: '48px'
      },
      statsValue: {
        ...styles.statsValue,
        fontSize: '20px'
      },
      table: {
        ...styles.table,
        minWidth: '600px'
      },
      th: {
        ...styles.th,
        padding: '12px 8px',
        fontSize: '11px'
      },
      td: {
        ...styles.td,
        padding: '12px 8px',
        fontSize: '13px'
      },
      modal: {
        ...styles.modal,
        padding: '20px',
        maxHeight: '85vh'
      },
      modalTitle: {
        ...styles.modalTitle,
        fontSize: '20px'
      },
      formRow: {
        ...styles.formRow,
        gridTemplateColumns: '1fr'
      },
      adminBadge: {
        ...styles.adminBadge,
        padding: '6px 12px',
        fontSize: '13px'
      },
      btnLogout: {
        ...styles.btnLogout,
        padding: '6px 16px',
        fontSize: '13px'
      },
      btnEdit: {
        ...styles.btnEdit,
        padding: '5px 10px',
        fontSize: '12px',
        marginRight: '4px'
      },
      btnDelete: {
        ...styles.btnDelete,
        padding: '5px 10px',
        fontSize: '12px'
      }
    };
  }

  // Tablet styles (768px - 1024px)
  if (width >= 768 && width < 1024) {
    return {
      ...styles,
      main: {
        ...styles.main,
        marginLeft: 0,
        width: '100%'
      },
      menuToggle: {
        ...styles.menuToggle,
        display: 'block'
      },
      statsGrid: {
        ...styles.statsGrid,
        gridTemplateColumns: 'repeat(2, 1fr)'
      },
      formRow: {
        ...styles.formRow,
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))'
      }
    };
  }

  // Desktop styles (>= 1024px)
  return styles;
};

export default styles;