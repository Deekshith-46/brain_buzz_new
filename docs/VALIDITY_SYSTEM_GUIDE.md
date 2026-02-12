# Validity System Guide

## Overview
This guide explains how to use the new enum-based validity system for Online Courses and Test Series, and how to update existing data.

## Validity Options

The system now uses strict enum values instead of custom duration entries. Available options:

### Standard Validity Periods
- `1_MONTH` - 30 days
- `2_MONTHS` - 60 days
- `3_MONTHS` - 90 days
- `4_MONTHS` - 120 days
- `5_MONTHS` - 150 days
- `6_MONTHS` - 180 days
- `1_YEAR` - 365 days
- `2_YEARS` - 730 days
- `5_YEARS` - 1825 days

### Special Option
- `UNLIMITED` - No expiry date

## API Usage

### 1. Creating a Course with Validity

**POST** `/api/admin/courses`

```json
{
  "name": "Complete JavaScript Course",
  "description": "Learn JavaScript from basics to advanced",
  "categoryIds": ["5f8d0d55b54764421b7156c1"],
  "subCategoryIds": ["5f8d0d55b54764421b7156c2"],
  "languageIds": ["5f8d0d55b54764421b7156c3"],
  "originalPrice": 2999,
  "discountPrice": 1999,
  "validity": "1_YEAR",  // ← Use enum value here
  "thumbnail": "file_upload_data"
}
```

### 2. Creating a Test Series with Validity

**POST** `/api/admin/test-series`

```json
{
  "name": "JEE Main Mock Tests",
  "description": "Complete JEE Main preparation tests",
  "categoryIds": ["5f8d0d55b54764421b7156c1"],
  "subCategoryIds": ["5f8d0d55b54764421b7156c2"],
  "language": ["5f8d0d55b54764421b7156c3"],
  "noOfTests": 30,
  "originalPrice": 1999,
  "discountPrice": 999,
  "validity": "6_MONTHS",  // ← Use enum value here
  "thumbnail": "file_upload_data"
}
```

### 3. Creating a Publication (No Validity)

**POST** `/api/admin/publications`

```json
{
  "name": "Physics Formula Handbook",
  "description": "Complete physics formulas collection",
  "categoryIds": ["5f8d0d55b54764421b7156c1"],
  "subCategoryIds": ["5f8d0d55b54764421b7156c2"],
  "languageIds": ["5f8d0d55b54764421b7156c3"],
  "originalPrice": 499,
  "discountValue": 200,
  "discountType": "fixed",
  "availableIn": "DIGITAL"
}
```

> **Note**: Publications provide permanent access and do not support validity-based pricing.

### 4. Updating Existing Items

**PATCH** `/api/admin/courses/{id}`

```json
{
  "validity": "1_YEAR"  // ← Update to new enum value
}
```

**PATCH** `/api/admin/test-series/{id}`

```json
{
  "validity": "UNLIMITED"  // ← Can be updated to any valid enum
}
```

## Admin Panel Usage

### For New Items:
1. When creating courses/test series/publications, select validity from dropdown
2. Available options: 1 Month, 2 Months, 3 Months, 4 Months, 5 Months, 6 Months, 1 Year, 2 Years, 5 Years, Unlimited
3. The system automatically calculates expiry dates based on selection

### For Existing Items:
1. Go to edit existing course/test series/publication
2. Change the validity dropdown to desired value
3. Save changes

## Migration Process

### Step 1: Run Migration Script

```bash
# Start MongoDB server first
net start MongoDB  # Windows
# OR
mongod            # Linux/Mac

# Run migration
node utils/migrateValidityEnums.js
```

### Step 2: What the Migration Does

The migration script:
- Converts all existing `validities` arrays to single `validity` enum
- Converts ObjectId references to enum strings
- Sets default value `1_YEAR` for all existing items
- Logs all conversions for review

**Sample Output:**
```
Starting validity enum migration...
Connected to MongoDB

Migrating Courses...
Course JavaScript Basics: Converted validities array to 1_YEAR
Course Python Fundamentals: Converted validities array to 1_YEAR
Updated 45 courses

Migrating TestSeries...
TestSeries JEE Mocks: Converted ObjectId validity to 1_YEAR
TestSeries NEET Practice: Converted ObjectId validity to 1_YEAR
Updated 23 test series

Migrating Publications...
Publication Math Handbook: Converted validities array to 1_YEAR
Updated 12 publications

Migration completed successfully!
Total documents updated: 80

⚠️  IMPORTANT: All existing validity data has been converted to default values.
   Please review and manually update any documents that need specific validity periods.
   Default validity used: 1_YEAR
```

