// src/utils/navService.js - UPDATED TO USE CLOUD FUNCTION ONLY
import { getStoredNAV } from './firebaseService';

// Base URL for cloud functions
const CLOUD_FUNCTION_BASE = 'https://us-central1-mutual-fund-tracker-d93c4.cloudfunctions.net';

/**
 * Fetch initial NAV for a scheme code when adding new investment
 * This gets the LATEST NAV from the cloud function
 */
export const fetchInitialNAV = async (schemeCode) => {
  try {
    console.log(`Fetching initial NAV for scheme ${schemeCode}...`);
    
    // First, check if we have stored NAV data
    const storedNav = await getStoredNAV(schemeCode);
    
    if (storedNav && storedNav.currentNAV) {
      console.log(`Found stored NAV: ₹${storedNav.currentNAV} (${storedNav.navDate})`);
      return {
        nav: storedNav.currentNAV,
        date: storedNav.navDate,
        schemeName: storedNav.schemeName || 'Unknown Fund'
      };
    }
    
    // If no stored NAV, trigger manual update to fetch latest
    console.log('No stored NAV found, fetching latest from AMFI via cloud function...');
    
    const response = await fetch(`${CLOUD_FUNCTION_BASE}/manualUpdateNAV`);
    const result = await response.json();
    
    if (result.success) {
      // After update, get the stored NAV again
      const updatedNav = await getStoredNAV(schemeCode);
      
      if (updatedNav && updatedNav.currentNAV) {
        console.log(`✅ Fetched latest NAV: ₹${updatedNav.currentNAV} (${updatedNav.navDate})`);
        return {
          nav: updatedNav.currentNAV,
          date: updatedNav.navDate,
          schemeName: updatedNav.schemeName || 'Unknown Fund'
        };
      }
    }
    
    // Fallback: return null if still not found
    console.warn(`⚠️ Could not fetch NAV for scheme ${schemeCode}`);
    return null;
    
  } catch (error) {
    console.error('Error fetching initial NAV:', error);
    return null;
  }
};

/**
 * Get current NAV for a scheme code (from stored data only)
 */
export const getCurrentNAV = async (schemeCode) => {
  try {
    const storedNav = await getStoredNAV(schemeCode);
    
    if (storedNav && storedNav.currentNAV) {
      return {
        nav: storedNav.currentNAV,
        date: storedNav.navDate,
        schemeName: storedNav.schemeName || 'Unknown Fund'
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting current NAV:', error);
    return null;
  }
};

/**
 * Refresh all NAVs using cloud function
 */
export const refreshAllNAVs = async () => {
  try {
    console.log('🔄 Refreshing all NAVs via cloud function...');
    
    const response = await fetch(`${CLOUD_FUNCTION_BASE}/manualUpdateNAV`);
    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ Successfully updated ${result.updatedCount} NAVs`);
      return result;
    } else {
      throw new Error(result.error || 'Failed to refresh NAVs');
    }
  } catch (error) {
    console.error('Error refreshing NAVs:', error);
    throw error;
  }
};
