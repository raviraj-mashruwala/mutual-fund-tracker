// src/components/Dashboard.js - REFINED WINTER CHILL DESIGN
import React from 'react';
import { calculatePortfolioMetrics, calculateFundMetrics } from '../utils/calculations';

const Dashboard = ({ investments, viewMode }) => {
  const portfolioMetrics = calculatePortfolioMetrics(investments);
  const fundMetrics = calculateFundMetrics(investments);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const topFunds = [...fundMetrics].sort((a, b) => b.totalReturnPercent - a.totalReturnPercent).slice(0, 3);

  return (
    <div style={styles.dashboard}>
      {/* Welcome Section */}
      <div style={styles.welcomeSection}>
        <h2 style={styles.title}>Portfolio Overview</h2>
        <p style={styles.subtitle}>Your investment summary at a glance</p>
      </div>

      {/* Portfolio Summary Cards */}
      <div style={styles.cardGrid}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={styles.cardIcon}>💰</div>
            <div style={styles.cardLabel}>Total Investment</div>
          </div>
          <div style={styles.cardValue}>{formatCurrency(portfolioMetrics.totalInvestment)}</div>
          <div style={styles.cardFooter}>
            <span style={styles.cardTag}>Principal Amount</span>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={styles.cardIcon}>📈</div>
            <div style={styles.cardLabel}>Current Value</div>
          </div>
          <div style={styles.cardValue}>{formatCurrency(portfolioMetrics.currentValue)}</div>
          <div style={styles.cardFooter}>
            <span style={styles.cardTag}>Portfolio Worth</span>
          </div>
        </div>

        <div style={{
          ...styles.card,
          borderTop: `3px solid ${portfolioMetrics.totalProfitLoss >= 0 ? '#6BC4A6' : '#E57373'}`
        }}>
          <div style={styles.cardHeader}>
            <div style={styles.cardIcon}>{portfolioMetrics.totalProfitLoss >= 0 ? '🚀' : '📉'}</div>
            <div style={styles.cardLabel}>Total P&L</div>
          </div>
          <div style={{
            ...styles.cardValue,
            color: portfolioMetrics.totalProfitLoss >= 0 ? '#6BC4A6' : '#E57373'
          }}>
            {formatCurrency(portfolioMetrics.totalProfitLoss)}
          </div>
          <div style={styles.cardFooter}>
            <span style={{
              ...styles.cardTag,
              background: portfolioMetrics.totalProfitLoss >= 0 ? '#E8F5F1' : '#FFEBEE',
              color: portfolioMetrics.totalProfitLoss >= 0 ? '#6BC4A6' : '#E57373'
            }}>
              {formatPercent(portfolioMetrics.totalReturnPercent)}
            </span>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={styles.cardIcon}>📊</div>
            <div style={styles.cardLabel}>Total Holdings</div>
          </div>
          <div style={styles.cardValue}>{portfolioMetrics.totalHoldings}</div>
          <div style={styles.cardFooter}>
            <span style={styles.cardTag}>{portfolioMetrics.ltcgEligibleCount} LTCG Eligible</span>
          </div>
        </div>
      </div>

      {/* Fund Performance Cards */}
      {fundMetrics.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Top Performing Funds</h3>
          <div style={styles.fundGrid}>
            {topFunds.map((fund, idx) => (
              <div key={idx} style={styles.fundCard}>
                <div style={styles.fundHeader}>
                  <div style={styles.fundRank}>#{idx + 1}</div>
                  <div style={styles.fundName}>{fund.fundName}</div>
                </div>
                <div style={styles.fundMetrics}>
                  <div style={styles.fundMetricRow}>
                    <span style={styles.metricLabel}>Return</span>
                    <span style={{
                      ...styles.metricValue,
                      color: fund.totalReturnPercent >= 0 ? '#6BC4A6' : '#E57373',
                      fontWeight: '700'
                    }}>
                      {formatPercent(fund.totalReturnPercent)}
                    </span>
                  </div>
                  <div style={styles.fundMetricRow}>
                    <span style={styles.metricLabel}>Investment</span>
                    <span style={styles.metricValue}>{formatCurrency(fund.totalInvestment)}</span>
                  </div>
                  <div style={styles.fundMetricRow}>
                    <span style={styles.metricLabel}>CAGR</span>
                    <span style={styles.metricValue}>{fund.avgCAGR.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fund Allocation */}
      {fundMetrics.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Fund Allocation</h3>
          <div style={styles.allocationContainer}>
            {fundMetrics.map((fund, idx) => {
              const percentage = (fund.totalInvestment / portfolioMetrics.totalInvestment) * 100;
              const colors = ['#B8E3E9', '#93B1B5', '#4F7C82', '#6BC4A6', '#64B5F6'];
              return (
                <div key={idx} style={styles.allocationRow}>
                  <div style={styles.allocationLabel}>
                    <div style={{
                      ...styles.allocationDot,
                      background: colors[idx % colors.length]
                    }}></div>
                    {fund.fundName}
                  </div>
                  <div style={styles.allocationBarContainer}>
                    <div 
                      style={{
                        ...styles.allocationBar,
                        width: `${percentage}%`,
                        background: colors[idx % colors.length]
                      }}
                    >
                      <span style={styles.allocationBarLabel}>{percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div style={styles.allocationAmount}>{formatCurrency(fund.totalInvestment)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  dashboard: {
    animation: 'fadeIn 0.3s ease-out'
  },
  welcomeSection: {
    marginBottom: '24px'
  },
  title: {
    margin: 0,
    fontSize: '28px',
    fontWeight: '700',
    color: '#2C3E40',
    marginBottom: '4px'
  },
  subtitle: {
    margin: 0,
    fontSize: '15px',
    color: '#5A6D70',
    fontWeight: '400'
  },

  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px',
    marginBottom: '32px'
  },
  card: {
    background: '#FFFFFF',
    border: '1px solid #E8EDED',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(11, 46, 51, 0.08)',
    transition: 'all 0.2s ease'
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px'
  },
  cardIcon: {
    fontSize: '28px'
  },
  cardLabel: {
    fontSize: '13px',
    color: '#5A6D70',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  cardValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#2C3E40',
    marginBottom: '10px',
    lineHeight: '1.2'
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'flex-start'
  },
  cardTag: {
    padding: '4px 12px',
    background: '#F8FAFB',
    borderRadius: '8px',
    fontSize: '12px',
    color: '#5A6D70',
    fontWeight: '500'
  },

  section: {
    background: '#FFFFFF',
    border: '1px solid #E8EDED',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 1px 3px rgba(11, 46, 51, 0.08)'
  },
  sectionTitle: {
    margin: '0 0 20px 0',
    fontSize: '20px',
    fontWeight: '700',
    color: '#2C3E40'
  },

  fundGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '16px'
  },
  fundCard: {
    background: '#F8FAFB',
    border: '1px solid #E8EDED',
    borderRadius: '10px',
    padding: '16px',
    transition: 'all 0.2s ease'
  },
  fundHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
    paddingBottom: '12px',
    borderBottom: '1px solid #E8EDED'
  },
  fundRank: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #4F7C82 0%, #0B2E33 100%)',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '700'
  },
  fundName: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#2C3E40',
    flex: 1
  },
  fundMetrics: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  fundMetricRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  metricLabel: {
    fontSize: '13px',
    color: '#5A6D70',
    fontWeight: '500'
  },
  metricValue: {
    fontSize: '15px',
    color: '#2C3E40',
    fontWeight: '600'
  },

  allocationContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
  },
  allocationRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  allocationLabel: {
    minWidth: '200px',
    fontSize: '14px',
    color: '#2C3E40',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  allocationDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%'
  },
  allocationBarContainer: {
    flex: 1,
    height: '32px',
    background: '#F8FAFB',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid #E8EDED'
  },
  allocationBar: {
    height: '100%',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: '0 10px',
    transition: 'width 0.4s ease'
  },
  allocationBarLabel: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#FFFFFF',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
  },
  allocationAmount: {
    minWidth: '110px',
    textAlign: 'right',
    fontSize: '14px',
    fontWeight: '600',
    color: '#2C3E40'
  }
};

export default Dashboard;
