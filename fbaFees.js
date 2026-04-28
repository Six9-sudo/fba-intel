// Amazon FBA Fee Structure (2024-2025)
// Source: Amazon Seller Central FBA fee schedule

const REFERRAL_FEES = {
  beauty:         0.08,
  health:         0.08,
  grocery:        0.08,
  electronics:    0.08,
  clothing:       0.17,
  shoes:          0.15,
  toys:           0.15,
  sports:         0.15,
  home:           0.15,
  kitchen:        0.15,
  office:         0.15,
  tools:          0.15,
  automotive:     0.12,
  books:          0.15,
  default:        0.15,
};

// FBA Fulfillment fees by size tier (per unit, USD)
const FBA_FULFILLMENT_FEES = {
  small_standard:  2.47,  // up to 4oz
  large_standard1: 3.22,  // 4–8oz
  large_standard2: 3.40,  // 8–12oz
  large_standard3: 3.58,  // 12–16oz
  large_standard4: 4.61,  // 1–2lb
  large_bulky:     9.73,  // oversize small
  extra_large:    26.33,  // extra large
};

// Monthly storage fees per cubic foot (USD)
const STORAGE_FEES = {
  standard: { jan_sep: 0.78, oct_dec: 2.40 },
  oversize:  { jan_sep: 0.56, oct_dec: 1.40 },
};

// Returns referral fee rate for a category
function getReferralRate(category) {
  const key = category?.toLowerCase().trim();
  return REFERRAL_FEES[key] ?? REFERRAL_FEES.default;
}

// Returns FBA fulfillment fee based on weight (oz)
function getFulfillmentFee(weightOz) {
  const w = parseFloat(weightOz) || 8;
  if (w <= 4)  return FBA_FULFILLMENT_FEES.small_standard;
  if (w <= 8)  return FBA_FULFILLMENT_FEES.large_standard1;
  if (w <= 12) return FBA_FULFILLMENT_FEES.large_standard2;
  if (w <= 16) return FBA_FULFILLMENT_FEES.large_standard3;
  if (w <= 32) return FBA_FULFILLMENT_FEES.large_standard4;
  if (w <= 96) return FBA_FULFILLMENT_FEES.large_bulky;
  return FBA_FULFILLMENT_FEES.extra_large;
}

// Returns monthly storage cost per unit
function getStorageCost(cubicFeet, isPeak = false, isOversize = false) {
  const tier   = isOversize ? STORAGE_FEES.oversize : STORAGE_FEES.standard;
  const rate   = isPeak ? tier.oct_dec : tier.jan_sep;
  return parseFloat((cubicFeet * rate).toFixed(4));
}

module.exports = { getReferralRate, getFulfillmentFee, getStorageCost };
