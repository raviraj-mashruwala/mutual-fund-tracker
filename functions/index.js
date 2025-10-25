// functions/index.js - UPDATED
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const https = require('https');

admin.initializeApp();
const db = admin.firestore();

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

// Store NAV history
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
  } catch (error) {
    console.error('Error storing NAV history:', error);
  }
};

// Main manual update function - UPDATED TO ALSO UPDATE INVESTMENTS
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
    
    // Fetch latest NAV data
    const navData = await fetchNAVFromAMFI();
    console.log(`Fetched NAV data for ${Object.keys(navData).length} schemes`);
    
    // Get all investments across all users
    const investmentsSnapshot = await db.collection('investments').get();
    
    let updatedCount = 0;
    let investmentUpdatedCount = 0;
    const batch = db.batch();
    
    // Process each investment
    for (const investmentDoc of investmentsSnapshot.docs) {
      const investment = investmentDoc.data();
      const schemeCode = investment.schemeCode;
      
      if (schemeCode && navData[schemeCode]) {
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
        
        // Update the INVESTMENT document with latest NAV ← THIS WAS MISSING!
        const investmentRef = db.collection('investments').doc(investmentDoc.id);
        batch.update(investmentRef, {
          currentNAV: nav,
          currentNAVDate: date,
          navLastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });
        
        investmentUpdatedCount++;
        updatedCount++;
      }
    }
    
    // Commit all updates at once
    await batch.commit();
    
    // Store NAV history (done after batch for better performance)
    for (const schemeCode in navData) {
      if (navData.hasOwnProperty(schemeCode)) {
        const { schemeName, nav, date } = navData[schemeCode];
        await storeNavHistory(schemeCode, schemeName, nav, date);
      }
    }
    
    console.log(`Successfully updated ${updatedCount} investments with latest NAV`);
    
    res.json({
      success: true,
      message: `Updated ${updatedCount} NAV records and ${investmentUpdatedCount} investments`,
      updatedCount: investmentUpdatedCount,
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

// Scheduled daily update
exports.scheduledNavUpdate = functions.pubsub
  .schedule('0 18 * * 1-5')
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    try {
      console.log('Starting scheduled NAV update...');
      
      const navData = await fetchNAVFromAMFI();
      
      const investmentsSnapshot = await db.collection('investments').get();
      
      let updatedCount = 0;
      const batch = db.batch();
      
      for (const investmentDoc of investmentsSnapshot.docs) {
        const investment = investmentDoc.data();
        const schemeCode = investment.schemeCode;
        
        if (schemeCode && navData[schemeCode]) {
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
          
          // Update investment with latest NAV ← THIS IS KEY
          const investmentRef = db.collection('investments').doc(investmentDoc.id);
          batch.update(investmentRef, {
            currentNAV: nav,
            currentNAVDate: date,
            navLastUpdated: admin.firestore.FieldValue.serverTimestamp()
          });
          
          updatedCount++;
          
          // Store history
          await storeNavHistory(schemeCode, schemeName, nav, date);
        }
      }
      
      await batch.commit();
      console.log(`Scheduled update completed: ${updatedCount} investments updated`);
      
      return null;
    } catch (error) {
      console.error('Error in scheduled NAV update:', error);
      return null;
    }
  });
