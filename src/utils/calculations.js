// src/utils/calculations.js - Uses stored NAV from Firebase
// All investment calculations and metrics

// Calculate days between two dates
export const calculateDaysBetween = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Calculate all metrics for an investment
export const calculateMetrics = (investment) => {
  const {
    fundName,
    buyDate,
    buyNAV,
    quantity,
    buyTotalAmount,
    sellDate,
    sellNAV,
    sellQuantity,
    sellTotalAmount,
    currentNAV, // Stored from Firebase (updated daily)
    currentNAVDate,
  } = investment;

  // Use stored current NAV or fallback to buy NAV with estimate
  const navToUse = currentNAV || parseFloat(buyNAV) * 1.05; // 5% estimate if no NAV
  const navDate = currentNAVDate || new Date().toISOString().split("T")[0];

  // Calculate holding period
  const holdingPeriodDays = calculateDaysBetween(buyDate, sellDate || null);

  // Determine the holding period requirement based on fund type
  const requiredHoldingDays = fundName.includes("ELSS") ? 1095 : 365; // 3 years = 1095 days, 1 year = 365 days

  // Check if eligible for LTCG
  const eligibleForLTCG =
    holdingPeriodDays >= requiredHoldingDays ? "Yes" : "No";

  // Calculate profit/loss
  let netProfitLoss, finalValue;
  if (sellDate && sellTotalAmount) {
    // Sold investment
    finalValue = parseFloat(sellTotalAmount);
    netProfitLoss = finalValue - parseFloat(buyTotalAmount);
  } else {
    // Current holding
    finalValue = navToUse * parseFloat(quantity);
    netProfitLoss = finalValue - parseFloat(buyTotalAmount);
  }

  // Calculate percentage return
  const netProfitLossPercent =
    (netProfitLoss / parseFloat(buyTotalAmount)) * 100;

  // Calculate CAGR - Fixed version
  const years = holdingPeriodDays / 365;
  let cagr = 0;

  if (years > 0 && parseFloat(buyTotalAmount) > 0 && finalValue > 0) {
    const ratio = finalValue / parseFloat(buyTotalAmount);

    if (ratio > 0 && ratio < 1000 && years > 0.01) {
      cagr = (Math.pow(ratio, 1 / years) - 1) * 100;

      // Cap extreme values
      if (cagr > 1000) cagr = 1000;
      if (cagr < -100) cagr = -100;
    } else if (years < 0.01) {
      cagr = netProfitLossPercent;
    }
  }

  // Decision to sell
  let decisionToSell;
  if (sellDate) {
    decisionToSell = "Already Sold";
  } else if (eligibleForLTCG === "Yes" && navToUse >= buyNAV * 1.1) {
    decisionToSell = "You can Sell";
  } else {
    decisionToSell = "Hold";
  }

  return {
    ...investment,
    currentNAV: navToUse,
    currentNAVDate: navDate,
    holdingPeriodDays,
    eligibleForLTCG,
    netProfitLoss: parseFloat(netProfitLoss.toFixed(2)),
    netProfitLossPercent: parseFloat(netProfitLossPercent.toFixed(2)),
    cagr: parseFloat(cagr.toFixed(2)),
    decisionToSell,
    finalValue: parseFloat(finalValue.toFixed(2)),
  };
};

// Calculate fund-level aggregations
export const calculateFundMetrics = (investments) => {
  const fundGroups = {};

  investments.forEach((inv) => {
    const metrics = calculateMetrics(inv);
    const fundName = inv.fundName;

    if (!fundGroups[fundName]) {
      fundGroups[fundName] = {
        fundName,
        investments: [],
        totalInvestment: 0,
        currentValue: 0,
        totalProfitLoss: 0,
        holdingsCount: 0,
        ltcgEligibleCount: 0,
        soldCount: 0,
      };
    }

    fundGroups[fundName].investments.push(metrics);
    fundGroups[fundName].totalInvestment += parseFloat(inv.buyTotalAmount);
    fundGroups[fundName].currentValue += metrics.finalValue;
    fundGroups[fundName].totalProfitLoss += metrics.netProfitLoss;
    fundGroups[fundName].holdingsCount += 1;

    if (metrics.eligibleForLTCG === "Yes") {
      fundGroups[fundName].ltcgEligibleCount += 1;
    }

    if (inv.sellDate) {
      fundGroups[fundName].soldCount += 1;
    }
  });

  // Calculate percentages and CAGR for each fund
  Object.values(fundGroups).forEach((fund) => {
    fund.totalReturnPercent =
      (fund.totalProfitLoss / fund.totalInvestment) * 100;

    // Weighted average CAGR
    let totalWeightedCAGR = 0;
    fund.investments.forEach((inv) => {
      const weight = parseFloat(inv.buyTotalAmount) / fund.totalInvestment;
      totalWeightedCAGR += inv.cagr * weight;
    });
    fund.avgCAGR = totalWeightedCAGR;
  });

  return Object.values(fundGroups);
};

// Calculate portfolio-level metrics
export const calculatePortfolioMetrics = (investments) => {
  if (!investments || investments.length === 0) {
    return {
      totalInvestment: 0,
      currentValue: 0,
      totalProfitLoss: 0,
      totalReturnPercent: 0,
      totalHoldings: 0,
      ltcgEligibleCount: 0,
    };
  }

  const metricsArray = investments.map(calculateMetrics);

  const totalInvestment = metricsArray.reduce(
    (sum, inv) => sum + parseFloat(inv.buyTotalAmount),
    0
  );
  const currentValue = metricsArray.reduce(
    (sum, inv) => sum + inv.finalValue,
    0
  );
  const totalProfitLoss = currentValue - totalInvestment;
  const totalReturnPercent = (totalProfitLoss / totalInvestment) * 100;
  const ltcgEligibleCount = metricsArray.filter(
    (inv) => inv.eligibleForLTCG === "Yes"
  ).length;

  return {
    totalInvestment: parseFloat(totalInvestment.toFixed(2)),
    currentValue: parseFloat(currentValue.toFixed(2)),
    totalProfitLoss: parseFloat(totalProfitLoss.toFixed(2)),
    totalReturnPercent: parseFloat(totalReturnPercent.toFixed(2)),
    totalHoldings: investments.length,
    ltcgEligibleCount,
  };
};
