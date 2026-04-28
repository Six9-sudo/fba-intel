const { getReferralRate, getFulfillmentFee, getStorageCost } = require("./fbaFees");

/**
 * calculateProfit
 * 
 * @param {Object} input
 * @param {number} input.buyCost          - Cost to purchase 1 unit (USD)
 * @param {number} input.sellPrice        - Amazon selling price (USD)
 * @param {string} input.category         - Product category (e.g. "beauty")
 * @param {number} input.weightOz         - Product weight in oz (default 8)
 * @param {number} input.shippingToFBA    - Shipping cost per unit to warehouse (default 0.50)
 * @param {number} input.prepCost         - Prep/labelling cost per unit (default 0.30)
 * @param {number} input.storageCubicFt   - Product cubic feet (default 0.1)
 * @param {boolean} input.isPeakSeason    - Oct-Dec peak storage? (default false)
 * @param {number} input.monthsStorage    - Avg months in storage (default 1)
 * @param {number} input.targetUnits      - How many units to calculate for (default 100)
 * 
 * @returns {Object} Full profit breakdown
 */
function calculateProfit(input) {
  const {
    buyCost,
    sellPrice,
    category        = "default",
    weightOz        = 8,
    shippingToFBA   = 0.50,
    prepCost        = 0.30,
    storageCubicFt  = 0.10,
    isPeakSeason    = false,
    monthsStorage   = 1,
    targetUnits     = 100,
  } = input;

  // Validate required inputs
  if (!buyCost || buyCost <= 0)    throw new Error("buyCost must be a positive number");
  if (!sellPrice || sellPrice <= 0) throw new Error("sellPrice must be a positive number");
  if (sellPrice <= buyCost)         throw new Error("sellPrice should be higher than buyCost");

  // --- Fee Calculations ---
  const referralRate    = getReferralRate(category);
  const referralFee     = parseFloat((sellPrice * referralRate).toFixed(2));
  const fulfillmentFee  = getFulfillmentFee(weightOz);
  const storagePerUnit  = parseFloat(
    (getStorageCost(storageCubicFt, isPeakSeason) * monthsStorage).toFixed(2)
  );

  // --- Total Cost Per Unit ---
  const totalCostPerUnit = parseFloat((
    buyCost +
    shippingToFBA +
    prepCost +
    referralFee +
    fulfillmentFee +
    storagePerUnit
  ).toFixed(2));

  // --- Profit Metrics ---
  const netProfitPerUnit  = parseFloat((sellPrice - totalCostPerUnit).toFixed(2));
  const roi               = parseFloat(((netProfitPerUnit / buyCost) * 100).toFixed(1));
  const profitMarginPct   = parseFloat(((netProfitPerUnit / sellPrice) * 100).toFixed(1));
  const breakEvenUnits    = Math.ceil(0 / netProfitPerUnit) || 0; // future: fixed costs
  const totalProfit       = parseFloat((netProfitPerUnit * targetUnits).toFixed(2));
  const totalInvestment   = parseFloat((buyCost * targetUnits).toFixed(2));

  // --- Rating ---
  let rating, ratingColor;
  if (roi >= 50)                           { rating = "Excellent"; ratingColor = "green"; }
  else if (roi >= 30)                      { rating = "Good";      ratingColor = "blue"; }
  else if (roi >= 15)                      { rating = "Moderate";  ratingColor = "yellow"; }
  else if (netProfitPerUnit > 0)           { rating = "Low ROI";   ratingColor = "orange"; }
  else                                     { rating = "Loss";      ratingColor = "red"; }

  // --- Suggestions ---
  const suggestions = [];
  if (roi < 30)     suggestions.push("Consider negotiating a lower buy cost — target under $" + (sellPrice * 0.25).toFixed(2));
  if (roi < 0)      suggestions.push("This product loses money at current pricing. Raise sell price or cut buy cost.");
  if (referralFee > sellPrice * 0.15) suggestions.push("High referral fee category. Consider switching to a lower-fee category.");
  if (shippingToFBA > 1.00)          suggestions.push("Shipping to FBA is high. Look for closer prep centres or negotiate bulk shipping.");
  if (monthsStorage > 2)             suggestions.push("Long storage time increases costs. Aim for faster-turning inventory.");
  if (roi >= 40)    suggestions.push("Strong ROI! Consider scaling units — invest the full budget here.");

  return {
    summary: {
      sellPrice,
      netProfitPerUnit,
      roi,
      profitMarginPct,
      rating,
      ratingColor,
    },
    costBreakdown: {
      buyCost,
      shippingToFBA,
      prepCost,
      referralFee,
      fulfillmentFee,
      storagePerUnit,
      totalCostPerUnit,
    },
    feeDetails: {
      category,
      referralRate: `${(referralRate * 100).toFixed(0)}%`,
      weightOz,
      sizeTier: getSizeTier(weightOz),
    },
    projection: {
      targetUnits,
      totalInvestment,
      totalProfit,
      totalRevenue: parseFloat((sellPrice * targetUnits).toFixed(2)),
    },
    suggestions,
  };
}

function getSizeTier(weightOz) {
  if (weightOz <= 4)  return "Small Standard";
  if (weightOz <= 16) return "Large Standard";
  if (weightOz <= 96) return "Large Bulky";
  return "Extra Large";
}

module.exports = { calculateProfit };
