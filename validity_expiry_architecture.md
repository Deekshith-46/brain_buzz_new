# Validity-Based Expiry System - Final Architecture

## 🏗️ SYSTEM ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER REQUEST FLOW                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    1. PURCHASE INITIATION                        │
│  POST /api/users/orders/create                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ items: [{                                                   ││
│  │   itemType: "online_course",                               ││
│  │   itemId: "698c9e4949bcce2be56c5d70",                      ││
│  │   validity: "1_MONTH"         ← USER SELECTED VALIDITY     ││
│  │ }]                                                          ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    2. PAYMENT PROCESSING                         │
│  POST /api/users/payments/verify                                │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ computePurchaseExpiry([item], purchaseDate)                 ││
│  │   ↓                                                         ││
│  │ calculateExpiryDate("1_MONTH", purchaseDate)                ││
│  │   ↓                                                         ││
│  │ return purchaseDate + 30 days                               ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    3. PURCHASE RECORD CREATION                   │
│  Purchase Collection                                            │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ {                                                           ││
│  │   user: ObjectId("..."),                                   ││
│  │   items: [{                                                ││
│  │     itemType: "online_course",                             ││
│  │     itemId: ObjectId("698c9e4949bcce2be56c5d70"),          ││
│  │     validity: "1_MONTH",     ← LOCKED IN AT PURCHASE      ││
│  │     pricing: {                                             ││
│  │       originalPrice: 10000,                                ││
│  │       discountPrice: 2000,                                 ││
│  │       finalPrice: 8000                                     ││
│  │     }                                                      ││
│  │   }],                                                      ││
│  │   expiryDate: ISODate("2026-03-13T15:23:28.021Z"),         ││
│  │   status: "completed"                                      ││
│  │ }                                                           ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    4. RUNTIME ACCESS CHECK                       │
│  Middleware Pipeline                                            │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ validatePurchaseAccess(purchase, currentDate)               ││
│  │   ├─ IF purchase.expiryDate === null → UNLIMITED ACCESS    ││
│  │   ├─ IF currentDate < expiryDate → VALID ACCESS            ││
│  │   └─ IF currentDate >= expiryDate → EXPIRED ACCESS         ││
│  │                                                             ││
│  │ Returns: {                                                  ││
│  │   hasAccess: true/false,                                   ││
│  │   isValid: true/false,                                     ││
│  │   reason: "Valid access - 30 days remaining",              ││
│  │   isUnlimited: false,                                      ││
│  │   daysRemaining: 30                                        ││
│  │ }                                                           ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    5. USER EXPERIENCE                            │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ BEFORE EXPIRY (Feb 11 - Mar 12):                           ││
│  │   hasAccess: true                                          ││
│  │   isPurchaseValid: true                                    ││
│  │   classes unlocked: All paid content accessible            ││
│  │                                                            ││
│  │ AFTER EXPIRY (Mar 13+):                                    ││
│  │   hasAccess: false                                         ││
│  │   isPurchaseValid: false                                   ││
│  │   classes locked: Paid content inaccessible                ││
│  │   only first 2 free classes remain                         ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘

## 🔧 CORE COMPONENTS

### 1. VALIDITY CONSTANTS (src/constants/validityMap.js)
```javascript
const VALIDITY_LABELS = [
  '1_MONTH', '2_MONTHS', '3_MONTHS', '6_MONTHS', 
  '1_YEAR', '2_YEARS', '5_YEARS', 'UNLIMITED'
];

const VALIDITY_MAP = {
  '1_MONTH': 30,      // FIXED: Exactly 30 days
  '1_YEAR': 365,      // FIXED: Exactly 365 days  
  'UNLIMITED': null   // SPECIAL: Never expires
};
```

### 2. EXPIRY UTILITIES (src/utils/expiryUtils.js)
```javascript
// SINGLE SOURCE OF TRUTH
computePurchaseExpiry(items, purchaseDate) 
  → Uses user-selected validity from purchase items

// CENTRALIZED CALCULATION  
calculateExpiryDate(validityLabel, startDate)
  → Enforces exact day-based calculation

// RUNTIME VALIDATION
validatePurchaseAccess(purchase, currentDate)
  → Detailed access decision with reasons
```

### 3. ACCESS MIDDLEWARE
- `checkCourseAccess` - Course-level validation
- `TestSeriesAccessService` - Test series validation  
- `PurchaseService.hasAccess` - Generic access checking

## ⚡ KEY GUARANTEES

### ✅ EXACT TIMING
- 1 month = exactly 30 days (not calendar months)
- Calculated from purchase date, not current date
- Millisecond-precise expiry timestamps

### ✅ USER PROTECTION  
- Validity locked at purchase time
- Admin changes don't affect existing purchases
- Unlimited validity never expires

### ✅ CONSISTENT BEHAVIOR
- Same logic for courses and test series
- Real-time access validation
- Automatic expiry enforcement

### ✅ BACKWARD COMPATIBILITY
- Legacy `validity` fields still work
- Existing purchases unaffected
- Gradual migration supported

## 🛡️ SAFETY FEATURES

1. **Input Validation**: `isValidityLabel()` prevents invalid validity values
2. **Null Safety**: Explicit handling of `null` expiry dates for unlimited
3. **Type Safety**: Strict typing in all utility functions
4. **Error Handling**: Graceful fallbacks and detailed error messages
5. **Audit Trail**: Purchase records store selected validity permanently

## 📊 DATA FLOW EXAMPLE

```
USER ACTION: Purchase 1-month course on Feb 11, 2026

1. Request: { validity: "1_MONTH" }
2. Processing: calculateExpiryDate("1_MONTH", "2026-02-11T15:23:28Z")
3. Storage: expiryDate = "2026-03-13T15:23:28Z" (locked)
4. Access Check (Feb 28): validatePurchaseAccess(purchase, "2026-02-28")
   → Result: { hasAccess: true, daysRemaining: 13 }
5. Access Check (Apr 1): validatePurchaseAccess(purchase, "2026-04-01")  
   → Result: { hasAccess: false, reason: "Access expired 19 days ago" }
```

This architecture ensures your expiry system is **production-grade**, **audit-safe**, and **mathematically precise**.