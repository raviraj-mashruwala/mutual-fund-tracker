const functions = require('firebase-functions');
const admin = require('firebase-admin');
const https = require('https');

admin.initializeApp();
const db = admin.firestore();

// Shared date parser: convert DD-MMM-YYYY or ISO-like strings to YYYY-MM-DD, or null
const parseAMFIDate = (d) => {
  if (!d) return null;
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  const m = (typeof d === 'string') ? d.match(/^(\d{2})-([A-Za-z]{3})-(\d{4})$/) : null;
  if (m) {
    const day = m[1];
    const monthStr = m[2];
    const year = m[3];
    const monthMap = {
      'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
      'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
      'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
    };
    const mm = monthMap[monthStr] || null;
    if (mm) return `${year}-${mm}-${day}`;
  }
  const dt = new Date(d);
  if (!isNaN(dt.getTime())) return dt.toISOString().split('T')[0];
  return null;
};

// FIXED: Fetch NAV data from AMFI
const fetchNAVFromAMFI = () => {
  return new Promise((resolve, reject) => {
    // Use the correct AMFI URL (portal.amfiindia.com, not www)
    const url = 'https://portal.amfiindia.com/spages/NAVAll.txt';
    
    console.log('📡 Fetching from:', url);
    
    https.get(url, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          console.log(`📊 Received ${data.length} bytes of data`);
          
          const lines = data.split('\n');
          const navData = {};
          let currentDate = null;
          let linesParsed = 0;
          let schemesFound = 0;
          
          lines.forEach((line, index) => {
            const trimmedLine = line.trim();
            
            // Skip empty lines
            if (!trimmedLine) return;
            
            // Check for date line (format: DD-MMM-YYYY)
            const dateMatch = trimmedLine.match(/^(\d{2})-([A-Za-z]{3})-(\d{4})$/);
            if (dateMatch) {
              const [_, day, monthStr, year] = dateMatch;
              const monthMap = {
                'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
                'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
                'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
              };
              currentDate = `${year}-${monthMap[monthStr]}-${day}`;
              console.log(`📅 Found date: ${currentDate}`);
              return;
            }
            
            // Parse NAV data lines (format: code;isin;name;name2;nav;date)
            if (trimmedLine.includes(';')) {
              const parts = trimmedLine.split(';');

              // AMFI format: schemeCode;ISIN;SchemeISIN;SchemeName;NAV;ReportDate
              if (parts.length >= 5) {
                const schemeCode = parts[0].trim();
                const schemeName = parts[3].trim();
                const navValue = parseFloat(parts[4].trim());

                // Prefer the report date from the line if present (parts[5])
                let reportDateRaw = parts[5] ? parts[5].trim() : null;
                let parsedDate = null;

                // Helper: try parse AMFI date formats (DD-MMM-YYYY or YYYY-MM-DD)
                const parseAMFIDate = (d) => {
                  if (!d) return null;
                  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;

                  const m = (typeof d === 'string') ? d.match(/^(\d{2})-([A-Za-z]{3})-(\d{4})$/) : null;
                  if (m) {
                    const day = m[1];
                    const monthStr = m[2];
                    const year = m[3];
                    const monthMap = {
                      'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
                      'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
                      'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
                    };
                    const mm = monthMap[monthStr] || null;
                    if (mm) return `${year}-${mm}-${day}`;
                  }

                  // Fallback: try Date parser but avoid timezone shifts by reading as UTC when possible
                  const dt = new Date(d);
                  if (!isNaN(dt.getTime())) return dt.toISOString().split('T')[0];
                  return null;
                };

                if (reportDateRaw) {
                  parsedDate = parseAMFIDate(reportDateRaw);
                }

                // Do not silently fall back to today's date. Require a parsed report date or the file-level date.
                const finalDate = parsedDate || currentDate || null;

                // Validate data and ensure we have a report date
                if (schemeCode && schemeName && !isNaN(navValue) && navValue > 0 && finalDate) {
                  navData[schemeCode] = {
                    schemeName: schemeName,
                    nav: navValue,
                    date: finalDate
                  };

                  schemesFound++;

                  // Log first few schemes for debugging
                  if (schemesFound <= 5) {
                    console.log(`✓ Scheme ${schemesFound}: ${schemeCode} - ${schemeName} = ₹${navValue} on ${finalDate}`);
                  }

                  // Special log for scheme 120847
                  if (schemeCode === '120847') {
                    console.log(`🎯 FOUND TARGET SCHEME! ${schemeCode} - ${schemeName} = ₹${navValue} on ${finalDate}`);
                  }
                } else {
                  if (!finalDate) {
                    console.warn(`Skipping scheme ${schemeCode} because no valid report date found in AMFI data lines`);
                  }
                }
              }

              linesParsed++;
            }
          });
          
          console.log(`✅ Parsing complete:`);
          console.log(`   - Total lines: ${lines.length}`);
          console.log(`   - Lines parsed: ${linesParsed}`);
          console.log(`   - Schemes found: ${schemesFound}`);
          console.log(`   - Scheme 120847 in data: ${!!navData['120847']}`);
          
          if (schemesFound === 0) {
            console.error('❌ ERROR: No schemes parsed! Data format may have changed.');
            console.error('First 10 lines of data:');
            lines.slice(0, 10).forEach((line, i) => {
              console.error(`Line ${i}: ${line}`);
            });
          }
          
          resolve(navData);
        } catch (error) {
          console.error('❌ Error parsing AMFI data:', error);
          reject(error);
        }
      });
    }).on('error', (error) => {
      console.error('❌ Error fetching AMFI data:', error);
      reject(error);
    });
  });
};

