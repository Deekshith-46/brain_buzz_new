# Complete Admin Validity System Code Documentation

This document contains all the validity-related code from the admin side of the Brain Buzz backend system.

## Table of Contents
1. [Database Models](#database-models)
2. [Admin Controllers](#admin-controllers)
3. [Admin Routes](#admin-routes)
4. [Usage Examples](#usage-examples)

---

## Database Models

### 1. Validity Option Model

**File:** `src/models/Course/ValidityOption.js`

```javascript
const mongoose = require('mongoose');

const validityOptionSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    durationInDays: {
      type: Number,
      required: true,
      min: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ValidityOption', validityOptionSchema);
```

### 2. Course Model (Validity Section)

**File:** `src/models/Course/Course.js` (partial)

```javascript
const courseSchema = new mongoose.Schema(
  {
    // ... other fields ...
    validities: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ValidityOption',
      },
    ],
    // ... other fields ...
  },
  {
    timestamps: true,
  }
);
```

### 3. Test Series Model (Validity Section)

**File:** `src/models/TestSeries/TestSeries.js` (partial)

```javascript
const testSeriesSchema = new Schema(
  {
    // ... other fields ...
    validity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ValidityOption',
    },
    // ... other fields ...
  },
  {
    timestamps: true,
  }
);
```

---

## Admin Controllers

### 1. Validity Controller

**File:** `src/controllers/Admin/validityController.js`

```javascript
const ValidityOption = require('../../models/Course/ValidityOption');

exports.createValidity = async (req, res) => {
  try {
    const { label, durationInDays, isActive } = req.body;

    if (!label || !durationInDays) {
      return res.status(400).json({ message: 'Label and durationInDays are required' });
    }

    const existing = await ValidityOption.findOne({ label: label.trim() });
    if (existing) {
      return res.status(400).json({ message: 'Validity with this label already exists' });
    }

    const validity = await ValidityOption.create({ label, durationInDays, isActive });

    return res.status(201).json({
      message: 'Validity created successfully',
      data: validity,
    });
  } catch (error) {
    console.error('Error creating validity:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getValidities = async (req, res) => {
  try {
    const validities = await ValidityOption.find();
    return res.status(200).json({ data: validities });
  } catch (error) {
    console.error('Error fetching validities:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getValidityById = async (req, res) => {
  try {
    const { id } = req.params;

    const validity = await ValidityOption.findById(id);
    if (!validity) {
      return res.status(404).json({ message: 'Validity not found' });
    }

    return res.status(200).json({ data: validity });
  } catch (error) {
    console.error('Error fetching validity:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateValidity = async (req, res) => {
  try {
    const { id } = req.params;
    const { label, durationInDays, isActive } = req.body;

    const updates = { durationInDays, isActive };

    if (label) {
      const existing = await ValidityOption.findOne({ label: label.trim(), _id: { $ne: id } });
      if (existing) {
        return res.status(400).json({ message: 'Validity with this label already exists' });
      }
      updates.label = label;
    }

    const validity = await ValidityOption.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!validity) {
      return res.status(404).json({ message: 'Validity not found' });
    }

    return res.status(200).json({
      message: 'Validity updated successfully',
      data: validity,
    });
  } catch (error) {
    console.error('Error updating validity:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteValidity = async (req, res) => {
  try {
    const { id } = req.params;

    const validity = await ValidityOption.findByIdAndDelete(id);
    if (!validity) {
      return res.status(404).json({ message: 'Validity not found' });
    }

    return res.status(200).json({ message: 'Validity deleted successfully' });
  } catch (error) {
    console.error('Error deleting validity:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
```

### 2. Test Series Controller (Validity Integration)

**File:** `src/controllers/Admin/testSeriesController.js` (partial - showing validity usage)

```javascript
// In createTestSeries function
const series = await TestSeries.create({
  name,
  noOfTests,
  description,
  thumbnail,
  originalPrice: Number(originalPrice),
  discount: discountData,
  languages: language && language !== 'null' && language !== 'undefined' ? language : undefined,
  validity: validity && validity !== 'null' && validity !== 'undefined' ? validity : undefined,
  accessType: "PAID"
});

// In getTestSeriesById function
const series = await TestSeries.findById(id)
  .populate('categories', 'name slug')
  .populate('subCategories', 'name slug')
  .populate('languages', 'name code')
  .populate('validity', 'label durationInDays');

// In updateTestSeries function
await series.populate([
  { path: 'categories', select: 'name slug' },
  { path: 'subCategories', select: 'name slug' },
  { path: 'languages', select: 'name code' },
  { path: 'validity', select: 'label durationInDays' }
]);
```

### 3. Course Controller (Validity Integration)

**File:** `src/controllers/Admin/courseController.js` (partial - showing validity usage)

```javascript
// In createFullCourse function
const course = await Course.create({
  contentType,
  name,
  courseType,
  startDate: startDate ? new Date(startDate) : null,
  categories: categoryIds,
  subCategories: subCategoryIds,
  languages: languageIds,
  validities: validityIds,
  thumbnailUrl,
  originalPrice: parseFloat(originalPrice),
  discountPrice: discountPrice ? parseFloat(discountPrice) : 0,
  pricingNote,
  shortDescription,
  detailedDescription,
  tutors,
  classes,
  studyMaterials,
  isActive: true,
});

// In updateCourse function
if (validityIds) updates.validities = validityIds;

const course = await Course.findByIdAndUpdate(id, updates, {
  new: true,
  runValidators: true,
})
  .populate('categories', 'name slug')
  .populate('subCategories', 'name slug')
  .populate('languages', 'name code')
  .populate('validities', 'label durationInDays');
```

---

## Admin Routes

### 1. Validity Routes

**File:** `src/routes/Admin/validityRoutes.js`

```javascript
const express = require('express');
const {
  createValidity,
  getValidities,
  getValidityById,
  updateValidity,
  deleteValidity,
} = require('../../controllers/Admin/validityController');
const adminAuthMiddleware = require('../../middlewares/Admin/authMiddleware');

const router = express.Router();

router.use(adminAuthMiddleware);

router.post('/', createValidity);
router.get('/', getValidities);
router.get('/:id', getValidityById);
router.put('/:id', updateValidity);
router.delete('/:id', deleteValidity);

module.exports = router;
```

### 2. Test Series Routes (Validity Integration)

**File:** `src/routes/Admin/testSeriesRoutes.js` (partial)

```javascript
// Routes that handle test series with validity
router.post('/', upload.fields([
  { name: 'thumbnail', maxCount: 1 }
]), createTestSeries);

router.get('/', getAllTestSeries);
router.get('/:id', getTestSeriesById);
router.put('/:id', updateTestSeries);
router.delete('/:id', deleteTestSeries);
```

### 3. Course Routes (Validity Integration)

**File:** `src/routes/Admin/courseRoutes.js` (partial)

```javascript
// Routes that handle courses with validities
router.post('/', upload.fields([
  { name: 'thumbnail', maxCount: 1 }
]), createFullCourse);

router.put('/:id', updateCourse);
router.get('/:id', getCourseById);
```

---

## Usage Examples

### 1. Creating a Validity Option

**Endpoint:** `POST /api/admin/validities`

**Request Body:**
```json
{
  "label": "3 Months",
  "durationInDays": 90,
  "isActive": true
}
```

**Response:**
```json
{
  "message": "Validity created successfully",
  "data": {
    "_id": "67890abcdef1234567890123",
    "label": "3 Months",
    "durationInDays": 90,
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 2. Getting All Validity Options

**Endpoint:** `GET /api/admin/validities`

**Response:**
```json
{
  "data": [
    {
      "_id": "67890abcdef1234567890123",
      "label": "1 Month",
      "durationInDays": 30,
      "isActive": true
    },
    {
      "_id": "67890abcdef1234567890124",
      "label": "3 Months",
      "durationInDays": 90,
      "isActive": true
    },
    {
      "_id": "67890abcdef1234567890125",
      "label": "6 Months",
      "durationInDays": 180,
      "isActive": true
    },
    {
      "_id": "67890abcdef1234567890126",
      "label": "1 Year",
      "durationInDays": 365,
      "isActive": true
    }
  ]
}
```

### 3. Updating a Validity Option

**Endpoint:** `PUT /api/admin/validities/67890abcdef1234567890123`

**Request Body:**
```json
{
  "label": "2 Months",
  "durationInDays": 60,
  "isActive": true
}
```

**Response:**
```json
{
  "message": "Validity updated successfully",
  "data": {
    "_id": "67890abcdef1234567890123",
    "label": "2 Months",
    "durationInDays": 60,
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T11:45:00.000Z"
  }
}
```

### 4. Creating a Test Series with Validity

**Endpoint:** `POST /api/admin/test-series`

**Request Body:**
```json
{
  "name": "UPSC Prelims 2024 Mock Test Series",
  "noOfTests": 10,
  "description": "Complete mock test series for UPSC Prelims 2024",
  "originalPrice": 1999,
  "validity": "67890abcdef1234567890125", // Reference to ValidityOption ID
  "accessType": "PAID"
}
```

### 5. Creating a Course with Validities

**Endpoint:** `POST /api/admin/courses`

**Request Body:**
```json
{
  "name": "Complete UPSC Foundation Course",
  "courseType": "Foundation",
  "originalPrice": 4999,
  "validities": [
    "67890abcdef1234567890124", // 3 Months
    "67890abcdef1234567890125", // 6 Months
    "67890abcdef1234567890126"  // 1 Year
  ],
  "accessType": "PAID"
}
```

### 6. Getting Test Series with Validity Details

**Endpoint:** `GET /api/admin/test-series/67890abcdef1234567890127`

**Response:**
```json
{
  "data": {
    "_id": "67890abcdef1234567890127",
    "name": "UPSC Prelims 2024 Mock Test Series",
    "description": "Complete mock test series for UPSC Prelims 2024",
    "originalPrice": 1999,
    "validity": {
      "_id": "67890abcdef1234567890125",
      "label": "6 Months",
      "durationInDays": 180
    },
    "accessType": "PAID",
    "isActive": true
  }
}
```

### 7. Getting Course with Validity Details

**Endpoint:** `GET /api/admin/courses/67890abcdef1234567890128`

**Response:**
```json
{
  "data": {
    "_id": "67890abcdef1234567890128",
    "name": "Complete UPSC Foundation Course",
    "courseType": "Foundation",
    "originalPrice": 4999,
    "validities": [
      {
        "_id": "67890abcdef1234567890124",
        "label": "3 Months",
        "durationInDays": 90
      },
      {
        "_id": "67890abcdef1234567890125",
        "label": "6 Months",
        "durationInDays": 180
      },
      {
        "_id": "67890abcdef1234567890126",
        "label": "1 Year",
        "durationInDays": 365
      }
    ],
    "accessType": "PAID",
    "isActive": true
  }
}
```

---

## Validity System Workflow

### 1. Validity Creation Process
1. Admin creates validity options through the admin panel
2. Validity options are stored in the ValidityOption collection
3. Each validity has a label, duration in days, and active status

### 2. Course/Test Series Assignment
1. When creating/updating courses or test series, admin selects from existing validity options
2. Courses can have multiple validity options (array reference)
3. Test series typically have one validity option (single reference)

### 3. Purchase Integration
1. During purchase, the system retrieves validity duration from the purchased items
2. Expiry date is calculated based on the validity duration
3. For multiple items, the maximum validity period is used

### 4. Access Validation
1. System checks if user has purchased the item
2. Verifies purchase status is 'completed'
3. Ensures current date is before expiry date
4. Grants or denies access based on validation

---

## Error Handling

### Common Validity Errors:

1. **Missing Required Fields**
   ```json
   {
     "message": "Label and durationInDays are required"
   }
   ```

2. **Duplicate Validity Label**
   ```json
   {
     "message": "Validity with this label already exists"
   }
   ```

3. **Validity Not Found**
   ```json
   {
     "message": "Validity not found"
   }
   ```

4. **Invalid Duration**
   ```json
   {
     "message": "durationInDays must be at least 1"
   }
   ```

---

## Best Practices

1. **Validity Naming**: Use clear, descriptive labels (e.g., "3 Months", "6 Months", "1 Year")
2. **Duration Consistency**: Maintain consistent duration values across similar validity options
3. **Active Status Management**: Deactivate rather than delete validity options to maintain data integrity
4. **Testing**: Always test validity assignments with sample purchases before going live
5. **Documentation**: Keep documentation updated when adding new validity options
