// src/components/InvestmentForm.js - WITH SCHEME CODE FIELD
import React, { useState, useEffect, useRef } from 'react';

const InvestmentForm = ({ onSubmit, initialData, onCancel, existingFundNames, existingTags = [] }) => {
  const [formData, setFormData] = useState({
    fundName: '',
    schemeCode: '',  // NEW: AMFI Scheme Code
    tags: [],        // tokenized array of tags
    notes: '',
    buyDate: '',
    buyNAV: '',
    quantity: '',
    buyTotalAmount: '',
    sellDate: '',
    sellNAV: '',
    sellQuantity: '',
    sellTotalAmount: ''
  });

  const [showFundSuggestions, setShowFundSuggestions] = useState(false);

  // Keep a separate input state for tag typing (autocomplete)
  const [tagInput, setTagInput] = useState('');
  useEffect(() => {
    if (initialData) {
      // Normalize incoming initialData: tags may be stored as array in Firestore
      const normalizedInitial = {
        ...initialData,
        tags: Array.isArray(initialData.tags) ? initialData.tags.map(t => t.toString()) : (initialData.tags ? initialData.tags.split(',').map(t => t.trim()) : []),
        notes: initialData.notes || ''
      };
      setFormData(normalizedInitial);
      setTagInput('');
    }
  }, [initialData]);

  // Auto-calculate buy total amount
  useEffect(() => {
    if (formData.buyNAV && formData.quantity) {
      const buyTotal = parseFloat(formData.buyNAV) * parseFloat(formData.quantity);
      setFormData(prev => ({
        ...prev,
        buyTotalAmount: buyTotal.toFixed(2)
      }));
    }
  }, [formData.buyNAV, formData.quantity]);

  // Auto-calculate sell total amount
  useEffect(() => {
    if (formData.sellNAV && formData.sellQuantity) {
      const sellTotal = parseFloat(formData.sellNAV) * parseFloat(formData.sellQuantity);
      setFormData(prev => ({
        ...prev,
        sellTotalAmount: sellTotal.toFixed(2)
      }));
    }
  }, [formData.sellNAV, formData.sellQuantity]);

  // Auto-populate/clear sellQuantity when sellDate is toggled.
  // - If sellDate becomes non-empty and sellQuantity is empty, copy buy quantity into sellQuantity.
  // - If sellDate is cleared, clear sellQuantity and sellTotalAmount.
  // The value remains editable by the user after auto-population.
  const prevSellDateRef = useRef(formData.sellDate);
  useEffect(() => {
    const prevSellDate = prevSellDateRef.current;

    // sellDate cleared -> remove sellQuantity and sellTotalAmount
    if (!formData.sellDate && prevSellDate) {
      if (formData.sellQuantity || formData.sellTotalAmount) {
        setFormData(prev => ({ ...prev, sellQuantity: '', sellTotalAmount: '' }));
      }
    }

    // sellDate newly set -> if sellQuantity empty, copy buy quantity
    if (formData.sellDate && !prevSellDate) {
      if (!formData.sellQuantity && formData.quantity) {
        setFormData(prev => ({ ...prev, sellQuantity: formData.quantity }));
      }
    }

    prevSellDateRef.current = formData.sellDate;
  }, [formData.sellDate, formData.sellQuantity, formData.quantity, formData.sellTotalAmount]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'fundName') {
      setShowFundSuggestions(value.length > 0);
    }
  };

  // Tag helpers
  const addTag = (tag) => {
    const t = (tag || '').toString().trim();
    if (!t) return;
    setFormData(prev => ({ ...prev, tags: Array.from(new Set([...(prev.tags || []), t])) }));
    setTagInput('');
  };

  const removeTag = (tag) => {
    setFormData(prev => ({ ...prev, tags: (prev.tags || []).filter(t => t !== tag) }));
  };

  const handleTagInputChange = (e) => {
    setTagInput(e.target.value);
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const v = tagInput.trim();
      if (v) addTag(v.replace(/,$/, ''));
    } else if (e.key === 'Backspace' && !tagInput) {
      // remove last tag when backspace on empty input
      setFormData(prev => {
        const nextTags = (prev.tags || []).slice(0, -1);
        return { ...prev, tags: nextTags };
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Normalize tags (already an array) and trim notes
    const normalized = {
      ...formData,
      tags: Array.isArray(formData.tags) ? formData.tags.map(t => t.trim()).filter(Boolean) : [],
      notes: formData.notes ? formData.notes.trim() : ''
    };

    onSubmit(normalized);
    if (!initialData) {
      setFormData({
        fundName: '',
        schemeCode: '',
        tags: '',
        notes: '',
        buyDate: '',
        buyNAV: '',
        quantity: '',
        buyTotalAmount: '',
        sellDate: '',
        sellNAV: '',
        sellQuantity: '',
        sellTotalAmount: ''
      });
    }
  };

  const selectFundName = (name) => {
    setFormData(prev => ({ ...prev, fundName: name }));
    setShowFundSuggestions(false);
  };

  const filteredFundNames = existingFundNames?.filter(name => 
    name.toLowerCase().includes(formData.fundName.toLowerCase())
  ) || [];

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h3 style={styles.heading}>{initialData ? 'Edit Investment' : 'Add New Investment'}</h3>
          <button onClick={onCancel} style={styles.closeButton}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGrid}>
            {/* Fund Name */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Fund Name *</label>
              <input
                type="text"
                name="fundName"
                value={formData.fundName}
                onChange={handleChange}
                required
                style={styles.input}
                placeholder="e.g., Axis Bluechip Fund"
              />
              {showFundSuggestions && filteredFundNames.length > 0 && (
                <div style={styles.suggestions}>
                  {filteredFundNames.map((name, idx) => (
                    <div
                      key={idx}
                      style={styles.suggestionItem}
                      onClick={() => selectFundName(name)}
                    >
                      {name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SCHEME CODE - NEW FIELD */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>
                AMFI Scheme Code * 
                <span style={styles.helpText}> (6-digit code)</span>
              </label>
              <input
                type="text"
                name="schemeCode"
                value={formData.schemeCode}
                onChange={handleChange}
                required
                pattern="[0-9]{6}"
                style={styles.input}
                placeholder="e.g., 120503"
                title="Enter 6-digit AMFI scheme code"
              />
              <small style={styles.smallText}>
                Find at <a href="https://www.amfiindia.com/net-asset-value/nav-history" target="_blank" rel="noopener noreferrer" style={styles.link}>AMFI NAV</a>
              </small>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Buy Date *</label>
              <input
                type="date"
                name="buyDate"
                value={formData.buyDate}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Buy NAV *</label>
              <input
                type="number"
                step="0.0001"
                name="buyNAV"
                value={formData.buyNAV}
                onChange={handleChange}
                required
                style={styles.input}
                placeholder="120.5000"
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Quantity *</label>
              <input
                type="number"
                step="0.001"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                required
                style={styles.input}
                placeholder="100.000"
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Buy Total Amount * (Auto-calculated)</label>
              <input
                type="number"
                step="0.01"
                name="buyTotalAmount"
                value={formData.buyTotalAmount}
                onChange={handleChange}
                required
                style={{...styles.input, backgroundColor: '#F8FAFB'}}
                placeholder="Calculated automatically"
                readOnly
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Sell Date</label>
              <input
                type="date"
                name="sellDate"
                value={formData.sellDate}
                onChange={handleChange}
                style={styles.input}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Sell NAV</label>
              <input
                type="number"
                step="0.0001"
                name="sellNAV"
                value={formData.sellNAV}
                onChange={handleChange}
                style={styles.input}
                placeholder="135.2000"
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Sell Quantity</label>
              <input
                type="number"
                step="0.001"
                name="sellQuantity"
                value={formData.sellQuantity}
                onChange={handleChange}
                style={styles.input}
                placeholder="100.000"
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Sell Total Amount (Auto-calculated)</label>
              <input
                type="number"
                step="0.01"
                name="sellTotalAmount"
                value={formData.sellTotalAmount}
                onChange={handleChange}
                style={{...styles.input, backgroundColor: '#F8FAFB'}}
                placeholder="Calculated automatically"
                readOnly
              />
            </div>
            {/* Tags (tokenized multi-select with autocomplete) */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Tags</label>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                {(formData.tags || []).map((t, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F1F6F7', padding: '6px 8px', borderRadius: 8 }}>
                    <span style={{ fontSize: 13 }}>{t}</span>
                    <button type="button" onClick={() => removeTag(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A94442' }}>✕</button>
                  </div>
                ))}
                <input
                  type="text"
                  name="tagInput"
                  value={tagInput}
                  onChange={handleTagInputChange}
                  onKeyDown={handleTagKeyDown}
                  placeholder="Type and press Enter (suggestions appear)"
                  style={{ ...styles.input, minWidth: 160 }}
                />
              </div>
              <small style={styles.smallText}>Select or type tags. Press Enter to add. Suggestions show existing tags.</small>

              {tagInput && (
                <div style={{ ...styles.suggestions, maxHeight: 140 }}>
                  {existingTags.filter(t => t.toLowerCase().includes(tagInput.toLowerCase()) && !(formData.tags || []).includes(t)).slice(0, 8).map((s, i) => (
                    <div key={i} style={styles.suggestionItem} onClick={() => addTag(s)}>{s}</div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                style={{...styles.input, minHeight: '80px'}}
                placeholder="Optional notes about this transaction"
              />
            </div>
          </div>

          <div style={styles.buttonGroup}>
            <button type="submit" style={styles.submitButton}>
              {initialData ? 'Update Investment' : 'Add Investment'}
            </button>
            <button type="button" onClick={onCancel} style={styles.cancelButton}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    overflowY: 'auto',
    padding: '20px'
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    maxWidth: '900px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    margin: '20px'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #E8EDED',
    position: 'sticky',
    top: 0,
    backgroundColor: '#fff',
    zIndex: 1
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#666',
    padding: '0',
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    transition: 'background-color 0.2s'
  },
  form: {
    padding: '24px'
  },
  heading: {
    margin: 0,
    color: '#2C3E40',
    fontSize: '20px',
    fontWeight: '700'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
    marginBottom: '20px'
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative'
  },
  label: {
    marginBottom: '6px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#2C3E40'
  },
  helpText: {
    fontSize: '12px',
    fontWeight: '400',
    color: '#5A6D70',
    fontStyle: 'italic'
  },
  input: {
    padding: '10px',
    fontSize: '14px',
    border: '1px solid #E8EDED',
    borderRadius: '6px',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  smallText: {
    fontSize: '11px',
    color: '#5A6D70',
    marginTop: '4px'
  },
  link: {
    color: '#4F7C82',
    textDecoration: 'none',
    fontWeight: '500'
  },
  suggestions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    border: '1px solid #E8EDED',
    borderTop: 'none',
    borderRadius: '0 0 6px 6px',
    maxHeight: '150px',
    overflowY: 'auto',
    zIndex: 10,
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  },
  suggestionItem: {
    padding: '10px',
    cursor: 'pointer',
    borderBottom: '1px solid #F8FAFB',
    transition: 'background-color 0.2s'
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    marginTop: '20px',
    justifyContent: 'flex-end'
  },
  submitButton: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #4F7C82 0%, #0B2E33 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  cancelButton: {
    padding: '12px 24px',
    backgroundColor: '#E8EDED',
    color: '#2C3E40',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
  }
};

export default InvestmentForm;
