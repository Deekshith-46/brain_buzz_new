// src/constants/validityMap.js
// Fixed enum-based validity system constants

// Fixed validity labels that admins can select from
const VALIDITY_LABELS = [
  '1_MONTH',
  '2_MONTHS',
  '3_MONTHS',
  '4_MONTHS',
  '5_MONTHS',
  '6_MONTHS',
  '1_YEAR',
  '2_YEARS',
  '5_YEARS',
  'UNLIMITED'
];

// Mapping from validity labels to days (null for UNLIMITED)
const VALIDITY_MAP = {
  '1_MONTH': 30,
  '2_MONTHS': 60,
  '3_MONTHS': 90,
  '4_MONTHS': 120,
  '5_MONTHS': 150,
  '6_MONTHS': 180,
  '1_YEAR': 365,
  '2_YEARS': 730,
  '5_YEARS': 1825,
  'UNLIMITED': null
};

// Human-readable display names for admin UI
const VALIDITY_DISPLAY_NAMES = {
  '1_MONTH': '1 Month',
  '2_MONTHS': '2 Months',
  '3_MONTHS': '3 Months',
  '4_MONTHS': '4 Months',
  '5_MONTHS': '5 Months',
  '6_MONTHS': '6 Months',
  '1_YEAR': '1 Year',
  '2_YEARS': '2 Years',
  '5_YEARS': '5 Years',
  'UNLIMITED': 'Unlimited'
};

module.exports = {
  VALIDITY_LABELS,
  VALIDITY_MAP,
  VALIDITY_DISPLAY_NAMES
};