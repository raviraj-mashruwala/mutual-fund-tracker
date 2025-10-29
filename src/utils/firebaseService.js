// src/utils/firebaseService.js - UPDATED WITH NAV HISTORY
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  query,
  where,
  orderBy,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { fetchInitialNAV } from './navService';
import { storeNavHistory, updateNavHistoryForInvestment } from './navHistoryService';

const COLLECTION_NAME = 'investments';
const NAV_COLLECTION = 'navData';

// Fetch investments for current user only
export const fetchInvestments = async (userId) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME), 
      where('userId', '==', userId),
      orderBy('buyDate', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const investments = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return investments;
  } catch (error) {
    console.error('Error fetching investments:', error);
    throw error;
  }
};

// Add investment with userId and NAV history
export const addInvestment = async (investment, userId) => {
  try {
    let currentNAV = null;
    let currentNAVDate = null;

    if (investment.schemeCode) {
      try {
        const navData = await fetchInitialNAV(investment.schemeCode);
        if (navData) {
          // Normalize date to YYYY-MM-DD, but be strict: if we can't parse the AMFI date, do not fallback to today.
          const normalizeDateStrict = (d) => {
            if (!d) return null;
            if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
            const dt = new Date(d);
            if (!isNaN(dt.getTime())) return dt.toISOString().split('T')[0];
            return null;
          };

          currentNAV = navData.nav;
          currentNAVDate = normalizeDateStrict(navData.date);

          if (currentNAVDate) {
            // Store in NAV collection
            await setDoc(doc(db, NAV_COLLECTION, investment.schemeCode), {
              schemeCode: investment.schemeCode,
              schemeName: navData.schemeName,
              currentNAV: navData.nav,
              navDate: currentNAVDate,
              lastUpdated: new Date().toISOString()
            }, { merge: true });

            // Store in NAV history for tracking daily changes
            await storeNavHistory(
              investment.schemeCode,
              investment.fundName,
              navData.nav,
              currentNAVDate
            );
          } else {
            console.warn(`Not storing NAV for ${investment.schemeCode} because AMFI date could not be parsed: ${navData.date}`);
          }

          console.log(`Initial NAV and history stored for ${investment.fundName}: ${currentNAV}`);
        }
      } catch (navError) {
        console.error('Error fetching initial NAV:', navError);
      }
    }

    // Add investment with userId
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...investment,
      userId: userId,
      currentNAV: currentNAV,
      currentNAVDate: currentNAVDate,
      createdAt: new Date().toISOString()
    });

    const newInvestment = { 
      id: docRef.id, 
      ...investment,
      userId,
      currentNAV,
      currentNAVDate
    };

    // Update NAV history for this investment
    await updateNavHistoryForInvestment(newInvestment);

    return newInvestment;
  } catch (error) {
    console.error('Error adding investment:', error);
    throw error;
  }
};

// Update investment (verify ownership)
export const updateInvestment = async (id, updatedData, userId) => {
  try {
    const investmentRef = doc(db, COLLECTION_NAME, id);

    // Verify user owns this investment
    const investmentDoc = await getDoc(investmentRef);
    if (!investmentDoc.exists() || investmentDoc.data().userId !== userId) {
      throw new Error('Unauthorized: You can only update your own investments');
    }

    await updateDoc(investmentRef, {
      ...updatedData,
      updatedAt: new Date().toISOString()
    });

    const updatedInvestment = { id, ...updatedData };

    // Update NAV history if current NAV changed
    if (updatedData.currentNAV) {
      // Ensure date normalized
      if (updatedInvestment.currentNAVDate) {
        // prefer YYYY-MM-DD
        const dt = new Date(updatedInvestment.currentNAVDate);
        if (!isNaN(dt.getTime())) {
          updatedInvestment.currentNAVDate = dt.toISOString().split('T')[0];
        }
      }
      await updateNavHistoryForInvestment(updatedInvestment);
    }

    return updatedInvestment;
  } catch (error) {
    console.error('Error updating investment:', error);
    throw error;
  }
};

// Delete investment (verify ownership)
export const deleteInvestment = async (id, userId) => {
  try {
    const investmentRef = doc(db, COLLECTION_NAME, id);

    // Verify user owns this investment
    const investmentDoc = await getDoc(investmentRef);
    if (!investmentDoc.exists() || investmentDoc.data().userId !== userId) {
      throw new Error('Unauthorized: You can only delete your own investments');
    }

    await deleteDoc(investmentRef);
    return id;
  } catch (error) {
    console.error('Error deleting investment:', error);
    throw error;
  }
};

export const getStoredNAV = async (schemeCode) => {
  try {
    const navRef = doc(db, NAV_COLLECTION, schemeCode);
    const navDoc = await getDoc(navRef);

    if (navDoc.exists()) {
      return navDoc.data();
    }
    return null;
  } catch (error) {
    console.error('Error getting stored NAV:', error);
    return null;
  }
};

export const updateInvestmentNAV = async (investmentId, currentNAV, currentNAVDate) => {
  try {
    const investmentRef = doc(db, COLLECTION_NAME, investmentId);
    await updateDoc(investmentRef, {
      currentNAV: currentNAV,
      currentNAVDate: currentNAVDate,
      navLastUpdated: new Date().toISOString()
    });
    console.log(`Updated NAV for investment ${investmentId}`);
  } catch (error) {
    console.error('Error updating investment NAV:', error);
    throw error;
  }
};

// Bulk update NAV for all investments and store history
export const bulkUpdateNAVWithHistory = async (navUpdates) => {
  try {
    const promises = navUpdates.map(async (update) => {
      const { schemeCode, schemeName, nav, date } = update;

      // Store in NAV history
      // strict normalize date
      const normalizeDateStrict = (d) => {
        if (!d) return null;
        if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
        const dt = new Date(d);
        if (!isNaN(dt.getTime())) return dt.toISOString().split('T')[0];
        return null;
      };

      const normalizedDate = normalizeDateStrict(date);
      if (normalizedDate) {
        await storeNavHistory(schemeCode, schemeName, nav, normalizedDate);

        // Update NAV collection
        await setDoc(doc(db, NAV_COLLECTION, schemeCode), {
          schemeCode,
          schemeName,
          currentNAV: nav,
          navDate: normalizedDate,
          lastUpdated: new Date().toISOString()
        }, { merge: true });
      } else {
        console.warn(`Skipping NAV update for ${schemeCode} because date could not be parsed: ${date}`);
      }
    });

    await Promise.all(promises);
    console.log(`Bulk updated ${navUpdates.length} NAV records with history`);
  } catch (error) {
    console.error('Error in bulk NAV update:', error);
    throw error;
  }
};
