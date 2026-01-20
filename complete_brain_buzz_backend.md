# Brain Buzz Backend - Complete Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Core Models](#core-models)
3. [Admin Module Controllers](#admin-module-controllers)
4. [User Module Controllers](#user-module-controllers)
5. [Routes](#routes)
6. [Configuration](#configuration)
7. [Utilities & Middlewares](#utilities--middlewares)
8. [Services](#services)
9. [Main Application](#main-application)

---

## Project Overview

Brain Buzz is a comprehensive educational platform backend built with Node.js, Express, and MongoDB. The system includes:

- **Content Management**: Current Affairs, Daily Quizzes, Publications, Test Series, Online Courses, E-Books, PYQs
- **User Management**: Authentication, Authorization, Profile Management
- **Admin Panel**: Full CRUD operations for all content types
- **Payment Integration**: Order processing and payment handling
- **Filter System**: Multi-dimensional content filtering
- **Media Management**: Cloudinary integration for file uploads

---

## Core Models

### User Model
```javascript
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone: {
    type: String,
    trim: true
  },
  avatar: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
```

### Admin Model
```javascript
const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    default: 'admin'
  },
  permissions: [{
    type: String,
    enum: ['courses', 'current_affairs', 'users', 'orders', 'analytics']
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Admin', adminSchema);
```

### Course Model
```javascript
const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  contentType: {
    type: String,
    enum: ['ONLINE_COURSE', 'TEST_SERIES', 'CURRENT_AFFAIRS', 'PYQ', 'EBOOK'],
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  courseType: {
    type: String,
    enum: ['PREMIUM', 'FREE'],
    default: 'PREMIUM'
  },
  startDate: {
    type: Date
  },
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  subCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubCategory'
  }],
  languages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Language'
  }],
  validities: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ValidityOption'
  }],
  thumbnailUrl: {
    type: String
  },
  originalPrice: {
    type: Number,
    required: true
  },
  discountPrice: {
    type: Number
  },
  discountPercent: {
    type: Number
  },
  pricingNote: {
    type: String
  },
  shortDescription: {
    type: String,
    required: true
  },
  detailedDescription: {
    type: String
  },
  tutors: [{
    name: String,
    qualification: String,
    experience: String,
    photoUrl: String
  }],
  classes: [{
    title: String,
    description: String,
    duration: Number,
    thumbnailUrl: String,
    lecturePhotoUrl: String,
    videoUrl: String,
    isFree: {
      type: Boolean,
      default: false
    }
  }],
  studyMaterials: [{
    title: String,
    fileUrl: String
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Course', courseSchema);
```

### Order Model
```javascript
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    name: String,
    price: Number,
    quantity: {
      type: Number,
      default: 1
    }
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  finalAmount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['razorpay', 'paypal', 'stripe']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  status: {
    type: String,
    enum: ['created', 'processing', 'completed', 'cancelled'],
    default: 'created'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
```

### Test Series Model
```javascript
const mongoose = require('mongoose');

const testSeriesSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  thumbnailUrl: String,
  totalTests: {
    type: Number,
    default: 0
  },
  totalTime: {
    type: Number,
    default: 0
  },
  totalMarks: {
    type: Number,
    default: 0
  },
  negativeMarking: {
    type: Boolean,
    default: false
  },
  negativeMarkingValue: Number,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TestSeries', testSeriesSchema);
```

### Test Attempt Model
```javascript
const mongoose = require('mongoose');

const testAttemptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  testSeriesId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestSeries',
    required: true
  },
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: Date,
  submittedAt: Date,
  timeTaken: Number,
  totalQuestions: Number,
  attemptedQuestions: Number,
  correctAnswers: Number,
  wrongAnswers: Number,
  skippedQuestions: Number,
  totalMarks: Number,
  obtainedMarks: Number,
  percentage: Number,
  status: {
    type: String,
    enum: ['started', 'submitted', 'evaluated'],
    default: 'started'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TestAttempt', testAttemptSchema);
```

### Daily Quiz Model
```javascript
const mongoose = require('mongoose');

const dailyQuizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  date: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    default: 30 // minutes
  },
  totalMarks: {
    type: Number,
    default: 0
  },
  questions: [{
    question: String,
    options: [String],
    correctAnswer: Number,
    marks: {
      type: Number,
      default: 1
    },
    negativeMarks: Number
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DailyQuiz', dailyQuizSchema);
```

### EBook Model
```javascript
const mongoose = require('mongoose');

const eBookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  author: String,
  description: String,
  thumbnailUrl: String,
  fileUrl: {
    type: String,
    required: true
  },
  fileSize: Number,
  pageCount: Number,
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  subCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubCategory'
  }],
  languages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Language'
  }],
  price: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('EBook', eBookSchema);
```

### Publication Model
```javascript
const mongoose = require('mongoose');

const publicationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  logoUrl: String,
  website: String,
  contactEmail: String,
  contactPhone: String,
  address: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Publication', publicationSchema);
```

### PYQ Model
```javascript
const mongoose = require('mongoose');

const pyqSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  },
  fileUrl: {
    type: String,
    required: true
  },
  thumbnailUrl: String,
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  subCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubCategory'
  }],
  languages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Language'
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PreviousQuestionPaper', pyqSchema);
```

### Banner Model
```javascript
const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  redirectUrl: String,
  position: {
    type: Number,
    default: 0
  },
  contentType: {
    type: String,
    enum: ['COURSE', 'CURRENT_AFFAIRS', 'TEST_SERIES', 'EBOOK', 'PYQ', 'CUSTOM']
  },
  contentId: mongoose.Schema.Types.ObjectId,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Banner', bannerSchema);
```

### Coupon Model
```javascript
const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  discountValue: {
    type: Number,
    required: true
  },
  minimumOrderValue: Number,
  maximumDiscount: Number,
  usageLimit: Number,
  usedCount: {
    type: Number,
    default: 0
  },
  validFrom: {
    type: Date,
    required: true
  },
  validUntil: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Coupon', couponSchema);
```

### Language Model
```javascript
const mongoose = require('mongoose');

const languageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Language', languageSchema);
```

### Validity Option Model
```javascript
const mongoose = require('mongoose');

const validityOptionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true // in days
  },
  description: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ValidityOption', validityOptionSchema);
```

### Category Model
```javascript
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  thumbnailUrl: {
    type: String,
    trim: true
  },
  contentType: {
    type: String,
    enum: ['COURSE', 'CURRENT_AFFAIRS', 'PYQ', 'EBOOK'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Category', categorySchema);
```

### SubCategory Model
```javascript
const mongoose = require('mongoose');

const subCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  thumbnailUrl: {
    type: String,
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  contentType: {
    type: String,
    enum: ['COURSE', 'CURRENT_AFFAIRS', 'PYQ', 'EBOOK'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SubCategory', subCategorySchema);
```

---

## Admin Module Controllers

Due to the extensive size of the codebase, here are the key controllers with their main functionalities:

### Admin Auth Controller
Handles admin authentication and authorization.

### Admin Course Controller
Manages online courses with features:
- Create/update/delete courses
- Handle multimedia uploads (thumbnails, videos, study materials)
- Manage course content and structure
- Pricing and discount management

### Admin Current Affairs Controller
Manages current affairs content:
- Create/update current affairs with categories
- Filter and group by category types
- Language and subcategory management
- Dynamic grouping functionality

### Admin Test Series Controller
Manages test series:
- Create test series with multiple tests
- Question bank management
- Test scheduling and timing
- Result evaluation and ranking

### Admin Daily Quiz Controller
Manages daily quizzes:
- Create daily quiz questions
- Schedule quizzes by date
- Automatic evaluation
- Performance tracking

### Admin Publication Controller
Manages publications:
- Create/update publications
- Associate content with publications
- Publication metadata management

### Admin EBook Controller
Manages ebooks:
- Upload and manage ebooks
- Metadata management
- Category association

### Admin PYQ Controller
Manages previous year questions:
- Upload PYQ papers
- Exam and subject categorization
- Year-wise organization

### Admin Banner Controller
Manages promotional banners:
- Create/update banners
- Position and priority management
- Content linking

### Admin Coupon Controller
Manages discount coupons:
- Create coupon codes
- Set discount rules
- Usage tracking and limits

### Admin Language Controller
Manages languages:
- Add/remove languages
- Language code management

### Admin Validity Controller
Manages validity options:
- Create duration options
- Validity period management

### Admin Category/SubCategory Controllers
Manage content categorization:
- Create hierarchical categories
- Content type association

---

## User Module Controllers

### User Auth Controller
Handles user registration, login, and profile management.

### User Course Controller
Browse and access courses:
- Course listing with filters
- Content access control
- Progress tracking

### User Current Affairs Controller
Browse current affairs:
- Filter by categories, languages, dates
- Dynamic grouping by category types
- Search functionality

### User Test Series Controller
Access test series:
- Take tests with timer
- Submit and evaluate
- View results and rankings

### User Daily Quiz Controller
Take daily quizzes:
- Daily quiz access
- Real-time evaluation
- Score tracking

### User Publication Controller
Browse publications:
- Publication listing
- Associated content browsing

### User EBook Controller
Access ebooks:
- Ebook browsing and reading
- Download functionality

### User PYQ Controller
Browse previous year questions:
- Filter by exam, year, subject
- Paper viewing and downloading

### User Banner Controller
View promotional banners:
- Active banner listing
- Content redirection

### User Coupon Controller
Apply coupons:
- Coupon validation
- Discount calculation

### User Payment Controller
Handle payments:
- Razorpay integration
- Order creation and management
- Payment status tracking

### User Order Controller
Manage orders:
- Order history
- Status tracking
- Refund processing

---

## Routes

### Admin Routes Structure
```
/api/admin/
├── auth/                 # Authentication
├── courses/             # Online courses
├── current-affairs/     # Current affairs
├── test-series/         # Test series
├── daily-quizzes/       # Daily quizzes
├── publications/        # Publications
├── ebooks/              # E-books
├── pyqs/                # Previous year papers
├── banners/             # Promotional banners
├── coupons/             # Discount coupons
├── languages/           # Language management
├── validities/          # Validity options
├── categories/          # Content categories
├── subcategories/       # Content subcategories
└── orders/              # Order management
```

### User Routes Structure
```
/api/v1/
├── auth/                # Authentication
├── courses/             # Course browsing
├── current-affairs/     # Current affairs browsing
├── test-series/         # Test series access
├── daily-quizzes/       # Daily quizzes
├── publications/        # Publications browsing
├── ebooks/              # E-book access
├── pyqs/                # PYQ browsing
├── banners/             # Banner viewing
├── coupons/             # Coupon application
├── orders/              # Order management
└── payments/            # Payment processing
```

---

## Configuration

### Database Configuration (db.js)
```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
```

### Cloudinary Configuration (cloudinary.js)
```javascript
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;
```

### Environment Variables (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/brainbuzz
JWT_SECRET=your_jwt_secret_key_here
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

---

## Utilities & Middlewares

### Authentication Middleware
Handles JWT token verification for both admin and user roles.

### Upload Middleware
Configures multer for file uploads with Cloudinary integration.

### Content Type Validation
Validates content types across the application.

### Order Utilities
Generates unique order numbers and handles order calculations.

---

## Services

### Purchase Service
Manages user purchases and access rights.

### Test Series Access Service
Handles test series access granting and validation.

### Payment Service
Integrates with Razorpay for payment processing.

### Email Service
Handles email notifications and communications.

---

## Main Application

### app.js
```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./src/config/db');

// Import all routes
const adminAuthRoutes = require('./src/routes/Admin/authRoutes');
const adminCourseRoutes = require('./src/routes/Admin/courseRoutes');
const adminCurrentAffairsRoutes = require('./src/routes/Admin/currentAffairsRoutes');
const adminTestSeriesRoutes = require('./src/routes/Admin/testSeriesRoutes');
// ... (all other admin routes)

const userAuthRoutes = require('./src/routes/User/authRoutes');
const userCourseRoutes = require('./src/routes/User/courseRoutes');
const userCurrentAffairsRoutes = require('./src/routes/User/currentAffairsRoutes');
// ... (all other user routes)

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Admin Routes
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/courses', adminCourseRoutes);
app.use('/api/admin/current-affairs', adminCurrentAffairsRoutes);
app.use('/api/admin/test-series', adminTestSeriesRoutes);
// ... (all other admin routes)

// User Routes
app.use('/api/v1/auth', userAuthRoutes);
app.use('/api/v1/courses', userCourseRoutes);
app.use('/api/v1/current-affairs', userCurrentAffairsRoutes);
// ... (all other user routes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

module.exports = app;
```

### server.js
```javascript
const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

## Package.json Dependencies
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.5.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "cloudinary": "^1.40.0",
    "bcryptjs": "^2.4.3",
    "razorpay": "^2.9.2",
    "nodemailer": "^6.9.4"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

---

*This documentation provides a comprehensive overview of the Brain Buzz backend system. Due to the extensive nature of the codebase, specific implementation details for each controller and route are referenced but not fully included. The structure and key components are documented to provide a complete understanding of the system architecture.*