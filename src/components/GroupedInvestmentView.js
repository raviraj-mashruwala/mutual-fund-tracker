// src/components/GroupedInvestmentView.js - REFINED WINTER CHILL DESIGN
import React, { useState } from 'react';
import { calculateMetrics, calculateFundMetrics } from '../utils/calculations';
import { formatDate } from '../utils/dateFormatter';

const GroupedInvestmentView = ({ investments, onEdit, onDelete }) => {
  const [expandedFunds, setExpandedFunds] = useState({});
  const fundMetrics = calculateFundMetrics(investments);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(value);
  };

  const toggleFund = (fundName) => {
    setExpandedFunds(prev => ({
      ...prev,
      [fundName]: !prev[fundName]
    }));
  };

  const expandAll = () => {
    const allExpanded = {};
    fundMetrics.forEach(fund => {
      allExpanded[fund.fundName] = true;
    });
    setExpandedFunds(allExpanded);
  };

  const collapseAll = () => {
    setExpandedFunds({});
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Investment Entries (Grouped by Fund)</h3>
        <div style={styles.controls}>
          <button onClick={expandAll} style={styles.controlButton}>Expand All</button>
          <button onClick={collapseAll} style={styles.controlButton}>Collapse All</button>
        </div>
      </div>

      {fundMetrics.length === 0 ? (
        <div style={styles.noData}>No investments found. Add your first investment!</div>
      ) : (
        fundMetrics.map((fund, idx) => (
          <div key={fund.fundName} style={styles.fundSection}>
            <div 
              style={{
                ...styles.fundHeader,
                borderLeft: `4px solid ${['#B8E3E9', '#93B1B5', '#4F7C82', '#6BC4A6', '#64B5F6'][idx % 5]}`
              }}
              onClick={() => toggleFund(fund.fundName)}
            >
              <div style={styles.fundHeaderLeft}>
                <span style={styles.expandIcon}>{expandedFunds[fund.fundName] ? '▼' : '▶'}</span>
                <span style={styles.fundName}>{fund.fundName}</span>
              </div>
              <div style={styles.fundSummary}>
                <div style={styles.summaryItem}>
                  <span style={styles.summaryLabel}>Investment:</span>
                  <span style={styles.summaryValue}>{formatCurrency(fund.totalInvestment)}</span>
                </div>
                <div style={styles.summaryItem}>
                  <span style={styles.summaryLabel}>Current:</span>
                  <span style={styles.summaryValue}>{formatCurrency(fund.currentValue)}</span>
                </div>
                <div style={styles.summaryItem}>
                  <span style={styles.summaryLabel}>P&L:</span>
                  <span style={{
                    ...styles.summaryValue,
                    color: fund.totalProfitLoss >= 0 ? '#6BC4A6' : '#E57373',
                    fontWeight: '700'
                  }}>
                    {formatCurrency(fund.totalProfitLoss)} ({fund.totalReturnPercent.toFixed(2)}%)
                  </span>
                </div>
                <div style={styles.summaryItem}>
                  <span style={styles.summaryLabel}>Holdings:</span>
                  <span style={styles.summaryValue}>{fund.holdingsCount}</span>
                </div>
                <div style={styles.summaryItem}>
                  <span style={styles.summaryLabel}>LTCG:</span>
                  <span style={styles.summaryValue}>{fund.ltcgEligibleCount}</span>
                </div>
              </div>
            </div>

            {expandedFunds[fund.fundName] && (
              <div style={styles.fundContent}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.headerRow}>
                      <th style={styles.th}>Buy Date</th>
                      <th style={styles.th}>Buy NAV</th>
                      <th style={styles.th}>Quantity</th>
                      <th style={styles.th}>Buy Amount</th>
                      <th style={styles.th}>Current NAV</th>
                      <th style={styles.th}>Days</th>
                      <th style={styles.th}>LTCG</th>
                      <th style={styles.th}>P&L</th>
                      <th style={styles.th}>P&L %</th>
                      <th style={styles.th}>CAGR</th>
                      <th style={styles.th}>Decision</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fund.investments.map((inv) => (
                      <tr key={inv.id} style={styles.row}>
                        <td style={styles.td}>{formatDate(inv.buyDate)}</td>
                        <td style={styles.td}>{formatCurrency(inv.buyNAV)}</td>
                        <td style={styles.td}>{inv.quantity}</td>
                        <td style={styles.td}>{formatCurrency(inv.buyTotalAmount)}</td>
                        <td style={styles.td}>{formatCurrency(inv.currentNAV)}</td>
                        <td style={styles.td}>{inv.holdingPeriodDays}</td>
                        <td style={{
                          ...styles.td,
                          color: inv.eligibleForLTCG === 'Yes' ? '#6BC4A6' : '#FFB74D',
                          fontWeight: '600'
                        }}>
                          {inv.eligibleForLTCG}
                        </td>
                        <td style={{
                          ...styles.td,
                          color: inv.netProfitLoss >= 0 ? '#6BC4A6' : '#E57373',
                          fontWeight: '700'
                        }}>
                          {formatCurrency(inv.netProfitLoss)}
                        </td>
                        <td style={{
                          ...styles.td,
                          color: inv.netProfitLossPercent >= 0 ? '#6BC4A6' : '#E57373',
                          fontWeight: '700'
                        }}>
                          {inv.netProfitLossPercent.toFixed(2)}%
                        </td>
                        <td style={styles.td}>{inv.cagr.toFixed(2)}%</td>
                        <td style={{
                          ...styles.td,
                          color: inv.decisionToSell === 'You can Sell' ? '#6BC4A6' : 
                                 inv.decisionToSell === 'Already Sold' ? '#5A6D70' : '#FFB74D',
                          fontWeight: '600'
                        }}>
                          {inv.decisionToSell}
                        </td>
                        <td style={styles.td}>
                          <button onClick={() => onEdit(inv)} style={styles.editButton}>Edit</button>
                          <button onClick={() => onDelete(inv.id)} style={styles.deleteButton}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

const styles = {
  container: {
    background: '#FFFFFF',
    border: '1px solid #E8EDED',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(11, 46, 51, 0.08)',
    marginBottom: '24px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '12px'
  },
  title: {
    margin: 0,
    color: '#2C3E40',
    fontSize: '20px',
    fontWeight: '700'
  },
  controls: {
    display: 'flex',
    gap: '8px'
  },
  controlButton: {
    padding: '8px 16px',
    background: '#4F7C82',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  fundSection: {
    marginBottom: '16px',
    border: '1px solid #E8EDED',
    borderRadius: '10px',
    overflow: 'hidden',
    background: '#FFFFFF'
  },
  fundHeader: {
    padding: '16px 20px',
    background: '#F8FAFB',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
    transition: 'background-color 0.2s ease'
  },
  fundHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  expandIcon: {
    fontSize: '12px',
    color: '#4F7C82',
    fontWeight: 'bold'
  },
  fundName: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#2C3E40'
  },
  fundSummary: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap'
  },
  summaryItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  summaryLabel: {
    fontSize: '11px',
    color: '#5A6D70',
    textTransform: 'uppercase',
    fontWeight: '500',
    letterSpacing: '0.5px'
  },
  summaryValue: {
    fontSize: '14px',
    color: '#2C3E40',
    fontWeight: '600'
  },
  fundContent: {
    padding: '16px 20px',
    background: '#FFFFFF',
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
    padding: '12px 8px',
    textAlign: 'left',
    fontWeight: '600',
    color: '#2C3E40',
    borderBottom: '2px solid #E8EDED',
    whiteSpace: 'nowrap',
    fontSize: '13px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  row: {
    borderBottom: '1px solid #E8EDED'
  },
  td: {
    padding: '12px 8px',
    color: '#2C3E40',
    whiteSpace: 'nowrap',
    fontSize: '14px'
  },
  noData: {
    padding: '40px',
    textAlign: 'center',
    color: '#5A6D70',
    fontStyle: 'italic',
    fontSize: '15px'
  },
  editButton: {
    padding: '6px 14px',
    marginRight: '6px',
    background: '#4F7C82',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  deleteButton: {
    padding: '6px 14px',
    background: '#E57373',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer'
  }
};

export default GroupedInvestmentView;
