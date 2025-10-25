// src/utils/navService.js
// Service to fetch and manage NAV data from AMFI India

const AMFI_NAV_URL = 'https://portal.amfiindia.com/spages/NAVAll.txt';

// Use CORS proxy for development (replace with Firebase Cloud Function in production)
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

/**
 * Fetch and parse AMFI NAV data
 * Returns map of schemeCode -> NAV data
 */
export const fetchAllNAVData = async () => {
  try {
    console.log('Fetching NAV data from AMFI...');

    const response = await fetch(CORS_PROXY + encodeURIComponent(AMFI_NAV_URL));

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    const navData = parseAMFIData(text);

    console.log(`Fetched NAV data for ${Object.keys(navData).length} schemes`);
    return navData;
  } catch (error) {
    console.error('Error fetching AMFI NAV data:', error);
    throw error;
  }
};

/**
 * Parse AMFI NAV text file
 * Format: Scheme Code;ISIN;ISIN2;Scheme Name;NAV;Date
 */
const parseAMFIData = (text) => {
  const lines = text.split('\n');
  const navData = {};

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and header
    if (!trimmed || trimmed.startsWith('Scheme Code')) {
      continue;
    }

    const parts = trimmed.split(';');

    if (parts.length >= 5) {
      const schemeCode = parts[0].trim();
      const schemeName = parts[2] ? parts[2].trim() : (parts[3] ? parts[3].trim() : '');
      const navValue = parts[parts.length - 2].trim();
      const date = parts[parts.length - 1].trim();

      if (schemeCode && navValue && navValue !== '-' && !isNaN(parseFloat(navValue))) {
        navData[schemeCode] = {
          schemeCode,
          schemeName,
          nav: parseFloat(navValue),
          date: date,
          lastUpdated: new Date().toISOString()
        };
      }
    }
  }

  return navData;
};

/**
 * Get NAV for a specific scheme code
 */
export const getNAVBySchemeCode = async (schemeCode) => {
  try {
    const allData = await fetchAllNAVData();

    if (allData[schemeCode]) {
      return allData[schemeCode];
    } else {
      console.warn(`Scheme code ${schemeCode} not found in AMFI data`);
      return null;
    }
  } catch (error) {
    console.error(`Error getting NAV for scheme ${schemeCode}:`, error);
    return null;
  }
};

/**
 * Get NAV for multiple scheme codes (bulk fetch)
 */
export const getBulkNAV = async (schemeCodes) => {
  try {
    const allData = await fetchAllNAVData();
    const result = {};

    for (const code of schemeCodes) {
      if (allData[code]) {
        result[code] = allData[code];
      } else {
        console.warn(`Scheme code ${code} not found`);
      }
    }

    return result;
  } catch (error) {
    console.error('Error getting bulk NAV data:', error);
    return {};
  }
};

/**
 * Fetch NAV on first entry (called when adding new investment)
 */
export const fetchInitialNAV = async (schemeCode) => {
  console.log(`Fetching initial NAV for scheme ${schemeCode}...`);
  return await getNAVBySchemeCode(schemeCode);
};
