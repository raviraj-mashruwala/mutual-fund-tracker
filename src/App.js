// src/App.js - UPDATED WITH NAV HISTORY TAB
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import NavHistory from './components/NavHistory';
import InvestmentForm from './components/InvestmentForm';
import InvestmentTable from './components/InvestmentTable';
import GroupedInvestmentView from './components/GroupedInvestmentView';
import ThemeToggle from './components/ThemeToggle';
import { calculatePortfolioMetrics } from './utils/calculations';
import { formatDate } from './utils/dateFormatter';
import { 
  fetchInvestments, 
  addInvestment, 
  updateInvestment, 
  deleteInvestment 
} from './utils/firebaseService';

function App() {
  const { theme } = useTheme();
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('individual');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [editingInvestment, setEditingInvestment] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(null);

  useEffect(() => {
    if (currentUser) {
      loadInvestments();
    }
  }, [currentUser]);

  const loadInvestments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchInvestments(currentUser.uid);
      setInvestments(data);
    } catch (err) {
      setError('Failed to load investments.');
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshNAV = async () => {
    try {
      setRefreshing(true);
      setError(null);

      const CLOUD_FUNCTION_URL = 'https://us-central1-mutual-fund-tracker-d93c4.cloudfunctions.net/manualUpdateNAV';

      const response = await fetch(CLOUD_FUNCTION_URL);
      const result = await response.json();

      if (result.success) {
        await loadInvestments();
        setLastRefreshTime(new Date());
      } else {
        setError(`Failed to refresh NAV: ${result.error}`);
      }
    } catch (err) {
      setError('Failed to refresh NAV. Please try again.');
      console.error('Refresh error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      try {
        await logout();
        navigate('/login');
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
  };

  const handleAddInvestment = async (formData) => {
    try {
      setError(null);
      const newInvestment = await addInvestment(formData, currentUser.uid);
      setInvestments(prev => [...prev, newInvestment]);
      setShowForm(false);
    } catch (err) {
      setError('Failed to add investment.');
      console.error('Add error:', err);
    }
  };

  const handleUpdateInvestment = async (formData) => {
    try {
      setError(null);
      await updateInvestment(editingInvestment.id, formData, currentUser.uid);
      setInvestments(prev => prev.map(inv => 
        inv.id === editingInvestment.id ? { ...inv, ...formData } : inv
      ));
      setEditingInvestment(null);
      setShowForm(false);
    } catch (err) {
      setError('Failed to update investment.');
      console.error('Update error:', err);
    }
  };

  const handleDeleteInvestment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this investment?')) {
      return;
    }

    try {
      setError(null);
      await deleteInvestment(id, currentUser.uid);
      setInvestments(prev => prev.filter(inv => inv.id !== id));
    } catch (err) {
      setError('Failed to delete investment.');
      console.error('Delete error:', err);
    }
  };

  const handleEdit = (investment) => {
    setEditingInvestment(investment);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingInvestment(null);
  };

  const handleAddNew = () => {
    setEditingInvestment(null);
    setShowForm(true);
  };

  const existingFundNames = [...new Set(investments.map(inv => inv.fundName))];

  // Compute portfolio metrics (this will count only active holdings)
  const portfolioMetrics = calculatePortfolioMetrics(investments);

  // Define styles inside the function to access theme
  const styles = {
    app: {
      minHeight: '100vh',
      backgroundColor: theme.background,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    },

    // Header
    header: {
      background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryMedium} 100%)`,
      padding: '24px 32px',
      boxShadow: '0 2px 8px rgba(11, 46, 51, 0.08)',
      borderBottom: `1px solid ${theme.border}`
    },
    headerContent: {
      maxWidth: '1400px',
      margin: '0 auto',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '20px'
    },
    logoSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    },
    logoIcon: {
      fontSize: '40px'
    },
    appTitle: {
      margin: 0,
      fontSize: '28px',
      fontWeight: '700',
      color: theme.primaryDeepDark,
      letterSpacing: '-0.5px'
    },
    appSubtitle: {
      margin: '4px 0 0 0',
      fontSize: '14px',
      color: theme.primaryDark,
      fontWeight: '400'
    },
    headerStats: {
      display: 'flex',
      gap: '12px',
      alignItems: 'center',
      flexWrap: 'wrap'
    },
    statBadge: {
      background: 'rgba(255, 255, 255, 0.7)',
      padding: '12px 24px',
      borderRadius: '12px',
      border: `1px solid ${theme.border}`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minWidth: '100px'
    },
    statValue: {
      fontSize: '24px',
      fontWeight: '700',
      color: theme.primaryDeepDark,
      lineHeight: '1'
    },
    statLabel: {
      fontSize: '12px',
      color: theme.primaryDark,
      marginTop: '4px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },

    // Refresh NAV Button
    refreshButton: {
      padding: '12px 20px',
      background: `linear-gradient(135deg, ${theme.primaryDark} 0%, ${theme.primaryDeepDark} 100%)`,
      color: '#FFFFFF',
      border: 'none',
      borderRadius: '10px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: `0 2px 8px ${theme.primaryDeepDark}33`,
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      whiteSpace: 'nowrap'
    },

    lastRefreshTime: {
      fontSize: '12px',
      color: theme.primaryDark,
      backgroundColor: 'rgba(255, 255, 255, 0.5)',
      padding: '6px 12px',
      borderRadius: '8px',
      border: `1px solid ${theme.border}`
    },

    // Logout Button
    logoutButton: {
      padding: '12px 20px',
      background: '#E57373',
      color: '#FFFFFF',
      border: 'none',
      borderRadius: '10px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: '0 2px 8px rgba(229, 115, 115, 0.3)',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      whiteSpace: 'nowrap'
    },

    // Loading
    loadingContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: theme.background
    },
    loader: {
      width: '50px',
      height: '50px',
      border: '4px solid #E8EDED',
      borderTop: `4px solid ${theme.primaryDark}`,
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    },
    loadingText: {
      marginTop: '16px',
      color: theme.textSecondary,
      fontSize: '16px',
      fontWeight: '500'
    },

    // Error Banner
    errorBanner: {
      background: '#FFEBEE',
      color: '#C62828',
      padding: '16px 32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      fontWeight: '500',
      borderBottom: '1px solid #EF9A9A'
    },

    // Navigation
    navContainer: {
      padding: '16px 32px 0',
      display: 'flex',
      justifyContent: 'center',
      backgroundColor: theme.background
    },
    navTabs: {
      background: '#FFFFFF',
      border: `1px solid ${theme.border}`,
      borderRadius: '12px',
      padding: '4px',
      display: 'flex',
      gap: '4px',
      boxShadow: '0 1px 3px rgba(11, 46, 51, 0.08)'
    },
    navTab: {
      padding: '12px 28px',
      background: 'transparent',
      border: 'none',
      borderRadius: '8px',
      fontSize: '15px',
      fontWeight: '600',
      color: theme.textSecondary,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      whiteSpace: 'nowrap'
    },
    navTabActive: {
      background: theme.primary,
      color: theme.primaryDeepDark,
      boxShadow: `0 2px 4px ${theme.primaryDark}22`
    },
    tabIcon: {
      fontSize: '18px'
    },

    // Content
    content: {
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '32px',
      minHeight: 'calc(100vh - 300px)'
    },

    // Controls
    controls: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
      flexWrap: 'wrap',
      gap: '16px'
    },
    addButton: {
      padding: '12px 24px',
      background: `linear-gradient(135deg, ${theme.primaryDark} 0%, ${theme.primaryDeepDark} 100%)`,
      color: '#FFFFFF',
      border: 'none',
      borderRadius: '10px',
      fontSize: '15px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: `0 2px 8px ${theme.primaryDeepDark}15`,
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    viewToggle: {
      background: '#FFFFFF',
      border: `1px solid ${theme.border}`,
      padding: '4px',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      boxShadow: '0 1px 3px rgba(11, 46, 51, 0.08)'
    },
    toggleLabel: {
      fontSize: '14px',
      fontWeight: '600',
      color: theme.textSecondary,
      marginLeft: '12px',
      marginRight: '8px'
    },
    toggleButton: {
      padding: '10px 20px',
      background: 'transparent',
      color: theme.textSecondary,
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    },
    toggleButtonActive: {
      background: theme.primary,
      color: theme.primaryDeepDark,
      boxShadow: `0 2px 4px ${theme.primaryDark}12`
    },

    // Footer
    footer: {
      background: '#FFFFFF',
      borderTop: `1px solid ${theme.border}`,
      padding: '20px 32px',
      marginTop: '48px'
    },
    footerContent: {
      maxWidth: '1400px',
      margin: '0 auto',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '16px'
    },
    footerText: {
      margin: 0,
      color: theme.textSecondary,
      fontSize: '14px'
    },
    footerBrand: {
      fontWeight: '700',
      color: theme.text
    },
    footerTag: {
      background: theme.primary,
      padding: '6px 16px',
      borderRadius: '8px',
      fontSize: '13px',
      color: theme.primaryDeepDark,
      fontWeight: '600'
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loader}></div>
        <p style={styles.loadingText}>Loading your portfolio...</p>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      {/* Header with User Info and Logout */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logoSection}>
            <div style={styles.logoIcon}>💰</div>
            <div>
              <h1 style={styles.appTitle}>Portfolio Tracker</h1>
              <p style={styles.appSubtitle}>
                Welcome, {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'}
              </p>
            </div>
          </div>
          <div style={styles.headerStats}>
            <div style={styles.statBadge}>
              <span style={styles.statValue}>{portfolioMetrics.totalHoldings}</span>
              <span style={styles.statLabel}>Holdings</span>
            </div>

            <button 
              onClick={handleRefreshNAV}
              disabled={refreshing}
              style={{
                ...styles.refreshButton,
                opacity: refreshing ? 0.6 : 1,
                cursor: refreshing ? 'not-allowed' : 'pointer'
              }}
              title="Click to manually update NAV values and store daily history"
            >
              {refreshing ? '⏳ Updating...' : '🔄 Refresh NAV'}
            </button>

            {lastRefreshTime && (
              <div style={styles.lastRefreshTime}>
                <small>Last updated: {lastRefreshTime.toLocaleTimeString()}</small>
              </div>
            )}

            <ThemeToggle />

            <button 
              onClick={handleLogout}
              style={styles.logoutButton}
              title="Logout from your account"
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div style={styles.errorBanner}>
          <span>⚠️</span>
          <span><strong>Error:</strong> {error}</span>
        </div>
      )}

      {/* Navigation Tabs - INCLUDING NAV HISTORY */}
      <div style={styles.navContainer}>
        <div style={styles.navTabs}>
          <button
            style={{...styles.navTab, ...(activeTab === 'dashboard' ? styles.navTabActive : {})}}
            onClick={() => setActiveTab('dashboard')}
          >
            <span style={styles.tabIcon}>📊</span>
            <span>Dashboard</span>
          </button>
          <button
            style={{...styles.navTab, ...(activeTab === 'investments' ? styles.navTabActive : {})}}
            onClick={() => setActiveTab('investments')}
          >
            <span style={styles.tabIcon}>📝</span>
            <span>Investments</span>
          </button>
          <button
            style={{...styles.navTab, ...(activeTab === 'analytics' ? styles.navTabActive : {})}}
            onClick={() => setActiveTab('analytics')}
          >
            <span style={styles.tabIcon}>📈</span>
            <span>Analytics</span>
          </button>
          <button
            style={{...styles.navTab, ...(activeTab === 'navHistory' ? styles.navTabActive : {})}}
            onClick={() => setActiveTab('navHistory')}
          >
            <span style={styles.tabIcon}>📋</span>
            <span>NAV History</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.content}>
        {activeTab === 'dashboard' ? (
          <Dashboard investments={investments} viewMode={viewMode} />
        ) : activeTab === 'analytics' ? (
          <Analytics investments={investments} viewMode={viewMode} />
        ) : activeTab === 'navHistory' ? (
          <NavHistory investments={investments} />
        ) : (
          <>
            {/* Controls */}
            <div style={styles.controls}>
              <button 
                style={styles.addButton}
                onClick={handleAddNew}
              >
                <span>➕</span>
                <span>Add Investment</span>
              </button>

              <div style={styles.viewToggle}>
                <span style={styles.toggleLabel}>View:</span>
                <button 
                  style={{...styles.toggleButton, ...(viewMode === 'individual' ? styles.toggleButtonActive : {})}}
                  onClick={() => setViewMode('individual')}
                >
                  Individual
                </button>
                <button 
                  style={{...styles.toggleButton, ...(viewMode === 'grouped' ? styles.toggleButtonActive : {})}}
                  onClick={() => setViewMode('grouped')}
                >
                  Grouped
                </button>
              </div>
            </div>

            {/* Investment List */}
            {viewMode === 'individual' ? (
              <InvestmentTable
                investments={investments}
                onEdit={handleEdit}
                onDelete={handleDeleteInvestment}
              />
            ) : (
              <GroupedInvestmentView
                investments={investments}
                onEdit={handleEdit}
                onDelete={handleDeleteInvestment}
              />
            )}
          </>
        )}
      </div>

      {/* Investment Form Modal */}
      {showForm && (
        <InvestmentForm
          onSubmit={editingInvestment ? handleUpdateInvestment : handleAddInvestment}
          initialData={editingInvestment}
          onCancel={handleCancelForm}
          existingFundNames={existingFundNames}
        />
      )}
    </div>
  );
}

export default App;
