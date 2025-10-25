// functions/index.js - UPDATED WITH NAV HISTORY STORAGE
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const https = require('https');

admin.initializeApp();
const db = admin.firestore();

// Store NAV history in Firestore
const storeNavHistory = async (schemeCode, schemeName, nav, date) => {
  try {
    const navDate = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    const docId = `${schemeCode}_${navDate}`;

    await db.collection('navHistory').doc(docId).set({
      schemeCode,
      schemeName,
      nav: parseFloat(nav),
      date: navDate,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      year: new Date(navDate).getFullYear(),
      month: new Date(navDate).getMonth() + 1,
      yearMonth: `${new Date(navDate).getFullYear()}-${String(new Date(navDate).getMonth() + 1).padStart(2, '0')}`
    }, { merge: true });

    console.log(`NAV history stored for ${schemeName} on ${navDate}: ₹${nav}`);
  } catch (error) {
    console.error('Error storing NAV history:', error);
  }
};

// Fetch NAV data from AMFI
const fetchNAVFromAMFI = () => {
  return new Promise((resolve, reject) => {
    const url = 'https://www.amfiindia.com/spages/NAVAll.txt';

    https.get(url, (response) => {
      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        try {
          const lines = data.split('\n');
          const navData = {};
          let currentDate = null;

          lines.forEach(line => {
            const trimmedLine = line.trim();

            // Check for date line
            if (trimmedLine.includes(';')) {
              const parts = trimmedLine.split(';');
              if (parts.length >= 6 && parts[0] && parts[1] && parts[4]) {
                const schemeCode = parts[0];
                const schemeName = parts[3];
                const nav = parseFloat(parts[4]);

                if (!isNaN(nav) && nav > 0) {
                  navData[schemeCode] = {
                    schemeName,
                    nav,
                    date: currentDate || new Date().toISOString().split('T')[0]
                  };
                }
              }
            } else if (trimmedLine.match(/^\d{2}-\w{3}-\d{4}$/)) {
              // Date format: DD-MMM-YYYY
              const dateStr = trimmedLine;
              const dateParts = dateStr.split('-');
              const day = dateParts[0];
              const month = dateParts[1];
              const year = dateParts[2];

              const monthMap = {
                'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
                'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
                'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
              };

              currentDate = `${year}-${monthMap[month]}-${day}`;
            }
          });

          resolve(navData);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
};

// Manual NAV update function (updated with history storage)
exports.manualUpdateNAV = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    console.log('Starting manual NAV update...');

    // Fetch all investments to get unique scheme codes
    const investmentsSnapshot = await db.collection('investments').get();
    const schemeCodes = [...new Set(investmentsSnapshot.docs
      .map(doc => doc.data().schemeCode)
      .filter(code => code && code.trim())
    )];

    console.log(`Found ${schemeCodes.length} unique scheme codes`);

    if (schemeCodes.length === 0) {
      return res.json({
        success: true,
        message: 'No scheme codes found to update',
        updatedCount: 0
      });
    }

    // Fetch latest NAV data
    const navData = await fetchNAVFromAMFI();
    console.log(`Fetched NAV data for ${Object.keys(navData).length} schemes`);

    let updatedCount = 0;
    const batch = db.batch();

    // Update NAV for each scheme and store history
    for (const schemeCode of schemeCodes) {
      if (navData[schemeCode]) {
        const { schemeName, nav, date } = navData[schemeCode];

        // Update navData collection
        const navRef = db.collection('navData').doc(schemeCode);
        batch.set(navRef, {
          schemeCode,
          schemeName,
          currentNAV: nav,
          navDate: date,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        // Store NAV history (separate from batch for performance)
        await storeNavHistory(schemeCode, schemeName, nav, date);

        updatedCount++;
      }
    }

    // Commit batch updates
    await batch.commit();

    console.log(`Successfully updated ${updatedCount} NAV records with history`);

    res.json({
      success: true,
      message: `Updated ${updatedCount} NAV records with daily history`,
      updatedCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in manual NAV update:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Scheduled daily NAV update (with history storage)
exports.scheduledNavUpdate = functions.pubsub
  .schedule('0 18 * * 1-5') // 6 PM on weekdays
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    try {
      console.log('Starting scheduled NAV update...');

      // Get all unique scheme codes from investments
      const investmentsSnapshot = await db.collection('investments').get();
      const schemeCodes = [...new Set(investmentsSnapshot.docs
        .map(doc => doc.data().schemeCode)
        .filter(code => code && code.trim())
      )];

      if (schemeCodes.length === 0) {
        console.log('No scheme codes found for scheduled update');
        return null;
      }

      // Fetch NAV data
      const navData = await fetchNAVFromAMFI();

      const batch = db.batch();
      let updatedCount = 0;

      for (const schemeCode of schemeCodes) {
        if (navData[schemeCode]) {
          const { schemeName, nav, date } = navData[schemeCode];

          // Update navData collection
          const navRef = db.collection('navData').doc(schemeCode);
          batch.set(navRef, {
            schemeCode,
            schemeName,
            currentNAV: nav,
            navDate: date,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });

          // Store NAV history
          await storeNavHistory(schemeCode, schemeName, nav, date);

          updatedCount++;
        }
      }

      await batch.commit();
      console.log(`Scheduled update completed: ${updatedCount} records updated with history`);

      return null;
    } catch (error) {
      console.error('Error in scheduled NAV update:', error);
      return null;
    }
  });
