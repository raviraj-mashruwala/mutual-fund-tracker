// src/components/Analytics.js - REFINED WINTER CHILL DESIGN
import React, { useMemo, useState, useEffect } from 'react';
import { calculateMetrics, calculateFundMetrics, calculatePortfolioMetrics } from '../utils/calculations';
import { formatDate } from '../utils/dateFormatter';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line
} from 'recharts';

const Analytics = ({ investments, viewMode }) => {
  // Memoize derived metrics so they only change when `investments` changes.
  const portfolioMetrics = useMemo(() => calculatePortfolioMetrics(investments), [investments]);
  const fundMetrics = useMemo(() => calculateFundMetrics(investments), [investments]);
  const investmentsWithMetrics = useMemo(() => investments.map(calculateMetrics), [investments]);

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

  const ltcgOpportunities = investmentsWithMetrics.filter(inv => 
    !inv.sellDate && inv.eligibleForLTCG === 'Yes' && inv.netProfitLossPercent > 10
  );

  const sortedFunds = useMemo(() => [...fundMetrics].sort((a, b) => b.totalReturnPercent - a.totalReturnPercent), [fundMetrics]);
  // Only include funds that have active holdings (holdingsCount > 0)
  const sortedActiveFunds = useMemo(() => sortedFunds.filter((f) => f.holdingsCount > 0), [sortedFunds]);

  const timeseriesData = useMemo(() => {
    // Build timeseries by grouping by buyDate and accumulating invested/current values
    const byDate = {};
    investmentsWithMetrics.forEach(inv => {
      const date = formatDate(inv.buyDate); // human formatted
      if (!byDate[date]) byDate[date] = { date, invested: 0, current: 0 };
      byDate[date].invested += Number(inv.buyTotalAmount || 0);
      // approximate current value using finalValue or currentNAV*quantity
      const currentVal = Number(inv.finalValue || (inv.currentNAV * inv.quantity) || 0);
      byDate[date].current += currentVal;
    });

    const sorted = Object.values(byDate).sort((a, b) => new Date(a.date) - new Date(b.date));
    // cumulative sums
    let cumInvested = 0;
    let cumCurrent = 0;
    return sorted.map(row => {
      cumInvested += row.invested;
      cumCurrent += row.current;
      return { date: row.date, invested: cumInvested, current: cumCurrent };
    });
  }, [investmentsWithMetrics]);

  // Legend state for responsive/show-more behavior
  const [legendExpanded, setLegendExpanded] = useState(false);
  const legendLimit = 6;
  const legendItems = sortedActiveFunds;
  const showLegendToggle = legendItems.length > legendLimit;
  const visibleLegendItems = legendExpanded ? legendItems : legendItems.slice(0, legendLimit);

  // Visibility state for interactive legend: which funds are visible/highlighted
  const [visibleFundNames, setVisibleFundNames] = useState(() => new Set());

  useEffect(() => {
    // On fund list change, rehydrate from localStorage if present, otherwise default to all funds.
    const allNames = sortedActiveFunds.map(f => f.fundName);
    try {
      const raw = localStorage.getItem('mf_visibleFunds');
      if (raw) {
        const stored = JSON.parse(raw);
        if (Array.isArray(stored)) {
          // only keep stored names that still exist
          const allowed = new Set(allNames);
          const next = new Set(stored.filter(n => allowed.has(n)));
          if (next.size) {
            setVisibleFundNames(next);
            return;
          }
        }
      }
    } catch (e) {
      // ignore and fall back
    }
    setVisibleFundNames(new Set(allNames));
  }, [sortedActiveFunds]);

  const toggleFundVisibility = (fundName) => {
    // Toggle and log for debugging
    setVisibleFundNames(prev => {
      const next = new Set(prev);
      if (next.has(fundName)) next.delete(fundName); else next.add(fundName);
      try {
        localStorage.setItem('mf_visibleFunds', JSON.stringify([...next]));
      } catch (e) {
        // ignore storage errors
      }
      return next;
    });
  };

  const colors = ['#64B5F6', '#6BC4A6', '#93B1B5', '#4F7C82', '#B8E3E9', '#FFB74D'];

  // Build chart data arrays that include visibility so Recharts sees data changes
  const pieData = sortedActiveFunds.map((f, idx) => ({
    name: f.fundName,
    value: f.currentValue,
    fundName: f.fundName,
    color: colors[idx % colors.length],
    isVisible: visibleFundNames.has(f.fundName)
  }));

  const barData = sortedActiveFunds.slice(0, 8).map((f, idx) => ({
    fundName: f.fundName,
    name: f.fundName,
    value: f.currentValue,
    color: colors[idx % colors.length],
    isVisible: visibleFundNames.has(f.fundName)
  }));

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
                  <td style={styles.td}>{formatDate(inv.buyDate)}</td>
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
                    <td style={styles.td}>{formatDate(inv.buyDate)}</td>
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
          {/* Analytics charts: allocation pie, top funds bar chart, portfolio value over time */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Allocation Pie */}
            <div style={{ minHeight: 260 }}>
              <h4 style={{ marginTop: 0, marginBottom: 12 }}>Fund Allocation</h4>
              {/* Allocation visualization */}
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={40}
                    paddingAngle={2}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={entry.isVisible ? 1 : 0.08} />
                    ))}
                  </Pie>
                  <ReTooltip formatter={(value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value)} />
                </PieChart>
              </ResponsiveContainer>
              {/* Custom legend below the chart to avoid overlapping the next section */}
              <div style={styles.pieLegend}>
                <div style={styles.pieLegendGrid}>
                  {visibleLegendItems.map((entry, index) => {
                    const origIndex = sortedActiveFunds.findIndex(f => f.fundName === entry.fundName);
                    const color = colors[origIndex % colors.length];
                    const isVisible = visibleFundNames.has(entry.fundName);
                    return (
                      <div
                        key={`legend-${index}`}
                        style={{ ...styles.pieLegendItem, cursor: 'pointer', opacity: isVisible ? 1 : 0.45 }}
                        role="button"
                        tabIndex={0}
                        onClick={() => toggleFundVisibility(entry.fundName)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleFundVisibility(entry.fundName); }}
                      >
                        <span style={{ ...styles.pieSwatch, background: color, opacity: isVisible ? 1 : 0.45 }} />
                        <span style={styles.pieLegendLabel}>{entry.fundName}</span>
                        <span style={styles.pieLegendValue}>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(entry.currentValue)}</span>
                      </div>
                    );
                  })}
                </div>
                {showLegendToggle && (
                  <div style={{ textAlign: 'center', marginTop: 8 }}>
                    <button style={styles.legendToggleButton} onClick={() => setLegendExpanded(!legendExpanded)}>
                      {legendExpanded ? 'Show less' : `Show ${legendItems.length - legendLimit} more`}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Top Funds Bar Chart */}
            <div style={{ minHeight: 260 }}>
              <h4 style={{ marginTop: 0, marginBottom: 12 }}>Top Funds by Current Value</h4>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <ReTooltip formatter={(value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value)} />
                  <Bar dataKey="value">
                    {barData.map((d, idx) => (
                      <Cell key={`barcell-${idx}`} fill={d.color} fillOpacity={d.isVisible ? 1 : 0.08} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Portfolio value over time: derive simple timeseries from buy dates */}
          <div style={{ marginTop: 16 }}>
            <h4 style={{ marginTop: 0, marginBottom: 12 }}>Portfolio Value Over Time (approx)</h4>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={timeseriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ReTooltip formatter={(value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value)} />
                <Line type="monotone" dataKey="current" stroke="#6BC4A6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="invested" stroke="#64B5F6" strokeWidth={2} strokeDasharray="4 3" dot={false} />
              </LineChart>
            </ResponsiveContainer>
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
  ,
  pieLegend: {
    marginTop: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    paddingRight: '8px'
  },
  pieLegendGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '8px',
    maxHeight: '120px',
    overflowY: 'auto'
  },
  pieLegendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#2C3E40'
  },
  pieSwatch: {
    width: '12px',
    height: '12px',
    borderRadius: '3px',
    display: 'inline-block'
  },
  pieLegendLabel: {
    flex: '1 1 auto',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  pieLegendValue: {
    color: '#5A6D70',
    fontSize: '13px',
    marginLeft: '8px'
  }
  ,
  legendToggleButton: {
    background: 'none',
    border: '1px solid #E8EDED',
    padding: '6px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    color: '#0B2E33'
  }
};

export default Analytics;
