// src/components/NavHistory.js
import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { getPortfolioNavHistory } from '../utils/navHistoryService';
import { formatDate } from '../utils/dateFormatter';

const NavHistory = ({ investments }) => {
  const { theme } = useTheme();
  const [navChanges, setNavChanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30'); // Days
  const [pivotData, setPivotData] = useState({});
  const [viewMode, setViewMode] = useState('pivot'); // 'pivot' or 'list'

  useEffect(() => {
    loadNavHistory();
  }, [investments, selectedPeriod]);

  const loadNavHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - (parseInt(selectedPeriod) * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];

      const changes = await getPortfolioNavHistory(investments, startDate, endDate);
      setNavChanges(changes);

      // Create pivot table structure
      const pivot = createPivotTable(changes);
      setPivotData(pivot);
    } catch (err) {
      setError('Failed to load NAV history');
      console.error('NAV History error:', err);
    } finally {
      setLoading(false);
    }
  };

  const createPivotTable = (changes) => {
    const pivot = {
      funds: [...new Set(changes.map(c => c.schemeName))].sort(),
      dates: [...new Set(changes.map(c => c.date))].sort((a, b) => new Date(b) - new Date(a)),
      years: [...new Set(changes.map(c => c.year))].sort((a, b) => b - a),
      yearMonths: [...new Set(changes.map(c => c.yearMonth))].sort((a, b) => b.localeCompare(a)),
      data: {}
    };

    // Create nested structure: year -> month -> date -> fund -> change%
    changes.forEach(change => {
      const { year, yearMonth, date, schemeName, changePercent } = change;

      if (!pivot.data[year]) pivot.data[year] = {};
      if (!pivot.data[year][yearMonth]) pivot.data[year][yearMonth] = {};
      if (!pivot.data[year][yearMonth][date]) pivot.data[year][yearMonth][date] = {};

      pivot.data[year][yearMonth][date][schemeName] = changePercent;
    });

    return pivot;
  };

  const getChangeColor = (changePercent) => {
    if (changePercent > 0) return '#4CAF50'; // Green for positive
    if (changePercent < 0) return '#F44336'; // Red for negative
    return '#757575'; // Gray for zero
  };

  const styles = {
    container: {
      padding: '24px',
      backgroundColor: theme.background,
      minHeight: '100vh'
    },
    header: {
      marginBottom: '24px'
    },
    title: {
      fontSize: '24px',
      fontWeight: '700',
      color: theme.primaryDeepDark,
      marginBottom: '8px'
    },
    subtitle: {
      fontSize: '14px',
      color: theme.textSecondary,
      marginBottom: '16px'
    },
    controls: {
      display: 'flex',
      gap: '16px',
      marginBottom: '24px',
      flexWrap: 'wrap'
    },
    select: {
      padding: '8px 12px',
      border: `1px solid ${theme.border}`,
      borderRadius: '6px',
      background: theme.cardBg,
      color: theme.text,
      fontSize: '14px'
    },
    toggleButton: {
      padding: '8px 16px',
      border: `1px solid ${theme.primaryDark}`,
      borderRadius: '6px',
      background: 'transparent',
      color: theme.primaryDark,
      cursor: 'pointer',
      fontSize: '14px'
    },
    toggleButtonActive: {
      background: theme.primaryDark,
      color: '#FFFFFF'
    },
    pivotTable: {
      background: theme.cardBg,
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      overflow: 'auto'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '12px'
    },
    th: {
      padding: '12px 8px',
      background: theme.primary,
      color: theme.primaryDeepDark,
      fontWeight: '600',
      textAlign: 'center',
      border: `1px solid ${theme.border}`,
      position: 'sticky',
      top: 0,
      zIndex: 10
    },
    td: {
      padding: '8px',
      textAlign: 'center',
      border: `1px solid ${theme.border}`,
      fontSize: '11px'
    },
    yearRow: {
      background: theme.primary,
      fontWeight: '700',
      color: theme.primaryDeepDark
    },
    monthRow: {
      background: `${theme.primary}80`,
      fontWeight: '600',
      color: theme.primaryDark
    },
    dateRow: {
      background: theme.cardBg
    },
    changeCell: {
      fontWeight: '600',
      borderRadius: '4px',
      padding: '4px'
    },
    loading: {
      textAlign: 'center',
      padding: '48px',
      color: theme.textSecondary
    },
    error: {
      textAlign: 'center',
      padding: '48px',
      color: '#F44336',
      background: '#FFEBEE',
      borderRadius: '8px'
    },
    listView: {
      background: theme.cardBg,
      borderRadius: '12px',
      padding: '24px'
    },
    listItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 16px',
      borderBottom: `1px solid ${theme.border}`,
      fontSize: '14px'
    },
    fundName: {
      fontWeight: '600',
      color: theme.text,
      flex: 2
    },
    date: {
      color: theme.textSecondary,
      flex: 1
    },
    navValue: {
      color: theme.text,
      flex: 1,
      textAlign: 'right'
    },
    change: {
      fontWeight: '700',
      flex: 1,
      textAlign: 'right'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>📊 Loading NAV history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>⚠️ {error}</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>📈 NAV History & Analysis</h1>
        <p style={styles.subtitle}>Daily NAV changes across your portfolio funds</p>
      </div>

      <div style={styles.controls}>
        <select 
          value={selectedPeriod} 
          onChange={(e) => setSelectedPeriod(e.target.value)}
          style={styles.select}
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 3 months</option>
          <option value="180">Last 6 months</option>
          <option value="365">Last 1 year</option>
        </select>

        <button
          onClick={() => setViewMode('pivot')}
          style={{
            ...styles.toggleButton,
            ...(viewMode === 'pivot' ? styles.toggleButtonActive : {})
          }}
        >
          📊 Pivot View
        </button>

        <button
          onClick={() => setViewMode('list')}
          style={{
            ...styles.toggleButton,
            ...(viewMode === 'list' ? styles.toggleButtonActive : {})
          }}
        >
          📋 List View
        </button>

        <button
          onClick={loadNavHistory}
          style={styles.toggleButton}
        >
          🔄 Refresh
        </button>
      </div>

      {viewMode === 'pivot' ? (
        <div style={styles.pivotTable}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{...styles.th, width: '120px'}}>Period</th>
                {pivotData.funds?.map(fund => (
                  <th
                    key={fund}
                    style={{
                      ...styles.th,
                      minWidth: '120px',
                      maxWidth: '240px',
                      whiteSpace: 'normal',
                      wordBreak: 'break-word',
                      lineHeight: '1.2',
                      verticalAlign: 'middle'
                    }}
                  >
                    <div style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                      {fund}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.keys(pivotData.data || {}).map(year => (
                <React.Fragment key={year}>
                  <tr style={styles.yearRow}>
                    <td style={{...styles.td, ...styles.yearRow, fontWeight: '700'}}>
                      📅 {year}
                    </td>
                    {pivotData.funds?.map(fund => (
                      <td key={fund} style={{...styles.td, ...styles.yearRow}}>
                        {/* Year average could go here */}
                      </td>
                    ))}
                  </tr>

                  {Object.keys(pivotData.data[year] || {}).map(yearMonth => (
                    <React.Fragment key={yearMonth}>
                      <tr style={styles.monthRow}>
                        <td style={{...styles.td, ...styles.monthRow, paddingLeft: '16px'}}>
                          📆 {yearMonth}
                        </td>
                        {pivotData.funds?.map(fund => (
                          <td key={fund} style={{...styles.td, ...styles.monthRow}}>
                            {/* Month average could go here */}
                          </td>
                        ))}
                      </tr>

                      {Object.keys(pivotData.data[year][yearMonth] || {}).map(date => (
                        <tr key={date} style={styles.dateRow}>
                          <td style={{...styles.td, paddingLeft: '32px', fontSize: '11px'}}>
                            {formatDate(date)}
                          </td>
                          {pivotData.funds?.map(fund => {
                            const change = pivotData.data[year][yearMonth][date][fund];
                            return (
                              <td 
                                key={fund} 
                                style={{
                                  ...styles.td,
                                  ...styles.changeCell,
                                  color: change ? getChangeColor(change) : theme.textSecondary,
                                  background: change ? `${getChangeColor(change)}10` : 'transparent'
                                }}
                              >
                                {change ? `${change > 0 ? '+' : ''}${change}%` : '-'}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>

          {navChanges.length === 0 && (
            <div style={styles.loading}>
              📈 No NAV history available. Add some investments and check back tomorrow!
            </div>
          )}
        </div>
      ) : (
        <div style={styles.listView}>
          {navChanges.slice(0, 50).map((change, index) => (
            <div key={index} style={styles.listItem}>
              <div style={styles.fundName}>
                {change.schemeName.substring(0, 30)}...
              </div>
              <div style={styles.date}>
                {formatDate(change.date)}
              </div>
              <div style={styles.navValue}>
                ₹{change.currentNav}
              </div>
              <div style={{
                ...styles.change,
                color: getChangeColor(change.changePercent)
              }}>
                {change.changePercent > 0 ? '+' : ''}{change.changePercent}%
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NavHistory;
