// src/utils/taxService.js
// Utilities to classify funds using MFAPI and compute capital gains tax by financial year

const MFAPI_BASE = 'https://api.mfapi.in/mf';

// Lightweight in-memory cache for session
const fundMetaCache = new Map();

function getLocalCache() {
	try {
		const raw = window.localStorage.getItem('fundMetaCache');
		return raw ? JSON.parse(raw) : {};
	} catch (e) {
		return {};
	}
}

function setLocalCache(cacheObj) {
	try {
		window.localStorage.setItem('fundMetaCache', JSON.stringify(cacheObj));
	} catch (e) {
		// ignore
	}
}

export async function fetchFundMeta(schemeCode) {
	if (!schemeCode) return null;
	if (fundMetaCache.has(schemeCode)) return fundMetaCache.get(schemeCode);

	const local = getLocalCache();
	if (local[schemeCode]) {
		fundMetaCache.set(schemeCode, local[schemeCode]);
		return local[schemeCode];
	}

	try {
		const res = await fetch(`${MFAPI_BASE}/${schemeCode}`);
		if (!res.ok) throw new Error('Failed to fetch fund meta');
		const json = await res.json();
		const meta = json?.meta || null;
		if (meta) {
			fundMetaCache.set(schemeCode, meta);
			const updated = { ...getLocalCache(), [schemeCode]: meta };
			setLocalCache(updated);
		}
		return meta;
	} catch (e) {
		return null;
	}
}

export function classifyFund(meta) {
    // Backward-compatible simple classification
    const detailed = classifyFundDetailed(meta);
    return { type: detailed.family === 'equity_like' ? 'equity' : (detailed.family === 'unknown' ? 'unknown' : 'non_equity'), schemeCategory: detailed.schemeCategory, schemeType: detailed.schemeType, fundHouse: detailed.fundHouse, family: detailed.family, subfamily: detailed.subfamily };
}

export function classifyFundDetailed(meta) {
    // Returns a richer classification for tax rules
    // { family: 'equity_like' | 'debt_like' | 'unknown', subfamily: string, schemeCategory, schemeType, fundHouse }
    if (!meta) return { family: 'unknown', subfamily: null, schemeCategory: null, schemeType: null, fundHouse: null };
    const schemeCategory = (meta.scheme_category || '').trim();
    const lowerCat = schemeCategory.toLowerCase();
    const schemeType = meta.scheme_type || null;
    const fundHouse = meta.fund_house || null;
    const schemeName = (meta.scheme_name || '').toLowerCase();

    // Equity-like buckets
    const isEquityCategory = lowerCat.startsWith('equity scheme');
    const isIndex = lowerCat.includes('index') || schemeName.includes('nifty') || schemeName.includes('sensex');
    const isAggressiveHybrid = lowerCat.includes('aggressive hybrid');
    const isElss = lowerCat.includes('elss') || schemeName.includes('elss') || schemeName.includes('tax saver');
    const isGold = schemeName.includes('gold') || lowerCat.includes('gold');
    const isFoF = lowerCat.includes('fof') || lowerCat.includes('fund of funds');
    const isOverseas = schemeName.includes('us') || schemeName.includes('s&p 500') || lowerCat.includes('overseas');

    // Debt-like buckets
    const isDebtCategory = lowerCat.startsWith('debt scheme');
    const debtKeywords = ['banking and psu', 'corporate bond', 'credit risk', 'dynamic bond', 'floater', 'money market', 'liquid', 'overnight', 'gilt', 'long duration', 'medium duration', 'short duration', 'ultra short'];
    const matchesDebtKeyword = debtKeywords.some(k => lowerCat.includes(k));

    // Hybrid
    const isConservativeHybrid = lowerCat.includes('conservative hybrid');
    const isBalancedAdvantage = lowerCat.includes('balanced advantage') || lowerCat.includes('dynamic asset allocation');

    if (isEquityCategory || isElss || isAggressiveHybrid || (isIndex && !isGold && !isOverseas)) {
        // Treat as equity-like for taxation
        return { family: 'equity_like', subfamily: isElss ? 'elss' : (isAggressiveHybrid ? 'aggressive_hybrid' : (isIndex ? 'index_equity' : 'equity')), schemeCategory, schemeType, fundHouse };
    }

    if (isGold) {
        return { family: 'debt_like', subfamily: 'gold', schemeCategory, schemeType, fundHouse };
    }

    if (isDebtCategory || matchesDebtKeyword) {
        return { family: 'debt_like', subfamily: 'debt', schemeCategory, schemeType, fundHouse };
    }

    if (isConservativeHybrid || isBalancedAdvantage || isFoF || isOverseas) {
        return { family: 'debt_like', subfamily: isConservativeHybrid ? 'conservative_hybrid' : (isBalancedAdvantage ? 'balanced_advantage' : (isFoF ? 'fof' : 'international_equity')), schemeCategory, schemeType, fundHouse };
    }

    // Default fallback
    return { family: 'unknown', subfamily: null, schemeCategory, schemeType, fundHouse };
}

