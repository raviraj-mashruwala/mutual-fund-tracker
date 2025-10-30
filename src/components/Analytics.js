// src/components/Analytics.js - REFINED WINTER CHILL DESIGN
import React from 'react';
import { calculateMetrics, calculateFundMetrics, calculatePortfolioMetrics } from '../utils/calculations';

const Analytics = ({ investments, viewMode }) => {
  const portfolioMetrics = calculatePortfolioMetrics(investments);
  const fundMetrics = calculateFundMetrics(investments);
  const investmentsWithMetrics = investments.map(calculateMetrics);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatPercent = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const sortedByReturn = [...investmentsWithMetrics].sort((a, b) => b.netProfitLossPercent - a.netProfitLossPercent);
  const topPerformers = sortedByReturn.slice(0, 5);
  const worstPerformers = sortedByReturn.slice(-5).reverse();

  const ltcgOpportunities = investmentsWithMetrics.filter(inv => 
    !inv.sellDate && inv.eligibleForLTCG === 'Yes' && inv.netProfitLossPercent > 10
  );

  const sortedFunds = [...fundMetrics].sort((a, b) => b.totalReturnPercent - a.totalReturnPercent);
  // Only include funds that have active holdings (holdingsCount > 0)
  const sortedActiveFunds = sortedFunds.filter((f) => f.holdingsCount > 0);

  return (
    <div style={styles.analytics}>
      <h2 style={styles.title}>Portfolio Analytics</h2>

      {/* Portfolio Summary */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Portfolio Overview</h3>
        <div style={styles.cardGrid}>
          <div style={styles.metricCard}>
            <div style={styles.metricLabel}>Total Investment</div>
            <div style={styles.metricValue}>{formatCurrency(portfolioMetrics.totalInvestment)}</div>
          </div>
          <div style={styles.metricCard}>
            <div style={styles.metricLabel}>Current Value</div>
            <div style={styles.metricValue}>{formatCurrency(portfolioMetrics.currentValue)}</div>
          </div>
          <div style={{
            ...styles.metricCard,
            borderTop: `3px solid ${portfolioMetrics.totalProfitLoss >= 0 ? '#6BC4A6' : '#E57373'}`
          }}>
            <div style={styles.metricLabel}>Total P&L</div>
            <div style={{
              ...styles.metricValue,
              color: portfolioMetrics.totalProfitLoss >= 0 ? '#6BC4A6' : '#E57373'
            }}>
              {formatCurrency(portfolioMetrics.totalProfitLoss)}
            </div>
            <div style={styles.metricSubtext}>
              {formatPercent(portfolioMetrics.totalReturnPercent)}
            </div>
          </div>
          <div style={styles.metricCard}>
            <div style={styles.metricLabel}>LTCG Eligible</div>
            <div style={styles.metricValue}>{portfolioMetrics.ltcgEligibleCount}</div>
            <div style={styles.metricSubtext}>
              out of {portfolioMetrics.totalHoldings} holdings
            </div>
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Top 5 Performers</h3>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.headerRow}>
                <th style={styles.th}>Fund Name</th>
                <th style={styles.th}>Buy Date</th>
                <th style={styles.th}>Investment</th>
                <th style={styles.th}>Current Value</th>
                <th style={styles.th}>P&L</th>
                <th style={styles.th}>Return %</th>
                <th style={styles.th}>CAGR</th>
              </tr>
            </thead>
            <tbody>
              {topPerformers.map((inv, idx) => (
                <tr key={inv.id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={styles.rankBadge}>{idx + 1}</div>
                    {inv.fundName}
                  </td>
                  <td style={styles.td}>{inv.buyDate}</td>
                  <td style={styles.td}>{formatCurrency(inv.buyTotalAmount)}</td>
                  <td style={styles.td}>{formatCurrency(inv.finalValue)}</td>
                  <td style={{...styles.td, color: '#6BC4A6', fontWeight: '700'}}>
                    {formatCurrency(inv.netProfitLoss)}
                  </td>
                  <td style={{...styles.td, color: '#6BC4A6', fontWeight: '700'}}>
                    {formatPercent(inv.netProfitLossPercent)}
                  </td>
                  <td style={styles.td}>{inv.cagr.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* LTCG Opportunities */}
      {ltcgOpportunities.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>LTCG Sale Opportunities</h3>
          <p style={styles.description}>
            These investments are LTCG eligible and showing good returns. Consider selling for tax-efficient gains.
          </p>
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.headerRow}>
                  <th style={styles.th}>Fund Name</th>
                  <th style={styles.th}>Buy Date</th>
                  <th style={styles.th}>Days Held</th>
                  <th style={styles.th}>Investment</th>
                  <th style={styles.th}>Current Value</th>
                  <th style={styles.th}>Profit</th>
                  <th style={styles.th}>Return %</th>
                  <th style={styles.th}>Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {ltcgOpportunities.map((inv) => (
                  <tr key={inv.id} style={styles.tr}>
                    <td style={styles.td}>{inv.fundName}</td>
                    <td style={styles.td}>{inv.buyDate}</td>
                    <td style={styles.td}>{inv.holdingPeriodDays} days</td>
                    <td style={styles.td}>{formatCurrency(inv.buyTotalAmount)}</td>
                    <td style={styles.td}>{formatCurrency(inv.finalValue)}</td>
                    <td style={{...styles.td, color: '#6BC4A6', fontWeight: '700'}}>
                      {formatCurrency(inv.netProfitLoss)}
                    </td>
                    <td style={{...styles.td, color: '#6BC4A6', fontWeight: '700'}}>
                      {formatPercent(inv.netProfitLossPercent)}
                    </td>
                    <td style={{...styles.td, color: '#6BC4A6', fontWeight: '700'}}>
                      {inv.decisionToSell}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Fund-wise Performance */}
      {sortedActiveFunds.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Fund-wise Performance Summary</h3>
          <div style={styles.fundCardsGrid}>
            {sortedActiveFunds.map((fund, idx) => (
              <div key={fund.fundName} style={styles.fundCard}>
                <div style={styles.fundCardHeader}>
                  <div style={styles.fundRank}>#{idx + 1}</div>
                  <div style={styles.fundCardTitle}>{fund.fundName}</div>
                </div>
                <div style={styles.fundCardBody}>
                  <div style={styles.fundMetricRow}>
                    <span>Investment:</span>
                    <span style={styles.fundMetricValue}>{formatCurrency(fund.totalInvestment)}</span>
                  </div>
                  <div style={styles.fundMetricRow}>
                    <span>Current Value:</span>
                    <span style={styles.fundMetricValue}>{formatCurrency(fund.currentValue)}</span>
                  </div>
                  <div style={styles.fundMetricRow}>
                    <span>Total P&L:</span>
                    <span style={{
                      ...styles.fundMetricValue,
                      color: fund.totalProfitLoss >= 0 ? '#6BC4A6' : '#E57373',
                      fontWeight: '700'
                    }}>
                      {formatCurrency(fund.totalProfitLoss)}
                    </span>
                  </div>
                  <div style={styles.fundMetricRow}>
                    <span>Return:</span>
                    <span style={{
                      ...styles.fundMetricValue,
                      color: fund.totalReturnPercent >= 0 ? '#6BC4A6' : '#E57373',
                      fontWeight: '700'
                    }}>
                      {formatPercent(fund.totalReturnPercent)}
                    </span>
                  </div>
                  <div style={styles.fundMetricRow}>
                    <span>Avg CAGR:</span>
                    <span style={styles.fundMetricValue}>{fund.avgCAGR.toFixed(2)}%</span>
                  </div>
                  <div style={styles.fundMetricRow}>
                    <span>Holdings:</span>
                    <span style={styles.fundMetricValue}>{fund.holdingsCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  analytics: {
    padding: '0'
  },
  title: {
    margin: '0 0 24px 0',
    color: '#2C3E40',
    fontSize: '28px',
    fontWeight: '700'
  },
  section: {
    background: '#FFFFFF',
    border: '1px solid #E8EDED',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(11, 46, 51, 0.08)',
    marginBottom: '24px'
  },
  sectionTitle: {
    marginTop: 0,
    marginBottom: '16px',
    color: '#2C3E40',
    fontSize: '20px',
    fontWeight: '700'
  },
  description: {
    color: '#5A6D70',
    fontSize: '14px',
    marginBottom: '16px',
    fontStyle: 'italic'
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px'
  },
  metricCard: {
    padding: '16px',
    background: '#F8FAFB',
    borderRadius: '10px',
    border: '1px solid #E8EDED'
  },
  metricLabel: {
    fontSize: '13px',
    color: '#5A6D70',
    marginBottom: '8px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  metricValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#2C3E40',
    marginBottom: '4px'
  },
  metricSubtext: {
    fontSize: '13px',
    color: '#5A6D70'
  },
  tableContainer: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px'
  },
  headerRow: {
    background: '#F8FAFB'
  },
  th: {
    padding: '12px 10px',
    textAlign: 'left',
    fontWeight: '600',
    color: '#2C3E40',
    borderBottom: '2px solid #E8EDED',
    whiteSpace: 'nowrap',
    fontSize: '13px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  tr: {
    borderBottom: '1px solid #E8EDED'
  },
  td: {
    padding: '12px 10px',
    color: '#2C3E40',
    whiteSpace: 'nowrap',
    fontSize: '14px'
  },
  rankBadge: {
    display: 'inline-block',
    background: '#4F7C82',
    color: '#FFFFFF',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: '700',
    marginRight: '8px'
  },
  fundCardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '16px'
  },
  fundCard: {
    border: '1px solid #E8EDED',
    borderRadius: '10px',
    overflow: 'hidden',
    background: '#F8FAFB'
  },
  fundCardHeader: {
    background: 'linear-gradient(135deg, #B8E3E9 0%, #93B1B5 100%)',
    padding: '12px 16px',
    borderBottom: '1px solid #E8EDED',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  fundRank: {
    background: '#4F7C82',
    color: '#FFFFFF',
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '700'
  },
  fundCardTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#0B2E33'
  },
  fundCardBody: {
    padding: '16px'
  },
  fundMetricRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px',
    fontSize: '14px',
    color: '#5A6D70'
  },
  fundMetricValue: {
    fontWeight: '600',
    color: '#2C3E40'
  }
};

export default Analytics;