### Step 3: Manual Review and Update

After migration, review items in admin panel:

1. **Check All Courses** - Review each course's validity period
2. **Update as Needed** - Change from default 1_YEAR to appropriate values
3. **Test Series** - Similarly review and update test series
4. **Publications** - Update publication validity periods

### Common Update Patterns:

```javascript
// Courses that were 6 months should be updated to:
validity: "6_MONTHS"

// Courses that were 1 year (default) can stay as:
validity: "1_YEAR"

// Unlimited access items should be:
validity: "UNLIMITED"

// Short term courses (1-3 months):
validity: "1_MONTH"  // or "2_MONTHS", "3_MONTHS"
```

## Database Schema Changes

### Before (Old Schema):
```javascript
// Course Schema
{
  name: String,
  validities: [{ type: ObjectId, ref: 'ValidityOption' }]  // Array of references
}

// TestSeries Schema  
{
  name: String,
  validity: { type: ObjectId, ref: 'ValidityOption' }     // Single reference
}

// Publication Schema
{
  name: String,
  validities: [{ type: ObjectId, ref: 'ValidityOption' }] // Array of references
}
```

### After (New Schema):
```javascript
// Courses and TestSeries use:
{
  name: String,
  validity: {
    type: String,
    enum: ['1_MONTH', '2_MONTHS', '3_MONTHS', '4_MONTHS', '5_MONTHS', 
           '6_MONTHS', '1_YEAR', '2_YEARS', '5_YEARS', 'UNLIMITED'],
    required: true
  }
}

// Publications use simple pricing (no validity):
{
  name: String,
  originalPrice: Number,
  discountValue: Number,
  discountType: { type: String, enum: ['fixed', 'percentage'] }
  // No validity field - provides permanent access
}
```

## Validity Calculation Logic

### Automatic Expiry Date Calculation:
- When user purchases content, system uses `calculateExpiryDate(validityLabel)`
- For `1_MONTH`: Current date + 30 days
- For `6_MONTHS`: Current date + 180 days  
- For `UNLIMITED`: Returns `null` (no expiry)

### Access Validation:
- System checks `purchase.expiryDate > new Date()`
- For UNLIMITED validity: `purchase.expiryDate === null` (always valid)
- Backend automatically handles all calculations

## Troubleshooting

### 1. Invalid Validity Error
```
Error: Invalid validity. Must be one of: 1_MONTH, 2_MONTHS, ...
```
**Solution**: Ensure you're using exact enum values from the list above.

### 2. Migration Shows No Documents
**Check**: Make sure MongoDB is running and connection string is correct.

### 3. Items Showing 1 Year After Migration
**Expected**: This is default behavior. Manually update to correct values.

### 4. API Returns Validation Error
**Verify**: 
- Validity field is included in request
- Value matches exact enum format (uppercase with underscores)
- No trailing spaces

## Best Practices

### 1. For Course Creators:
- Use longer validity (1-2 years) for comprehensive courses
- Use shorter validity (1-6 months) for exam-specific content
- Use UNLIMITED for reference materials and handbooks

### 2. For Test Series:
- Match validity to exam cycle (6 months for semester exams)
- Use 1 year for annual competitive exams
- Consider UNLIMITED for practice banks

### 3. For Publications:
- Provide permanent access (no expiry)
- Use simple pricing: originalPrice + discountValue
- No validity selection needed
- Perfect for reference materials and ownership-based content

## Example Workflows

### Creating New Paid Course:
1. Admin goes to Course Creation Form
2. Fills basic details (name, description, category)
3. Uploads thumbnail and curriculum
4. Sets price (original: ₹2999, discount: ₹1999)
5. **Selects Validity**: "1 Year" from dropdown
6. Publishes course
7. Users see automatic expiry date on purchase

### Updating Existing Course:
1. Admin goes to Courses list
2. Finds course needing validity update
3. Clicks "Edit"
4. Changes Validity dropdown from "1 Year" to "6 Months" 
5. Saves changes
6. Course now has different expiry calculation for future purchases

This guide covers everything needed to successfully use and maintain the new validity system. All backend calculations are handled automatically - admin only needs to select appropriate enum values.