// src/utils/navHistoryService.js
import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  orderBy,
  doc,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase';

const NAV_HISTORY_COLLECTION = 'navHistory';

// Store daily NAV for a fund
export const storeNavHistory = async (schemeCode, schemeName, nav, date) => {
  try {
    // Normalize incoming date to YYYY-MM-DD
    const normalizeDate = (d) => {
      if (!d) return new Date().toISOString().split('T')[0];
      if (typeof d === 'string') {
        // already in YYYY-MM-DD?
        if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;

        // Try DD-MMM-YYYY (e.g., 29-Oct-2025)
        const m = d.match(/^(\d{2})-([A-Za-z]{3})-(\d{4})$/);
        if (m) {
          const day = m[1];
          const monthStr = m[2];
          const year = m[3];
          const monthMap = {
            'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
            'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
            'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
          };
          const mm = monthMap[monthStr] || '01';
          return `${year}-${mm}-${day}`;
        }

        // Fallback: try Date parser
        const dt = new Date(d);
        if (!isNaN(dt.getTime())) return dt.toISOString().split('T')[0];
        return new Date().toISOString().split('T')[0];
      }
      // Date object
      return d.toISOString().split('T')[0];
    };

    const navDate = normalizeDate(date);
    const docId = `${schemeCode}_${navDate}`;

    await setDoc(doc(db, NAV_HISTORY_COLLECTION, docId), {
      schemeCode,
      schemeName,
      nav: parseFloat(nav),
      date: navDate,
      createdAt: new Date().toISOString(),
  year: new Date(navDate).getFullYear(),
  month: new Date(navDate).getMonth() + 1,
  yearMonth: `${new Date(navDate).getFullYear()}-${String(new Date(navDate).getMonth() + 1).padStart(2, '0')}`
    }, { merge: true });

    console.log(`NAV history stored for ${schemeName} on ${navDate}: ₹${nav}`);
  } catch (error) {
    console.error('Error storing NAV history:', error);
  }
};

// Get NAV history for analysis
export const getNavHistory = async (startDate, endDate, schemeCodes = []) => {
  try {
    let q = query(
      collection(db, NAV_HISTORY_COLLECTION),
      orderBy('date', 'desc'),
      orderBy('schemeCode')
    );

    // Add filters if provided
    if (startDate) {
      q = query(q, where('date', '>=', startDate));
    }
    if (endDate) {
      q = query(q, where('date', '<=', endDate));
    }
    if (schemeCodes.length > 0) {
      q = query(q, where('schemeCode', 'in', schemeCodes));
    }

    const querySnapshot = await getDocs(q);
    const navHistory = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return navHistory;
  } catch (error) {
    console.error('Error fetching NAV history:', error);
    return [];
  }
};

// Calculate daily change percentage
export const calculateDailyChange = (navHistory) => {
  const changes = [];

  // Group by scheme code
  const groupedByScheme = navHistory.reduce((acc, record) => {
    if (!acc[record.schemeCode]) {
      acc[record.schemeCode] = [];
    }
    acc[record.schemeCode].push(record);
    return acc;
  }, {});

  // Calculate changes for each scheme
  Object.keys(groupedByScheme).forEach(schemeCode => {
    const records = groupedByScheme[schemeCode].sort((a, b) => new Date(a.date) - new Date(b.date));

    for (let i = 1; i < records.length; i++) {
      const current = records[i];
      const previous = records[i - 1];

      const changePercent = ((current.nav - previous.nav) / previous.nav * 100);

      changes.push({
        schemeCode: current.schemeCode,
        schemeName: current.schemeName,
        date: current.date,
        year: current.year,
        month: current.month,
        yearMonth: current.yearMonth,
        currentNav: current.nav,
        previousNav: previous.nav,
        changePercent: parseFloat(changePercent.toFixed(2)),
        changeAmount: parseFloat((current.nav - previous.nav).toFixed(2))
      });
    }
  });

  return changes.sort((a, b) => new Date(b.date) - new Date(a.date));
};

// Get NAV history for specific funds (user's portfolio)
export const getPortfolioNavHistory = async (userInvestments, startDate, endDate) => {
  try {
    const schemeCodes = [...new Set(userInvestments.map(inv => inv.schemeCode).filter(Boolean))];

    if (schemeCodes.length === 0) {
      return [];
    }

    const navHistory = await getNavHistory(startDate, endDate, schemeCodes);
    return calculateDailyChange(navHistory);
  } catch (error) {
    console.error('Error fetching portfolio NAV history:', error);
    return [];
  }
};

// Auto-store NAV when investments are added/updated
export const updateNavHistoryForInvestment = async (investment) => {
  try {
    if (investment.currentNAV && investment.currentNAVDate && investment.schemeCode) {
      await storeNavHistory(
        investment.schemeCode,
        investment.fundName,
        investment.currentNAV,
        investment.currentNAVDate
      );
    }
  } catch (error) {
    console.error('Error updating NAV history for investment:', error);
  }
};