// Centralized tax rule mapping (can be enhanced to load from backend later)
// Latest requested: Equity-like STCG 20%, LTCG 12.5% with ₹1,25,000 exemption per FY
const TAX_RULES = {
    equity_like: {
        stcgRate: 0.20, // 20%
        ltcgRate: 0.125, // 12.5%
        ltcgExemption: 125000, // INR per FY
        ltcgThresholdDays: 365,
        stcgAtSlab: false,
        ltcgAtSlab: false
    },
    debt_like: {
        // Tax at slab; no LTCG special handling
        stcgRate: null,
        ltcgRate: null,
        ltcgExemption: 0,
        ltcgThresholdDays: null,
        stcgAtSlab: true,
        ltcgAtSlab: true
    },
    unknown: {
        // Default to slab for safety
        stcgRate: null,
        ltcgRate: null,
        ltcgExemption: 0,
        ltcgThresholdDays: null,
        stcgAtSlab: true,
        ltcgAtSlab: true
    }
};

function getRuleForClassification(classification) {
    if (!classification) return TAX_RULES.unknown;
    const family = classification.family || 'unknown';
    return TAX_RULES[family] || TAX_RULES.unknown;
}

export function getFinancialYear(dateStr) {
	if (!dateStr) return null;
	const d = new Date(dateStr);
	if (Number.isNaN(d.getTime())) return null;
	const year = d.getFullYear();
	const month = d.getMonth(); // 0-indexed; 0 = Jan
	// Indian FY: Apr (3) to Mar (2)
	if (month >= 3) {
		return `${year}-${year + 1}`; // e.g., 2025-2026
	}
	return `${year - 1}-${year}`;
}

export function listAvailableFYs(investments) {
	const fys = new Set();
	(investments || []).forEach((inv) => {
		if (inv && inv.sellDate) {
			const fy = getFinancialYear(inv.sellDate);
			if (fy) fys.add(fy);
		}
	});
	return Array.from(fys).sort();
}

