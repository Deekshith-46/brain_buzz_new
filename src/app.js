const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

require('./models/TestSeries/TestSeries');
require('./models/Order/Order');

// Load PYQ models
require('./models/Course/Exam');
require('./models/Course/Subject');
require('./models/Course/PreviousQuestionPaper');

// Load Banner model
require('./models/Banner');

const adminRoutes = require('./routes/Admin/adminRoutes');
const adminAuthRoutes = require('./routes/Admin/authRoutes');
const adminCategoryRoutes = require('./routes/Admin/categoryRoutes');
const adminSubCategoryRoutes = require('./routes/Admin/subCategoryRoutes');
const adminLanguageRoutes = require('./routes/Admin/languageRoutes');
const adminValidityRoutes = require('./routes/Admin/validityRoutes');
const adminCourseRoutes = require('./routes/Admin/courseRoutes');
const adminPublicationRoutes = require('./routes/Admin/publicationRoutes');
const adminEBookRoutes = require('./routes/Admin/eBookRoutes');
const adminDailyQuizRoutes = require('./routes/Admin/dailyQuizRoutes');
const adminCurrentAffairsRoutes = require('./routes/Admin/currentAffairsRoutes');
const adminCurrentAffairsCategoryRoutes = require('./routes/Admin/currentAffairsCategoryRoutes');
const adminTestSeriesRoutes = require('./routes/Admin/testSeriesRoutes');
const adminLiveClassRoutes = require('./routes/Admin/liveClassRoutes');
const userRoutes = require('./routes/User/userRoutes');
const userAuthRoutes = require('./routes/User/authRoutes');
const userPublicationRoutes = require('./routes/User/publicationRoutes');
const userCourseRoutes = require('./routes/User/courseRoutes');
const userEBookRoutes = require('./routes/User/eBookRoutes');
const userDailyQuizRoutes = require('./routes/User/dailyQuizRoutes');
const currentAffairsRoutes = require('./routes/User/currentAffairsRoutes');
const userTestSeriesRoutes = require('./routes/User/testSeriesRoutes');
const userTestAttemptRoutes = require('./routes/User/testAttemptRoutes');
const userLiveClassRoutes = require('./routes/User/liveClassRoutes');
const adminOrderRoutes = require('./routes/Admin/orderRoutes');

const adminCouponRoutes = require('./routes/Admin/couponRoutes');
const userCouponRoutes = require('./routes/User/couponRoutes');

const paymentRoutes = require('./routes/User/paymentRoutes');
const orderRoutes = require('./routes/User/orderRoutes');

// PYQ Routes
const adminExamRoutes = require('./routes/Admin/examRoutes');
const adminSubjectRoutes = require('./routes/Admin/subjectRoutes');
const adminPYQRoutes = require('./routes/Admin/pyqRoutes');
const userPYQRoutes = require('./routes/User/pyqRoutes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.json({ message: 'Brain Buzz API is running' });
});

app.use('/api/admins', adminRoutes);
app.use('/api/admin', adminAuthRoutes);
app.use('/api/admin/categories', adminCategoryRoutes);
app.use('/api/admin/subcategories', adminSubCategoryRoutes);
app.use('/api/admin/languages', adminLanguageRoutes);
app.use('/api/admin/validities', adminValidityRoutes);
app.use('/api/admin/courses', adminCourseRoutes);
app.use('/api/admin/publications', adminPublicationRoutes);
app.use('/api/admin/ebooks', adminEBookRoutes);
app.use('/api/admin/daily-quizzes', adminDailyQuizRoutes);
app.use('/api/admin/current-affairs', adminCurrentAffairsRoutes);
app.use('/api/admin/current-affairs-categories', adminCurrentAffairsCategoryRoutes);
app.use('/api/admin/test-series', adminTestSeriesRoutes);
app.use('/api/admin/live-classes', adminLiveClassRoutes);
app.use('/api/v1/admin/coupons', adminCouponRoutes);
// And in your route middleware section, add:
app.use('/api/admin/orders', adminOrderRoutes);

app.use('/api/users', userRoutes);
app.use('/api/users', userAuthRoutes);
app.use('/api/users', userPublicationRoutes);
app.use('/api/users', userCourseRoutes);
app.use('/api/users', userEBookRoutes);
app.use('/api/users', userDailyQuizRoutes);
app.use('/api/v1', currentAffairsRoutes);
app.use('/api/v1/test-series', userTestSeriesRoutes);
app.use('/api/v1/test-attempts', userTestAttemptRoutes);
app.use('/api/v1/live-classes', userLiveClassRoutes);
// User routes
app.use('/api/v1/coupons', userCouponRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/orders', orderRoutes);

// PYQ Routes
app.use('/api/admin/exams', adminExamRoutes);
app.use('/api/admin/subjects', adminSubjectRoutes);
app.use('/api/admin/previous-question-papers', adminPYQRoutes);
app.use('/api/v1/previous-question-papers', userPYQRoutes);

// Course Filter Routes
const courseFilterRoutes = require('./routes/User/courseFilterRoutes');
app.use('/api/v1/courses/filters', courseFilterRoutes);

// Other Content Filter Routes
const filterRoutes = require('./routes/User/filterRoutes');
app.use('/api/v1/filters', filterRoutes);

// Admin Course Filter Routes
const adminCourseFilterRoutes = require('./routes/Admin/courseFilterRoutes');
app.use('/api/admin/courses/filters', adminCourseFilterRoutes);

// Admin Publication Filter Routes
const adminPublicationFilterRoutes = require('./routes/Admin/publicationFilterRoutes');
app.use('/api/admin/publications/filters', adminPublicationFilterRoutes);

// Admin EBook Filter Routes
const adminEBookFilterRoutes = require('./routes/Admin/eBookFilterRoutes');
app.use('/api/admin/ebooks/filters', adminEBookFilterRoutes);

// Admin Daily Quiz Filter Routes
const adminDailyQuizFilterRoutes = require('./routes/Admin/dailyQuizFilterRoutes');
app.use('/api/admin/daily-quizzes/filters', adminDailyQuizFilterRoutes);

// Admin PYQ Filter Routes
const adminPYQFilterRoutes = require('./routes/Admin/pyqFilterRoutes');
app.use('/api/admin/previous-question-papers/filters', adminPYQFilterRoutes);

// Admin Current Affairs Filter Routes
const adminCurrentAffairsFilterRoutes = require('./routes/Admin/currentAffairsFilterRoutes');
app.use('/api/admin/current-affairs/filters', adminCurrentAffairsFilterRoutes);

// Admin Test Series Filter Routes
const adminTestSeriesFilterRoutes = require('./routes/Admin/testSeriesFilterRoutes');
app.use('/api/admin/test-series/filters', adminTestSeriesFilterRoutes);

// Banner Routes
const adminBannerRoutes = require('./routes/Admin/bannerRoutes');
const userBannerRoutes = require('./routes/User/bannerRoutes');
app.use('/api/admin/banners', adminBannerRoutes);
app.use('/api/public', userBannerRoutes);

module.exports = app;