// Helper: Store NAV history
const storeNavHistory = async (schemeCode, schemeName, nav, date) => {
  try {
    // Normalize date to YYYY-MM-DD using the same parser used earlier
    const parseAMFIDateLocal = (d) => {
      if (!d) return null;
      if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
      const m = (typeof d === 'string') ? d.match(/^(\d{2})-([A-Za-z]{3})-(\d{4})$/) : null;
      if (m) {
        const day = m[1];
        const monthStr = m[2];
        const year = m[3];
        const monthMap = {
          'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
          'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
          'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
        };
        const mm = monthMap[monthStr] || null;
        if (mm) return `${year}-${mm}-${day}`;
      }
      const dt = new Date(d);
      if (!isNaN(dt.getTime())) return dt.toISOString().split('T')[0];
      return null;
    };

    const navDate = parseAMFIDateLocal(date);
    if (!navDate) {
      console.warn(`storeNavHistory: could not parse date for ${schemeCode}: ${date}`);
      return;
    }

    const docId = `${schemeCode}_${navDate}`;
    const navDateObj = new Date(navDate);

    await db.collection('navHistory').doc(docId).set({
      schemeCode,
      schemeName,
      nav: parseFloat(nav),
      date: navDate,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      year: navDateObj.getFullYear(),
      month: navDateObj.getMonth() + 1,
      yearMonth: `${navDateObj.getFullYear()}-${String(navDateObj.getMonth() + 1).padStart(2, '0')}`
    }, { merge: true });

  } catch (error) {
    console.error('Error storing NAV history:', error);
  }
};