function diffDays(fromStr, toStr) {
	const from = new Date(fromStr);
	const to = new Date(toStr);
	if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return null;
	const ms = to.getTime() - from.getTime();
	return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export async function enrichSalesWithClassification(sales) {
	// sales: array of { schemeCode, ... }
	const uniqueCodes = Array.from(new Set((sales || []).map(s => s.schemeCode).filter(Boolean)));
	await Promise.all(uniqueCodes.map(async (code) => {
		if (!fundMetaCache.has(code)) {
			await fetchFundMeta(code);
		}
	}));
    return sales.map((s) => {
        const meta = fundMetaCache.get(s.schemeCode) || null;
        const cls = classifyFundDetailed(meta);
        return { ...s, fundClassification: cls };
    });
}

export function computeSalesFromInvestments(investments) {
	// Build a list of realized sales based on entries having sellDate and sellQuantity
	return (investments || [])
		.filter(inv => inv && inv.sellDate && parseFloat(inv.sellQuantity || '0') > 0 && parseFloat(inv.sellNAV || '0') > 0 && parseFloat(inv.buyNAV || '0') > 0)
		.map(inv => {
			const sellQty = parseFloat(inv.sellQuantity);
			const buyNav = parseFloat(inv.buyNAV);
			const sellNav = parseFloat(inv.sellNAV);
			const gain = (sellNav - buyNav) * sellQty;
			const holdingDays = diffDays(inv.buyDate, inv.sellDate);
			return {
				id: inv.id,
				fundName: inv.fundName,
				schemeCode: inv.schemeCode,
				buyDate: inv.buyDate,
				sellDate: inv.sellDate,
				buyNAV: buyNav,
				sellNAV: sellNav,
				sellQuantity: sellQty,
				gain,
				holdingDays,
				financialYear: getFinancialYear(inv.sellDate)
			};
		});
}

export function computeTaxForFY(enrichedSales, targetFY, options = {}) {
    const slabRate = (options.slabRatePct ?? 30) / 100;

    const salesInFY = (enrichedSales || []).filter(s => s.financialYear === targetFY);

    // Precompute row-wise CG type using category-specific thresholds
    const rows = salesInFY.map(s => {
        const cls = s.fundClassification;
        const rule = getRuleForClassification(cls);
        let cgType = 'stcg';
        if (rule.ltcgThresholdDays != null && (s.holdingDays ?? 0) >= rule.ltcgThresholdDays) {
            cgType = 'ltcg';
        }
        return { ...s, cgType, rule };
    });

    // Compute exemption bucket for all rows that qualify for LTCG exemption
    const ltcgEligibleRows = rows.filter(r => r.cgType === 'ltcg' && r.gain > 0 && r.rule.ltcgRate != null && r.rule.ltcgExemption > 0);
    const totalLTCGEligibleGain = ltcgEligibleRows.reduce((a, b) => a + b.gain, 0);
    const totalLTCGExemption = TAX_RULES.equity_like.ltcgExemption; // single FY exemption bucket for equity-like
    let remainingExemption = Math.max(0, totalLTCGExemption);

    const computedRows = rows.map(r => {
        if (r.gain <= 0) {
            return { ...r, taxableAmount: 0, tax: 0, label: 'Loss/No Gain' };
        }
        if (r.cgType === 'ltcg') {
            if (r.rule.ltcgRate == null) {
                // LTCG taxed at slab (debt-like treated same as STCG)
                const tax = r.gain * slabRate;
                return { ...r, taxableAmount: r.gain, tax, label: 'LTCG (Slab)' };
            }
            // Apply shared exemption for equity-like LTCG
            const exemptApplied = Math.min(r.gain, remainingExemption);
            remainingExemption -= exemptApplied;
            const taxable = Math.max(0, r.gain - exemptApplied);
            const tax = taxable * r.rule.ltcgRate;
            return { ...r, taxableAmount: taxable, tax, label: `Equity-like LTCG (${(r.rule.ltcgRate * 100).toFixed(1)}%)` };
        } else {
            // STCG branch
            if (r.rule.stcgAtSlab || r.rule.stcgRate == null) {
                const tax = r.gain * slabRate;
                return { ...r, taxableAmount: r.gain, tax, label: 'STCG (Slab)' };
            }
            const tax = r.gain * r.rule.stcgRate;
            return { ...r, taxableAmount: r.gain, tax, label: `Equity-like STCG (${(r.rule.stcgRate * 100).toFixed(1)}%)` };
        }
    });

    // Summaries by types
    const summary = computedRows.reduce((acc, r) => {
        if (r.label.includes('Equity-like LTCG')) acc.totalEquityLikeLTCGGain += r.gain;
        if (r.label.includes('Equity-like STCG')) acc.totalEquityLikeSTCGGain += r.gain;
        if (r.label.includes('Slab')) acc.totalSlabGain += r.gain;
        acc.totalTax += r.tax || 0;
        return acc;
    }, { totalEquityLikeLTCGGain: 0, totalEquityLikeSTCGGain: 0, totalSlabGain: 0, totalTax: 0, totalLTCGExemptionApplied: totalLTCGExemption - remainingExemption });

    return {
        financialYear: targetFY,
        summary,
        rows: computedRows
    };
}


