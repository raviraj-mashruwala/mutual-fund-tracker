// src/components/Tax.js
import React, { useEffect, useMemo, useState } from 'react';
import { 
  computeSalesFromInvestments, 
  enrichSalesWithClassification, 
  listAvailableFYs, 
  computeTaxForFY 
} from '../utils/taxService';
import { useTheme } from '../contexts/ThemeContext';

const currency = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0);

const Tax = ({ investments }) => {
  const { theme } = useTheme();
  const [fy, setFy] = useState(null);
  const [slabRatePct, setSlabRatePct] = useState(30);
  const [loading, setLoading] = useState(false);
  const [taxData, setTaxData] = useState(null);

  const availableFYs = useMemo(() => listAvailableFYs(investments), [investments]);

  useEffect(() => {
    if (!fy && availableFYs.length > 0) {
      setFy(availableFYs[availableFYs.length - 1]);
    }
  }, [fy, availableFYs]);

  const refresh = async () => {
    if (!fy) return;
    setLoading(true);
    try {
      const sales = computeSalesFromInvestments(investments);
      const enriched = await enrichSalesWithClassification(sales);
      const result = computeTaxForFY(enriched, fy, { slabRatePct });
      setTaxData(result);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fy, slabRatePct, investments]);

  const styles = {
    container: { display: 'flex', flexDirection: 'column', gap: 16 },
    panel: {
      background: '#FFFFFF',
      border: `1px solid ${theme.border}`,
      borderRadius: 12,
      padding: 16,
      boxShadow: '0 1px 3px rgba(11, 46, 51, 0.06)'
    },
    controls: { display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' },
    label: { fontSize: 14, fontWeight: 600, color: theme.textSecondary, marginRight: 8 },
    select: { padding: '10px', border: `1px solid ${theme.border}`, borderRadius: 6, background: '#fff' },
    input: { padding: '10px', border: `1px solid ${theme.border}`, borderRadius: 6, width: 120 },
    cardRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 },
    card: { background: '#FFFFFF', border: `1px solid ${theme.border}`, borderRadius: 12, padding: 16 },
    cardLabel: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: theme.textSecondary },
    icon: { fontSize: 16, opacity: 0.9 },
    cardValue: { fontSize: 22, fontWeight: 700, color: theme.text },
    hint: { marginTop: 8, fontSize: 12, color: theme.textSecondary },
    tableWrap: { marginTop: 12, background: '#FFFFFF', border: `1px solid ${theme.border}`, borderRadius: 12, overflow: 'hidden' },
    table: { width: '100%', borderCollapse: 'collapse' },
    thead: { background: theme.primary, color: theme.primaryDeepDark },
    th: { textAlign: 'left', borderBottom: `1px solid ${theme.border}`, padding: '10px', fontSize: 13, fontWeight: 700 },
    td: { borderBottom: `1px solid ${theme.border}`, padding: '10px', fontSize: 14, color: theme.text },
    badge: { padding: '4px 10px', borderRadius: 10, background: theme.primary, color: theme.primaryDeepDark, fontSize: 12, fontWeight: 600 }
  };

  return (
    <div style={styles.container}>
      <div style={styles.panel}>
        <div style={styles.controls}>
          <label style={styles.label}>Financial Year</label>
          <select style={styles.select} value={fy || ''} onChange={(e) => setFy(e.target.value)}>
            <option value="" disabled>Select FY</option>
            {availableFYs.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <label style={{ ...styles.label, marginLeft: 12 }}>Slab Rate (%) for Non-Equity</label>
          <input type="number" min={0} max={50} step={1} style={styles.input} value={slabRatePct} onChange={(e) => setSlabRatePct(Number(e.target.value || 0))} />
        </div>
      </div>

      {loading && (
        <div style={styles.panel}>Calculating tax...</div>
      )}

      {!loading && taxData && (
        <>
          <div style={styles.cardRow}>
            <div style={styles.card}>
              <div style={styles.cardLabel}><span style={styles.icon}>📈</span> <span>Equity LTCG Gain</span></div>
              <div style={styles.cardValue}>{currency(taxData.summary.totalEquityLTCGGain)}</div>
            </div>
            <div style={styles.card}>
              <div style={styles.cardLabel}><span style={styles.icon}>⚡</span> <span>Equity STCG Gain</span></div>
              <div style={styles.cardValue}>{currency(taxData.summary.totalEquitySTCGGain)}</div>
            </div>
            <div style={styles.card}>
              <div style={styles.cardLabel}><span style={styles.icon}>💼</span> <span>Non-Equity Gain</span></div>
              <div style={styles.cardValue}>{currency(taxData.summary.totalNonEquityGain)}</div>
            </div>
            <div style={styles.card}>
              <div style={styles.cardLabel}><span style={styles.icon}>🧾</span> <span>Total Tax</span></div>
              <div style={styles.cardValue}>{currency(taxData.summary.totalTax)}</div>
            </div>
          </div>

          <div style={styles.hint}>
            Equity-like LTCG @ 12.5% with ₹1,25,000 FY exemption (shared across LTCG entries). Equity-like STCG @ 20%. Debt/Gold/FoF/International and similar categories taxed at your slab.
          </div>

          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead style={styles.thead}>
                <tr>
                  <th style={styles.th}>Sell Date</th>
                  <th style={styles.th}>Fund</th>
                  <th style={styles.th}>Scheme Code</th>
                  <th style={styles.th}>Holding (days)</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Gain</th>
                  <th style={styles.th}>Taxable</th>
                  <th style={styles.th}>Tax</th>
                </tr>
              </thead>
              <tbody>
                {taxData.rows
                  .slice()
                  .sort((a, b) => new Date(a.sellDate) - new Date(b.sellDate))
                  .map((r, idx) => (
                  <tr key={idx}>
                    <td style={styles.td}>{r.sellDate}</td>
                    <td style={styles.td}>{r.fundName}</td>
                    <td style={styles.td}>{r.schemeCode}</td>
                    <td style={styles.td}>{r.holdingDays ?? '-'}</td>
                    <td style={styles.td}><span style={styles.badge}>{r.label}</span></td>
                    <td style={styles.td}>{currency(r.gain)}</td>
                    <td style={styles.td}>{currency(r.taxableAmount || 0)}</td>
                    <td style={styles.td}>{currency(r.tax || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default Tax;


