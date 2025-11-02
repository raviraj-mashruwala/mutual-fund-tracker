// src/components/InvestmentTable.js - REFINED WINTER CHILL DESIGN
import React, { useState, useMemo } from 'react';
import { calculateMetrics } from '../utils/calculations';
import { formatDate } from '../utils/dateFormatter';

const InvestmentTable = ({ investments, onEdit, onDelete }) => {
  const [tagFilter, setTagFilter] = useState('');
  const [textFilter, setTextFilter] = useState('');
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(value);
  };

  const investmentsWithMetrics = useMemo(() => investments.map(calculateMetrics), [investments]);

  // Apply tag/text filters locally for the table view
  const filteredInvestments = useMemo(() => {
    return investmentsWithMetrics.filter(inv => {
      // Tag filter matches if any tag includes the filter text (case-insensitive)
      if (tagFilter) {
        const f = tagFilter.toLowerCase();
        const tags = (inv.tags || []).map(t => String(t).toLowerCase());
        if (!tags.some(t => t.includes(f))) return false;
      }

      if (textFilter) {
        const f = textFilter.toLowerCase();
        const combined = `${inv.fundName} ${inv.notes || ''} ${inv.schemeCode || ''}`.toLowerCase();
        if (!combined.includes(f)) return false;
      }

      return true;
    });
  }, [investmentsWithMetrics, tagFilter, textFilter]);

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Investment Entries</h3>
      <div style={styles.filterBar}>
        <input
          type="text"
          placeholder="Filter by tag (e.g. SIP)"
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          style={styles.filterInput}
        />
        <input
          type="text"
          placeholder="Search fund name, notes or scheme code"
          value={textFilter}
          onChange={(e) => setTextFilter(e.target.value)}
          style={styles.filterInput}
        />
      </div>
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.headerRow}>
              <th style={styles.th}>Fund Name</th>
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
              <th style={styles.th}>Tags</th>
              <th style={styles.th}>Notes</th>
              <th style={styles.th}>Decision</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvestments.length === 0 ? (
              <tr>
                <td colSpan="15" style={styles.noData}>No investments found. Add your first investment!</td>
              </tr>
            ) : (
              filteredInvestments.map((inv) => (
                <tr key={inv.id} style={styles.row}>
                  <td style={styles.td}>{inv.fundName}</td>
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
                  <td style={styles.td}>
                    {(inv.tags || []).map((t, i) => (
                      <span key={i} style={styles.tagBadge}>{t}</span>
                    ))}
                  </td>
                  <td style={{...styles.td, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis'}} title={inv.notes || ''}>{inv.notes || '-'}</td>
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
              ))
            )}
          </tbody>
        </table>
      </div>
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
  title: {
    margin: '0 0 20px 0',
    color: '#2C3E40',
    fontSize: '20px',
    fontWeight: '700'
  },
  tableWrapper: {
    overflowX: 'auto'
  },
  filterBar: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
    alignItems: 'center'
  },
  filterInput: {
    padding: '8px 10px',
    border: '1px solid #E8EDED',
    borderRadius: '8px',
    fontSize: '14px',
    minWidth: '200px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px'
  },
  headerRow: {
    background: 'linear-gradient(135deg, #B8E3E9 0%, #93B1B5 100%)',
    borderRadius: '8px'
  },
  th: {
    padding: '14px 10px',
    textAlign: 'left',
    fontWeight: '600',
    color: '#0B2E33',
    borderBottom: '2px solid #93B1B5',
    whiteSpace: 'nowrap',
    fontSize: '13px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  row: {
    borderBottom: '1px solid #E8EDED',
    transition: 'background-color 0.2s ease'
  },
  td: {
    padding: '12px 10px',
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
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  deleteButton: {
    padding: '6px 14px',
    background: '#E57373',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  }
  ,
  tagBadge: {
    display: 'inline-block',
    background: '#F1F8F7',
    color: '#2C3E40',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    marginRight: '6px',
    marginBottom: '4px'
  }
};

export default InvestmentTable;