// MAIN FUNCTION: Manual NAV Update
exports.manualUpdateNAV = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    console.log('📊 Starting manual NAV update...');
    
    // Step 1: Fetch NAV data
    const navData = await fetchNAVFromAMFI();
    const totalSchemes = Object.keys(navData).length;
    console.log(`✅ Total schemes fetched: ${totalSchemes}`);
    
    // Step 2: Check if scheme 120847 exists
    console.log(`🔍 Looking for scheme 120847...`);
    const has120847 = !!navData['120847'];
    console.log(`📊 Scheme 120847 exists? ${has120847}`);
    
    if (navData['120847']) {
      console.log(`✅ Scheme 120847 data: ${JSON.stringify(navData['120847'])}`);
    }
    
    // Step 3: Get investments
    const investmentsSnapshot = await db.collection('investments').get();
    console.log(`📂 Found ${investmentsSnapshot.size} investments`);
    
    if (investmentsSnapshot.empty) {
      return res.json({
        success: true,
        message: 'No investments found',
        updatedCount: 0,
        totalSchemesFetched: totalSchemes,
        timestamp: new Date().toISOString()
      });
    }
    
    const investmentsList = [];
    investmentsSnapshot.forEach(doc => {
      const data = doc.data();
      investmentsList.push({ id: doc.id, ...data });
      console.log(`💼 Investment: ${data.fundName}, Scheme: ${data.schemeCode}`);
    });
    
    // Step 4: Update investments
    let updatedCount = 0;
    const batch = db.batch();
    const uniqueSchemeCodesUpdated = new Set();
    
    for (const investment of investmentsList) {
      const schemeCode = investment.schemeCode;
      console.log(`🔍 Checking scheme: ${schemeCode}`);
      
      if (schemeCode && navData[schemeCode]) {
        const { schemeName, nav, date } = navData[schemeCode];
        // Normalize date before writing to investments (ensure YYYY-MM-DD)
        const normalizedDate = (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) ? date : (date ? parseAMFIDate(date) : null);
        console.log(`✅ MATCH! ${schemeName}: ₹${nav} on ${normalizedDate || date}`);
        
        batch.update(db.collection('investments').doc(investment.id), {
          currentNAV: nav,
          currentNAVDate: normalizedDate || null,
          navLastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });
        
        uniqueSchemeCodesUpdated.add(schemeCode);
        updatedCount++;
      } else {
        console.log(`❌ NO MATCH for scheme ${schemeCode}`);
      }
    }
    
    await batch.commit();
    console.log(`✅ Committed ${updatedCount} updates`);
    
    // Step 5: Store NAV data and history
    for (const schemeCode of uniqueSchemeCodesUpdated) {
      const { schemeName, nav, date } = navData[schemeCode];
      const normalizedDate = (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) ? date : (date ? parseAMFIDate(date) : null);

      await db.collection('navData').doc(schemeCode).set({
        schemeCode,
        schemeName,
        currentNAV: nav,
        navDate: normalizedDate || null,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      if (normalizedDate) {
        await storeNavHistory(schemeCode, schemeName, nav, normalizedDate);
      } else {
        // If we couldn't normalize, still attempt to store history but log a warning
        console.warn(`Could not normalize date for scheme ${schemeCode}: ${date}`);
        await storeNavHistory(schemeCode, schemeName, nav, date);
      }
    }
    
    res.json({
      success: true,
      message: updatedCount > 0 ? `Updated ${updatedCount} investments` : 'No matching NAV data',
      updatedCount,
      totalInvestments: investmentsList.length,
      totalSchemesFetched: totalSchemes,
      scheme120847Exists: has120847,
      sampleSchemes: Object.keys(navData).slice(0, 5),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

// Scheduled update
exports.scheduledNavUpdate = functions.pubsub
  .schedule('0 18 * * 1-5')
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    try {
      const navData = await fetchNAVFromAMFI();
      const investmentsSnapshot = await db.collection('investments').get();
      
      if (investmentsSnapshot.empty) {
        console.log('No investments to update');
        return null;
      }
      
      let updatedCount = 0;
      const batch = db.batch();
      const uniqueSchemeCodes = new Set();
      
      investmentsSnapshot.forEach(doc => {
        const investment = doc.data();
        const schemeCode = investment.schemeCode;
        
        if (schemeCode && navData[schemeCode]) {
          const { schemeName, nav, date } = navData[schemeCode];
          
          batch.update(doc.ref, {
            currentNAV: nav,
            currentNAVDate: date,
            navLastUpdated: admin.firestore.FieldValue.serverTimestamp()
          });
          
          uniqueSchemeCodes.add(schemeCode);
          updatedCount++;
        }
      });
      
      await batch.commit();
      
      for (const schemeCode of uniqueSchemeCodes) {
        const { schemeName, nav, date } = navData[schemeCode];
        
        await db.collection('navData').doc(schemeCode).set({
          schemeCode,
          schemeName,
          currentNAV: nav,
          navDate: date,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        await storeNavHistory(schemeCode, schemeName, nav, date);
      }
      
      console.log(`Scheduled update: ${updatedCount} investments updated`);
      return null;
      
    } catch (error) {
      console.error('Scheduled update error:', error);
      return null;
    }
  });
