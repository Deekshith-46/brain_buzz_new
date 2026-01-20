# Brain Buzz Backend - Online Courses Complete Documentation

## Table of Contents
1. [Models](#models)
2. [Admin Controllers](#admin-controllers)
3. [User Controllers](#user-controllers)
4. [Admin Routes](#admin-routes)
5. [User Routes](#user-routes)
6. [Summary](#summary)

---

## Models

### Course.js
```javascript
const mongoose = require('mongoose');

const tutorSchema = new mongoose.Schema(
  {
    photoUrl: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    qualification: {
      type: String,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: true }
);

const classSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    topic: {
      type: String,
      trim: true,
    },
    order: {
      type: Number,
    },
    thumbnailUrl: {
      type: String,
      trim: true,
    },
    lecturePhotoUrl: {
      type: String,
      trim: true,
    },
    videoUrl: {
      type: String,
      trim: true,
    },
    isFree: {
      type: Boolean,
      default: false
    },
    
  },
  { _id: true }
);

const studyMaterialSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    fileUrl: {
      type: String,
      trim: true,
    },
  },
  { _id: true }
);

const courseSchema = new mongoose.Schema(
  {
    contentType: {
      type: String,
      enum: [
        'ONLINE_COURSE',
        'TEST_SERIES',
        'LIVE_CLASS',
        'PUBLICATION',
        'DAILY_QUIZ',
        'CURRENT_AFFAIRS',
        'PYQ_EBOOK',
      ],
      default: 'ONLINE_COURSE',
    },
    accessType: {
      type: String,
      enum: ["FREE", "PAID"],
      default: "PAID"
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    courseType: {
      type: String,
      trim: true,
    },
    startDate: {
      type: Date,
    },
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
      },
    ],
    subCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubCategory',
      },
    ],
    languages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Language',
      },
    ],
    validities: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ValidityOption',
      },
    ],
    thumbnailUrl: {
      type: String,
      trim: true,
    },
    originalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    discountPrice: {
      type: Number,
      min: 0,
    },
    discountPercent: {
      type: Number,
      min: 0,
      max: 100,
    },
    pricingNote: {
      type: String,
      trim: true,
    },
    shortDescription: {
      type: String,
      trim: true,
    },
    detailedDescription: {
      type: String,
      trim: true,
    },
    tutors: [tutorSchema],
    classes: [classSchema],
    studyMaterials: [studyMaterialSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add a pre-save hook to validate categories and subcategories match the content type
courseSchema.pre('save', async function(next) {
  if (this.categories && this.categories.length > 0) {
    const Category = require('./Category');
    for (const categoryId of this.categories) {
      const category = await Category.findById(categoryId);
      if (category && category.contentType !== this.contentType) {
        return next(new Error(`Category ${category.name} does not match content type ${this.contentType}`));
      }
    }
  }
  
  if (this.subCategories && this.subCategories.length > 0) {
    const SubCategory = require('./SubCategory');
    for (const subCategoryId of this.subCategories) {
      const subCategory = await SubCategory.findById(subCategoryId);
      if (subCategory && subCategory.contentType !== this.contentType) {
        return next(new Error(`SubCategory ${subCategory.name} does not match content type ${this.contentType}`));
      }
    }
  }
  
  next();
});

module.exports = mongoose.model('Course', courseSchema);
```

---

## Admin Controllers

### Admin/courseController.js
```javascript
const Course = require('../../models/Course/Course');
const Language = require('../../models/Course/Language');
const cloudinary = require('../../config/cloudinary');

const uploadToCloudinary = (fileBuffer, folder, resourceType = 'image') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );

    stream.end(fileBuffer);
  });
};

// Create new course (ONLINE_COURSE) with thumbnail + tutor images
exports.createCourse = async (req, res) => {
  try {
    if (!req.body.course) {
      return res.status(400).json({ message: 'Course data (course) is required in form-data' });
    }

    const parsed = JSON.parse(req.body.course);

    const {
      contentType = 'ONLINE_COURSE',
      name,
      courseType,
      startDate,
      categoryIds = [],
      subCategoryIds = [],
      languageIds = [],
      validityIds = [],
      originalPrice,
      discountPrice,
      discountPercent,
      pricingNote,
      shortDescription,
      detailedDescription,
      tutors = [],
      classes = [],
      studyMaterials = [],
      isActive,
    } = parsed;

    if (!name) {
      return res.status(400).json({ message: 'Course name is required' });
    }

    if (!originalPrice && originalPrice !== 0) {
      return res.status(400).json({ message: 'Original price is required' });
    }

    // Handle thumbnail upload
    let thumbnailUrl;
    if (req.files && req.files.thumbnail && req.files.thumbnail[0]) {
      const thumbFile = req.files.thumbnail[0];
      const uploadResult = await uploadToCloudinary(
        thumbFile.buffer,
        'brainbuzz/courses/thumbnails',
        'image'
      );
      thumbnailUrl = uploadResult.secure_url;
    }

    // Handle tutor images (match by index)
    const tutorImages = (req.files && req.files.tutorImages) || [];
    const finalTutors = tutors.map((tutor, index) => {
      const t = { ...tutor };
      if (tutorImages[index]) {
        t._fileBuffer = tutorImages[index].buffer;
      }
      return t;
    });

    // Upload tutor images to Cloudinary
    for (const tutor of finalTutors) {
      if (tutor._fileBuffer) {
        const uploadResult = await uploadToCloudinary(
          tutor._fileBuffer,
          'brainbuzz/courses/tutors',
          'image'
        );
        tutor.photoUrl = uploadResult.secure_url;
        delete tutor._fileBuffer;
      }
    }

    // Handle class media (thumbnails, lecture pics, videos) matched by index
    const classThumbnails = (req.files && req.files.classThumbnails) || [];
    const classLecturePics = (req.files && req.files.classLecturePics) || [];
    const classVideos = (req.files && req.files.classVideos) || [];

    const finalClasses = classes.map((cls, index) => {
      const c = { ...cls };
      if (classThumbnails[index]) {
        c._thumbBuffer = classThumbnails[index].buffer;
      }
      if (classLecturePics[index]) {
        c._lectureBuffer = classLecturePics[index].buffer;
      }
      if (classVideos[index]) {
        c._videoBuffer = classVideos[index].buffer;
      }
      return c;
    });

    for (const cls of finalClasses) {
      if (cls._thumbBuffer) {
        const uploadResult = await uploadToCloudinary(
          cls._thumbBuffer,
          'brainbuzz/courses/classes/thumbnails',
          'image'
        );
        cls.thumbnailUrl = uploadResult.secure_url;
        delete cls._thumbBuffer;
      }
      if (cls._lectureBuffer) {
        const uploadResult = await uploadToCloudinary(
          cls._lectureBuffer,
          'brainbuzz/courses/classes/lectures',
          'image'
        );
        cls.lecturePhotoUrl = uploadResult.secure_url;
        delete cls._lectureBuffer;
      }
      if (cls._videoBuffer) {
        const uploadResult = await uploadToCloudinary(
          cls._videoBuffer,
          'brainbuzz/courses/classes/videos',
          'video'
        );
        cls.videoUrl = uploadResult.secure_url;
        delete cls._videoBuffer;
      }
    }

    // Handle study material files matched by index
    // FIX: Properly upload study materials to Cloudinary and map them
    let finalStudyMaterials = [];
    if (req.files && req.files.studyMaterialFiles && req.files.studyMaterialFiles.length > 0) {
      // Prevent duplicate files by using a Map with filename as key
      const uniqueFiles = new Map();
      
      req.files.studyMaterialFiles.forEach(file => {
        uniqueFiles.set(file.originalname, file);
      });
      
      // Upload each unique study material file to Cloudinary
      for (const file of uniqueFiles.values()) {
        const uploadResult = await uploadToCloudinary(
          file.buffer,
          'brainbuzz/courses/study-materials',
          'raw'
        );
        
        finalStudyMaterials.push({
          title: file.originalname,
          fileUrl: uploadResult.secure_url
        });
      }
    }

    // Auto-mark first 2 classes as free
    if (finalClasses && Array.isArray(finalClasses)) {
      finalClasses.forEach((cls, index) => {
        cls.isFree = index < 2;
      });
    }
    
    const course = await Course.create({
      contentType,
      name,
      courseType,
      startDate,
      categories: categoryIds,
      subCategories: subCategoryIds,
      languages: languageIds,
      validities: validityIds,
      thumbnailUrl,
      originalPrice,
      discountPrice,
      discountPercent,
      pricingNote,
      shortDescription,
      detailedDescription,
      tutors: finalTutors,
      classes: finalClasses,
      studyMaterials: finalStudyMaterials,
      isActive,
    });

    return res.status(201).json({
      message: 'Course created successfully',
      data: course,
    });
  } catch (error) {
    console.error('Error creating course:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create complete course in one API call with individual form fields (NEW FUNCTION)
exports.createFullCourse = async (req, res) => {
  try {
    // Extract all form fields
    const {
      contentType = 'ONLINE_COURSE',
      name,
      courseType,
      startDate,
      originalPrice,
      discountPrice,
      pricingNote,
      shortDescription,
      detailedDescription,
      isActive,
      accessType,
    } = req.body;

    // Parse array fields from JSON strings
    let categoryIds = [];
    let subCategoryIds = [];
    let languageIds = [];
    let validityIds = [];
    let classes = [];
    let tutors = [];
    let studyMaterials = [];

    try {
      categoryIds = req.body.categoryIds ? JSON.parse(req.body.categoryIds) : [];
      subCategoryIds = req.body.subCategoryIds ? JSON.parse(req.body.subCategoryIds) : [];
      languageIds = req.body.languageIds ? JSON.parse(req.body.languageIds) : [];
      validityIds = req.body.validityIds ? JSON.parse(req.body.validityIds) : [];
      classes = req.body.classes ? JSON.parse(req.body.classes) : [];
      tutors = req.body.tutors ? JSON.parse(req.body.tutors) : [];
      studyMaterials = req.body.studyMaterials ? JSON.parse(req.body.studyMaterials) : [];
    } catch (parseError) {
      return res.status(400).json({ 
        message: 'Invalid JSON in one of the array fields',
        error: parseError.message 
      });
    }

    // Validation
    if (!name) {
      return res.status(400).json({ message: 'Course name is required' });
    }

    if (!originalPrice && originalPrice !== 0) {
      return res.status(400).json({ message: 'Original price is required' });
    }

    // Handle thumbnail upload
    let thumbnailUrl;
    if (req.files && req.files.thumbnail && req.files.thumbnail[0]) {
      const thumbFile = req.files.thumbnail[0];
      const uploadResult = await uploadToCloudinary(
        thumbFile.buffer,
        'brainbuzz/courses/thumbnails',
        'image'
      );
      thumbnailUrl = uploadResult.secure_url;
    }

    // Handle tutor images (match by index)
    const tutorImages = (req.files && req.files.tutorImages) || [];
    const finalTutors = tutors.map((tutor, index) => {
      const t = { ...tutor };
      if (tutorImages[index]) {
        t._fileBuffer = tutorImages[index].buffer;
      }
      return t;
    });

    // Upload tutor images to Cloudinary
    for (const tutor of finalTutors) {
      if (tutor._fileBuffer) {
        const uploadResult = await uploadToCloudinary(
          tutor._fileBuffer,
          'brainbuzz/courses/tutors',
          'image'
        );
        tutor.photoUrl = uploadResult.secure_url;
        delete tutor._fileBuffer;
      }
    }

    // Handle class media (thumbnails, lecture pics, videos) matched by index
    const classThumbnails = (req.files && req.files.classThumbnails) || [];
    const classLecturePics = (req.files && req.files.classLecturePics) || [];
    const classVideos = (req.files && req.files.classVideos) || [];

    const finalClasses = classes.map((cls, index) => {
      const c = { ...cls };
      if (classThumbnails[index]) {
        c._thumbBuffer = classThumbnails[index].buffer;
      }
      if (classLecturePics[index]) {
        c._lectureBuffer = classLecturePics[index].buffer;
      }
      if (classVideos[index]) {
        c._videoBuffer = classVideos[index].buffer;
      }
      return c;
    });

    for (const cls of finalClasses) {
      if (cls._thumbBuffer) {
        const uploadResult = await uploadToCloudinary(
          cls._thumbBuffer,
          'brainbuzz/courses/classes/thumbnails',
          'image'
        );
        cls.thumbnailUrl = uploadResult.secure_url;
        delete cls._thumbBuffer;
      }
      if (cls._lectureBuffer) {
        const uploadResult = await uploadToCloudinary(
          cls._lectureBuffer,
          'brainbuzz/courses/classes/lectures',
          'image'
        );
        cls.lecturePhotoUrl = uploadResult.secure_url;
        delete cls._lectureBuffer;
      }
      if (cls._videoBuffer) {
        const uploadResult = await uploadToCloudinary(
          cls._videoBuffer,
          'brainbuzz/courses/classes/videos',
          'video'
        );
        cls.videoUrl = uploadResult.secure_url;
        delete cls._videoBuffer;
      }
    }

    // Handle study material files matched by index
    // FIX: Properly upload study materials to Cloudinary and map them
    let finalStudyMaterials = [];
    if (req.files && req.files.studyMaterialFiles && req.files.studyMaterialFiles.length > 0) {
      // Upload each study material file to Cloudinary
      for (const file of req.files.studyMaterialFiles) {
        const uploadResult = await uploadToCloudinary(
          file.buffer,
          'brainbuzz/courses/study-materials',
          'raw'
        );
        
        finalStudyMaterials.push({
          title: file.originalname,
          fileUrl: uploadResult.secure_url
        });
      }
    }

    // Auto-mark first 2 classes as free (as per specification)
    if (finalClasses && Array.isArray(finalClasses)) {
      finalClasses.forEach((cls, index) => {
        cls.isFree = index < 2;
      });
    }
    
    // Create the course
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
      tutors: finalTutors,
      classes: finalClasses,
      studyMaterials: finalStudyMaterials,
      // Ensure isActive defaults to true when not provided
      isActive: isActive === 'true' || isActive === true || isActive === undefined ? true : false,
      accessType: accessType || 'PAID',
    });

    return res.status(201).json({
      success: true,
      message: 'Complete course created successfully',
      data: course,
    });
  } catch (error) {
    console.error('Error creating full course:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Step 1: create course shell (content, categories, subcategories, date)
exports.createCourseShell = async (req, res) => {
  try {
    // Parse form-data fields properly
    let {
      contentType = 'ONLINE_COURSE',
      startDate,
      categoryIds = '[]',
      subCategoryIds = '[]',
    } = req.body;

    // Parse array strings to actual arrays
    try {
      categoryIds = typeof categoryIds === 'string' ? JSON.parse(categoryIds) : categoryIds;
      subCategoryIds = typeof subCategoryIds === 'string' ? JSON.parse(subCategoryIds) : subCategoryIds;
    } catch (parseError) {
      return res.status(400).json({ 
        message: 'Invalid categoryIds or subCategoryIds format. Must be valid JSON arrays.',
        error: parseError.message 
      });
    }

    // Convert startDate string to Date object
    if (startDate) {
      startDate = new Date(startDate);
      if (isNaN(startDate.getTime())) {
        return res.status(400).json({ message: 'Invalid startDate format. Use ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)' });
      }
    }

    const draftName = `Draft Course ${Date.now()}`;

    const course = await Course.create({
      contentType,
      name: draftName,
      startDate,
      categories: categoryIds,
      subCategories: subCategoryIds,
      languages: [],
      validities: [],
      originalPrice: 0, // placeholder, to be updated in step 2
      discountPrice: 0,
      discountPercent: 0,
      shortDescription: '',
      detailedDescription: '',
      tutors: [],
      classes: [],
      studyMaterials: [],
      isActive: true,
    });

    return res.status(201).json({
      message: 'Course draft created. Proceed with next steps.',
      data: course,
    });
  } catch (error) {
    console.error('Error initializing course:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update shell (content, categories, subcategories, date)
exports.updateCourseShell = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Parse form-data fields properly
    let {
      contentType,
      startDate,
      categoryIds,
      subCategoryIds,
    } = req.body;

    // Parse array strings to actual arrays if provided
    if (categoryIds) {
      try {
        categoryIds = typeof categoryIds === 'string' ? JSON.parse(categoryIds) : categoryIds;
      } catch (parseError) {
        return res.status(400).json({ 
          message: 'Invalid categoryIds format. Must be valid JSON array.',
          error: parseError.message 
        });
      }
    }

    if (subCategoryIds) {
      try {
        subCategoryIds = typeof subCategoryIds === 'string' ? JSON.parse(subCategoryIds) : subCategoryIds;
      } catch (parseError) {
        return res.status(400).json({ 
          message: 'Invalid subCategoryIds format. Must be valid JSON array.',
          error: parseError.message 
        });
      }
    }

    // Convert startDate string to Date object if provided
    if (startDate) {
      const dateObj = new Date(startDate);
      if (isNaN(dateObj.getTime())) {
        return res.status(400).json({ message: 'Invalid startDate format. Use ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)' });
      }
      startDate = dateObj;
    }

    const updates = {};
    if (contentType) updates.contentType = contentType;
    if (startDate) updates.startDate = startDate;
    if (categoryIds) updates.categories = categoryIds;
    if (subCategoryIds) updates.subCategories = subCategoryIds;

    const course = await Course.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .populate('validities', 'label durationInDays');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    return res.status(200).json({
      message: 'Course shell updated',
      data: course,
    });
  } catch (error) {
    console.error('Error updating course shell:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Step 2: update basic details (thumbnail, name, languages, validity, pricing)
exports.updateCourseBasic = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      languageIds,
      validityIds,
      originalPrice,
      discountPrice,
      courseType,
    } = req.body;

    const updates = {};

    if (name) updates.name = name;
    if (courseType) updates.courseType = courseType;
    if (languageIds) updates.languages = languageIds;
    if (validityIds) updates.validities = validityIds;
    if (typeof originalPrice !== 'undefined') updates.originalPrice = originalPrice;
    if (typeof discountPrice !== 'undefined') updates.discountPrice = discountPrice;

    if (req.files && req.files.thumbnail && req.files.thumbnail[0]) {
      const thumbFile = req.files.thumbnail[0];
      const uploadResult = await uploadToCloudinary(
        thumbFile.buffer,
        'brainbuzz/courses/thumbnails',
        'image'
      );
      updates.thumbnailUrl = uploadResult.secure_url;
    }

    const course = await Course.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .populate('validities', 'label durationInDays');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    return res.status(200).json({
      message: 'Course basic details updated',
      data: course,
    });
  } catch (error) {
    console.error('Error updating course basic details:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Step 3: update descriptions, study materials, pricing note
exports.updateCourseContent = async (req, res) => {
  try {
    const { id } = req.params;
    const { shortDescription, detailedDescription, pricingNote, studyMaterials } = req.body;

    const updates = {};
    if (typeof shortDescription !== 'undefined') updates.shortDescription = shortDescription;
    if (typeof detailedDescription !== 'undefined') updates.detailedDescription = detailedDescription;
    if (typeof pricingNote !== 'undefined') updates.pricingNote = pricingNote;

    // handle study materials append
    let finalStudyMaterials = [];
    if (studyMaterials) {
      let parsed;
      try {
        parsed = Array.isArray(studyMaterials)
          ? studyMaterials
          : JSON.parse(studyMaterials);
      } catch (e) {
        return res.status(400).json({ message: 'Invalid studyMaterials JSON' });
      }
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return res.status(400).json({ message: 'Study materials must be a non-empty array' });
      }
      const studyFiles = (req.files && req.files.studyMaterialFiles) || [];
      finalStudyMaterials = parsed.map((sm, index) => {
        const s = { ...sm };
        if (studyFiles[index]) s._fileBuffer = studyFiles[index].buffer;
        return s;
      });

      for (const sm of finalStudyMaterials) {
        if (sm._fileBuffer) {
          const uploadResult = await uploadToCloudinary(
            sm._fileBuffer,
            'brainbuzz/courses/study-materials',
            'raw'
          );
          sm.fileUrl = uploadResult.secure_url;
          delete sm._fileBuffer;
        }
      }
    }

    const course = await Course.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .populate('validities', 'label durationInDays');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (finalStudyMaterials.length) {
      course.studyMaterials.push(...finalStudyMaterials);
      await course.save();
    }

    const populated = await Course.findById(id)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .populate('validities', 'label durationInDays');

    return res.status(200).json({
      message: 'Course content updated',
      data: populated,
    });
  } catch (error) {
    console.error('Error updating course content:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete study material
exports.deleteStudyMaterial = async (req, res) => {
  try {
    const { id, materialId } = req.params;
    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    const before = course.studyMaterials.length;
    course.studyMaterials = course.studyMaterials.filter(
      (sm) => sm._id.toString() !== materialId
    );
    if (course.studyMaterials.length === before) {
      return res.status(404).json({ message: 'Study material not found' });
    }
    await course.save();
    const populatedCourse = await Course.findById(id)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .populate('validities', 'label durationInDays');
    return res.status(200).json({ message: 'Study material deleted', data: populatedCourse });
  } catch (error) {
    console.error('Error deleting study material:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Step 6: add tutors incrementally
exports.addTutors = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.body.tutors) {
      return res.status(400).json({ message: 'Tutors data is required' });
    }

    const tutors = JSON.parse(req.body.tutors);
    if (!Array.isArray(tutors) || tutors.length === 0) {
      return res.status(400).json({ message: 'Tutors must be a non-empty array' });
    }

    const tutorImages = (req.files && req.files.tutorImages) || [];
    const finalTutors = tutors.map((tutor, index) => {
      const t = { ...tutor };
      if (tutorImages[index]) {
        t._fileBuffer = tutorImages[index].buffer;
      }
      return t;
    });

    for (const tutor of finalTutors) {
      if (tutor._fileBuffer) {
        const uploadResult = await uploadToCloudinary(
          tutor._fileBuffer,
          'brainbuzz/courses/tutors',
          'image'
        );
        tutor.photoUrl = uploadResult.secure_url;
        delete tutor._fileBuffer;
      }
    }

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    course.tutors.push(...finalTutors);
    await course.save();

    const populatedCourse = await Course.findById(id)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .populate('validities', 'label durationInDays');

    return res.status(200).json({
      message: 'Tutors added successfully',
      data: populatedCourse,
    });
  } catch (error) {
    console.error('Error adding tutors:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update tutor
exports.updateTutor = async (req, res) => {
  try {
    const { id, tutorId } = req.params;
    const { name, qualification, subject } = req.body;

    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    const tutor = course.tutors.id(tutorId);
    if (!tutor) return res.status(404).json({ message: 'Tutor not found' });

    if (name) tutor.name = name;
    if (qualification) tutor.qualification = qualification;
    if (subject) tutor.subject = subject;

    const tutorImages = (req.files && req.files.tutorImage) || [];
    if (tutorImages[0]) {
      const uploadResult = await uploadToCloudinary(
        tutorImages[0].buffer,
        'brainbuzz/courses/tutors',
        'image'
      );
      tutor.photoUrl = uploadResult.secure_url;
    }

    await course.save();
    const populatedCourse = await Course.findById(id)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .populate('validities', 'label durationInDays');

    return res.status(200).json({ message: 'Tutor updated', data: populatedCourse });
  } catch (error) {
    console.error('Error updating tutor:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete tutor
exports.deleteTutor = async (req, res) => {
  try {
    const { id, tutorId } = req.params;
    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    course.tutors.id(tutorId)?.remove();
    await course.save();
    const populatedCourse = await Course.findById(id)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .populate('validities', 'label durationInDays');
    return res.status(200).json({ message: 'Tutor deleted', data: populatedCourse });
  } catch (error) {
    console.error('Error deleting tutor:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update class
exports.updateClass = async (req, res) => {
  try {
    const { id, classId } = req.params;
    const { title, topic, order } = req.body;

    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const cls = course.classes.id(classId);
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    // Update text fields
    if (title) cls.title = title;
    if (topic) cls.topic = topic;
    if (typeof order !== 'undefined') cls.order = order;

    // Handle file uploads (supporting both the old field names and the new ones from uploadClassMedia)
    const thumb = req.files?.classThumbnail?.[0] || req.files?.thumbnail?.[0];
    const lecture = req.files?.classLecturePic?.[0] || req.files?.lecturePhoto?.[0];
    const video = req.files?.classVideo?.[0] || req.files?.video?.[0];

    // Upload thumbnail if provided
    if (thumb) {
      const uploadResult = await uploadToCloudinary(
        thumb.buffer,
        'brainbuzz/courses/classes/thumbnails',
        'image'
      );
      cls.thumbnailUrl = uploadResult.secure_url;
    }
    
    // Upload lecture photo if provided
    if (lecture) {
      const uploadResult = await uploadToCloudinary(
        lecture.buffer,
        'brainbuzz/courses/classes/lectures',
        'image'
      );
      cls.lecturePhotoUrl = uploadResult.secure_url;
    }
    
    // Upload video if provided
    if (video) {
      const uploadResult = await uploadToCloudinary(
        video.buffer,
        'brainbuzz/courses/classes/videos',
        'video'
      );
      cls.videoUrl = uploadResult.secure_url;
    }

    await course.save();
    const populatedCourse = await Course.findById(id)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .populate('validities', 'label durationInDays');

    return res.status(200).json({ 
      message: 'Class updated successfully', 
      data: populatedCourse 
    });
  } catch (error) {
    console.error('Error updating class:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete class
exports.deleteClass = async (req, res) => {
  try {
    const { id, classId } = req.params;
    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    course.classes.id(classId)?.remove();
    await course.save();
    const populatedCourse = await Course.findById(id)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .populate('validities', 'label durationInDays');
    return res.status(200).json({ message: 'Class deleted', data: populatedCourse });
  } catch (error) {
    console.error('Error deleting class:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all courses (optionally filtered) - admin
exports.getCourses = async (req, res) => {
  try {
    const { contentType, category, subCategory, language, lang, isActive } = req.query;

    const filter = {};
    filter.contentType = contentType || 'ONLINE_COURSE';
    if (category) filter.categories = category;
    if (subCategory) filter.subCategories = subCategory;
    if (language) filter.languages = language;
    if (lang) {
      const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const langDoc = await Language.findOne({
        $or: [
          { code: lang.toLowerCase() },
          { name: { $regex: `^${escapeRegex(lang)}$`, $options: 'i' } },
        ],
      });
      if (!langDoc) {
        return res.status(400).json({ message: 'Invalid language code or name' });
      }
      filter.languages = langDoc._id;
    }
    if (typeof isActive !== 'undefined') filter.isActive = isActive === 'true';

    const courses = await Course.find(filter)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .populate('validities', 'label durationInDays');
    
    // Process courses to return only specified fields
    const processedCourses = courses.map(course => {
      // Calculate finalPrice
      const discountAmount = typeof course.discountPrice === 'number' && course.discountPrice >= 0
        ? course.discountPrice
        : 0;
      const finalPrice = Math.max(0, course.originalPrice - discountAmount);
    
      return {
        _id: course._id,
        thumbnail: course.thumbnailUrl,
        name: course.name,
        originalPrice: course.originalPrice,
        discountPrice: course.discountPrice,
        finalPrice: finalPrice,
        languages: course.languages,
        validities: course.validities
      };
    });
    
    return res.status(200).json({ data: processedCourses });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get course by ID
exports.getCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .populate('validities', 'label durationInDays');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // For admin, all classes are accessible
    const courseObj = course.toObject();
    
    // Process classes: Admin has full access to all classes
    courseObj.classes = courseObj.classes.map(cls => ({
      ...cls,
      isLocked: false,
      hasAccess: true,
    }));

    return res.status(200).json({ data: courseObj });
  } catch (error) {
    console.error('Error fetching course:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get distinct categories for courses (admin - shows all courses regardless of active status)
exports.getCourseCategories = async (req, res) => {
  try {
    const { contentType } = req.query;
    
    // Default to ONLINE_COURSE
    const type = contentType || 'ONLINE_COURSE';
    
    // Find courses (including inactive) and get distinct categories
    const courses = await Course.find({ 
      contentType: type 
    }).populate('categories', 'name slug description thumbnailUrl');

    // Extract unique categories
    const categories = [];
    const categoryIds = new Set();
    
    courses.forEach(course => {
      if (course.categories) {
        course.categories.forEach(cat => {
          if (!categoryIds.has(cat._id.toString())) {
            categoryIds.add(cat._id.toString());
            categories.push({
              _id: cat._id,
              name: cat.name,
              slug: cat.slug,
              description: cat.description,
              thumbnailUrl: cat.thumbnailUrl
            });
          }
        });
      }
    });

    return res.status(200).json({ data: categories });
  } catch (error) {
    console.error('Error fetching course categories:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get distinct subcategories for active courses based on category and language
exports.getCourseSubCategories = async (req, res) => {
  try {
    const { category, language, lang } = req.query;
    
    const filter = {
      contentType: 'ONLINE_COURSE',
      isActive: true,
      categories: category
    };

    // Handle language filter
    if (language) {
      filter.languages = language;
    } else if (lang) {
      const escapeRegex = (s) => s.replace(/[.*+?^${}()|[]\\]/g, '\\$&');
      const langDoc = await Language.findOne({
        $or: [
          { code: lang.toLowerCase() },
          { name: { $regex: `^${escapeRegex(lang)}$`, $options: 'i' } },
        ],
      });
      if (langDoc) {
        filter.languages = langDoc._id;
      }
    }

    const courses = await Course.find(filter).populate('subCategories', 'name slug description thumbnailUrl');

    // Extract unique subcategories
    const subCategories = [];
    const subCategoryIds = new Set();
    
    courses.forEach(course => {
      if (course.subCategories) {
        course.subCategories.forEach(subCat => {
          if (!subCategoryIds.has(subCat._id.toString())) {
            subCategoryIds.add(subCat._id.toString());
            subCategories.push({
              _id: subCat._id,
              name: subCat.name,
              slug: subCat.slug,
              description: subCat.description,
              thumbnailUrl: subCat.thumbnailUrl
            });
          }
        });
      }
    });

    return res.status(200).json({ data: subCategories });
  } catch (error) {
    const errorResponse = handleDatabaseError(error);
    return res.status(errorResponse.statusCode).json({
      message: errorResponse.message,
      error: errorResponse.error
    });
  }
};

```

---

## Admin Routes

### Admin/courseRoutes.js
```javascript
const express = require('express');
const {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  addClassesToCourse,
  createCourseShell,
  updateCourseShell,
  updateCourseBasic,
  updateCourseContent,
  addTutors,
  updateTutor,
  deleteTutor,
  updateClass,
  deleteClass,
  deleteStudyMaterial,
  publishCourse,
  unpublishCourse,
  uploadClassMedia,
  updateCourseDescriptions,
  createFullCourse,
  testUpdateCourseActiveStatus
} = require('../../controllers/Admin/courseController');
const adminAuthMiddleware = require('../../middlewares/Admin/authMiddleware');
const upload = require('../../middlewares/uploadMiddleware');

const router = express.Router();

router.use(adminAuthMiddleware);

// Clean professional routes
router.post('/', upload.fields([{ name: 'thumbnail', maxCount: 1 }]), createCourseShell); // create shell
router.put('/:id', upload.none(), updateCourseShell); // update shell
router.put(
  '/:id/basics',
  upload.fields([{ name: 'thumbnail', maxCount: 1 }]),
  updateCourseBasic
);
router.put(
  '/:id/content',
  upload.fields([{ name: 'studyMaterialFiles', maxCount: 50 }]),
  updateCourseContent
);
router.put(
  '/:id/descriptions',
  updateCourseDescriptions
);
router.delete('/:id/study-materials/:materialId', deleteStudyMaterial);
router.post(
  '/:id/tutors',
  upload.fields([{ name: 'tutorImages', maxCount: 10 }]),
  addTutors
);
router.put(
  '/:id/tutors/:tutorId',
  upload.fields([{ name: 'tutorImage', maxCount: 1 }]),
  updateTutor
);
router.delete('/:id/tutors/:tutorId', deleteTutor);
router.post(
  '/:id/classes',
  upload.fields([
    { name: 'classThumbnails', maxCount: 50 },
    { name: 'classLecturePics', maxCount: 50 },
    { name: 'classVideos', maxCount: 50 },
  ]),
  addClassesToCourse
);
router.put(
  '/:id/classes/:classId',
  upload.fields([
    { name: 'classThumbnail', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
    { name: 'classLecturePic', maxCount: 1 },
    { name: 'lecturePhoto', maxCount: 1 },
    { name: 'classVideo', maxCount: 1 },
    { name: 'video', maxCount: 1 },
  ]),
  updateClass
);
router.put(
  '/:id/classes/:classId/media',
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'lecturePhoto', maxCount: 1 },
    { name: 'video', maxCount: 1 },
  ]),
  uploadClassMedia
);
router.delete('/:id/classes/:classId', deleteClass);
router.patch('/:id/publish', publishCourse);
router.patch('/:id/unpublish', unpublishCourse);
router.patch('/:id/test-active-status', testUpdateCourseActiveStatus);

// Legacy all-in-one create/update if needed
router.post(
  '/all-in-one',
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'tutorImages', maxCount: 10 },
    { name: 'classThumbnails', maxCount: 50 },
    { name: 'classLecturePics', maxCount: 50 },
    { name: 'classVideos', maxCount: 50 },
    { name: 'studyMaterialFiles', maxCount: 50 },
  ]),
  createCourse
);

// New endpoint for creating a complete course in one API call
router.post(
  '/full',
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'tutorImages', maxCount: 10 },
    { name: 'classThumbnails', maxCount: 50 },
    { name: 'classLecturePics', maxCount: 50 },
    { name: 'classVideos', maxCount: 50 },
    { name: 'studyMaterialFiles', maxCount: 50 },
  ]),
  createFullCourse
);

router.get('/', getCourses);
router.get('/:id', getCourseById);

// SOLUTION 2: Change to PATCH for partial updates (better REST practice)
router.patch(
  '/:id/all-in-one',
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'tutorImages', maxCount: 10 },
    { name: 'classThumbnails', maxCount: 50 },
    { name: 'classLecturePics', maxCount: 50 },
    { name: 'classVideos', maxCount: 50 },
    { name: 'studyMaterialFiles', maxCount: 50 },
  ]),
  updateCourse
);

router.delete('/:id', deleteCourse);

module.exports = router;
```

---

## User Routes

### User/courseRoutes.js
```javascript
const express = require('express');
const { 
  listCourses, 
  getCourseById, 
  getCourseClass, 
  initiateCoursePurchase
} = require('../../controllers/User/courseController');
const userAuthMiddleware = require('../../middlewares/User/authMiddleware');
const checkContentAccess = require('../../middlewares/checkContentAccess');

const router = express.Router();

// All course routes require authenticated user
router.use(userAuthMiddleware);

router.get('/courses', listCourses);
router.get('/courses/:id', getCourseById);
router.get('/courses/:courseId/classes/:classId', checkContentAccess, getCourseClass);
router.post('/courses/:courseId/purchase', initiateCoursePurchase);

module.exports = router;
```

---

## Summary

This documentation contains the complete code for the Online Courses module in the Brain Buzz backend, including:

1. **Models**: Course model with all sub-schemas (tutor, class, study material)
2. **Admin Controllers**: Full CRUD operations for courses with complex file upload handling
3. **User Controllers**: Course browsing, access control, and purchase functionality
4. **Admin Routes**: Complete routing with proper middleware and file upload configurations
5. **User Routes**: Secure routes with authentication and content access controls

The system handles complex functionality including:
- Multi-step course creation process
- File uploads to Cloudinary for images, videos and documents
- Access control with free vs paid content (first 2 classes are free)
- Category and subcategory management
- Tutor management with photo uploads
- Class management with video, thumbnail, and lecture photo uploads
- Study material management
- Purchase validation and access checking
- Content type validation
- Language and validity period management

All code is production-ready with proper error handling, validation, and security measures.thumbnailUrl: cat.thumbnailUrl
            });
          }
        });
      }
    });

    return res.status(200).json({ data: categories });
  } catch (error) {
    console.error('Error fetching course categories:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get distinct subcategories for courses based on category and language (admin - shows all courses regardless of active status)
exports.getCourseSubCategories = async (req, res) => {
  try {
    const { category, language, lang } = req.query;
    
    const filter = {
      contentType: 'ONLINE_COURSE',
      categories: category
    };

    // Handle language filter
    if (language) {
      filter.languages = language;
    } else if (lang) {
      const escapeRegex = (s) => s.replace(/[.*+?^${}()|[]\\]/g, '\\$&');
      const langDoc = await Language.findOne({
        $or: [
          { code: lang.toLowerCase() },
          { name: { $regex: `^${escapeRegex(lang)}$`, $options: 'i' } },
        ],
      });
      if (langDoc) {
        filter.languages = langDoc._id;
      }
    }

    const courses = await Course.find(filter).populate('subCategories', 'name slug description thumbnailUrl');

    // Extract unique subcategories
    const subCategories = [];
    const subCategoryIds = new Set();
    
    courses.forEach(course => {
      if (course.subCategories) {
        course.subCategories.forEach(subCat => {
          if (!subCategoryIds.has(subCat._id.toString())) {
            subCategoryIds.add(subCat._id.toString());
            subCategories.push({
              _id: subCat._id,
              name: subCat.name,
              slug: subCat.slug,
              description: subCat.description,
              thumbnailUrl: subCat.thumbnailUrl
            });
          }
        });
      }
    });

    return res.status(200).json({ data: subCategories });
  } catch (error) {
    console.error('Error fetching course subcategories:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update course (supports replacing thumbnail and tutor images)
// Supports both formats:
// 1. Wrapped format: course={...}
// 2. Direct fields: name=..., startDate=..., etc.
exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;

    // SOLUTION 2: Support both wrapped and direct field formats
    let courseData = {};
    
    if (req.body.course) {
      // Wrapped format (backward compatible)
      courseData = JSON.parse(req.body.course);
    } else {
      // Direct fields format (better DX)
      courseData = req.body;
    }

    const {
      contentType,
      name,
      courseType,
      startDate,
      categoryIds,
      subCategoryIds,
      languageIds,
      validityIds,
      originalPrice,
      discountPrice,
      discountPercent,
      pricingNote,
      shortDescription,
      detailedDescription,
      tutors,
      classes,
      studyMaterials,
      isActive,
    } = courseData;

    const updates = {};

    if (contentType) updates.contentType = contentType;
    if (name) updates.name = name;
    if (courseType) updates.courseType = courseType;
    if (startDate) updates.startDate = startDate;
    if (categoryIds) updates.categories = categoryIds;
    if (subCategoryIds) updates.subCategories = subCategoryIds;
    if (languageIds) updates.languages = languageIds;
    if (validityIds) updates.validities = validityIds;
    if (typeof originalPrice !== 'undefined') updates.originalPrice = originalPrice;
    if (typeof discountPrice !== 'undefined') updates.discountPrice = discountPrice;
    if (typeof discountPercent !== 'undefined') updates.discountPercent = discountPercent;
    if (typeof pricingNote !== 'undefined') updates.pricingNote = pricingNote;
    if (typeof shortDescription !== 'undefined') updates.shortDescription = shortDescription;
    if (typeof detailedDescription !== 'undefined') updates.detailedDescription = detailedDescription;
    if (typeof isActive !== 'undefined') updates.isActive = isActive;

    // Handle thumbnail upload
    if (req.files && req.files.thumbnail && req.files.thumbnail[0]) {
      const thumbFile = req.files.thumbnail[0];
      const uploadResult = await uploadToCloudinary(thumbFile.buffer, 'brainbuzz/courses/thumbnails');
      updates.thumbnailUrl = uploadResult.secure_url;
    }

    // Handle tutor images
    if (Array.isArray(tutors)) {
      const tutorImages = (req.files && req.files.tutorImages) || [];
      const finalTutors = tutors.map((tutor, index) => {
        const t = { ...tutor };
        if (tutorImages[index]) {
          t._fileBuffer = tutorImages[index].buffer;
        }
        return t;
      });

      for (const tutor of finalTutors) {
        if (tutor._fileBuffer) {
          const uploadResult = await uploadToCloudinary(
            tutor._fileBuffer,
            'brainbuzz/courses/tutors',
            'image'
          );
          tutor.photoUrl = uploadResult.secure_url;
          delete tutor._fileBuffer;
        }
      }

      updates.tutors = finalTutors;
    }

    // Handle classes media
    if (Array.isArray(classes)) {
      const classThumbnails = (req.files && req.files.classThumbnails) || [];
      const classLecturePics = (req.files && req.files.classLecturePics) || [];
      const classVideos = (req.files && req.files.classVideos) || [];

      const finalClasses = classes.map((cls, index) => {
        const c = { ...cls };
        if (classThumbnails[index]) {
          c._thumbBuffer = classThumbnails[index].buffer;
        }
        if (classLecturePics[index]) {
          c._lectureBuffer = classLecturePics[index].buffer;
        }
        if (classVideos[index]) {
          c._videoBuffer = classVideos[index].buffer;
        }
        return c;
      });

      for (const cls of finalClasses) {
        if (cls._thumbBuffer) {
          const uploadResult = await uploadToCloudinary(
            cls._thumbBuffer,
            'brainbuzz/courses/classes/thumbnails',
            'image'
          );
          cls.thumbnailUrl = uploadResult.secure_url;
          delete cls._thumbBuffer;
        }
        if (cls._lectureBuffer) {
          const uploadResult = await uploadToCloudinary(
            cls._lectureBuffer,
            'brainbuzz/courses/classes/lectures',
            'image'
          );
          cls.lecturePhotoUrl = uploadResult.secure_url;
          delete cls._lectureBuffer;
        }
        if (cls._videoBuffer) {
          const uploadResult = await uploadToCloudinary(
            cls._videoBuffer,
            'brainbuzz/courses/classes/videos',
            'video'
          );
          cls.videoUrl = uploadResult.secure_url;
          delete cls._videoBuffer;
        }
      }

      updates.classes = finalClasses;
    }

    // Handle study materials
    if (Array.isArray(studyMaterials)) {
      const studyFiles = (req.files && req.files.studyMaterialFiles) || [];

      const finalStudyMaterials = studyMaterials.map((sm, index) => {
        const s = { ...sm };
        if (studyFiles[index]) {
          s._fileBuffer = studyFiles[index].buffer;
        }
        return s;
      });

      for (const sm of finalStudyMaterials) {
        if (sm._fileBuffer) {
          const uploadResult = await uploadToCloudinary(
            sm._fileBuffer,
            'brainbuzz/courses/study-materials',
            'raw'
          );
          sm.fileUrl = uploadResult.secure_url;
          delete sm._fileBuffer;
        }
      }

      updates.studyMaterials = finalStudyMaterials;
    }
    
    // Auto-mark first 2 classes as free if classes are being updated
    if (updates.classes && Array.isArray(updates.classes)) {
      updates.classes.forEach((cls, index) => {
        cls.isFree = index < 2;
      });
    }

    const course = await Course.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    })
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .populate('validities', 'label durationInDays');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    return res.status(200).json({
      message: 'Course updated successfully',
      data: course,
    });
  } catch (error) {
    console.error('Error updating course:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete course (hard delete)
exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findByIdAndDelete(id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    return res.status(200).json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add classes to existing course
exports.addClassesToCourse = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.body.classes) {
      return res.status(400).json({ message: 'Classes data is required' });
    }

    const classes = JSON.parse(req.body.classes);

    if (!Array.isArray(classes) || classes.length === 0) {
      return res.status(400).json({ message: 'Classes must be a non-empty array' });
    }

    // Handle class media (thumbnails, lecture pics, videos) matched by index
    const classThumbnails = (req.files && req.files.classThumbnails) || [];
    const classLecturePics = (req.files && req.files.classLecturePics) || [];
    const classVideos = (req.files && req.files.classVideos) || [];

    const finalClasses = classes.map((cls, index) => {
      const c = { ...cls };
      if (classThumbnails[index]) {
        c._thumbBuffer = classThumbnails[index].buffer;
      }
      if (classLecturePics[index]) {
        c._lectureBuffer = classLecturePics[index].buffer;
      }
      if (classVideos[index]) {
        c._videoBuffer = classVideos[index].buffer;
      }
      return c;
    });

    for (const cls of finalClasses) {
      if (cls._thumbBuffer) {
        const uploadResult = await uploadToCloudinary(
          cls._thumbBuffer,
          'brainbuzz/courses/classes/thumbnails',
          'image'
        );
        cls.thumbnailUrl = uploadResult.secure_url;
        delete cls._thumbBuffer;
      }
      if (cls._lectureBuffer) {
        const uploadResult = await uploadToCloudinary(
          cls._lectureBuffer,
          'brainbuzz/courses/classes/lectures',
          'image'
        );
        cls.lecturePhotoUrl = uploadResult.secure_url;
        delete cls._lectureBuffer;
      }
      if (cls._videoBuffer) {
        const uploadResult = await uploadToCloudinary(
          cls._videoBuffer,
          'brainbuzz/courses/classes/videos',
          'video'
        );
        cls.videoUrl = uploadResult.secure_url;
        delete cls._videoBuffer;
      }
    }

    // Add the new classes to the existing ones
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Append new classes to existing classes
    course.classes.push(...finalClasses);
    
    // Auto-mark first 2 classes as free
    if (course.classes && Array.isArray(course.classes)) {
      course.classes.forEach((cls, index) => {
        cls.isFree = index < 2;
      });
    }

    // Save the updated course
    await course.save();

    // Populate the updated course data
    const populatedCourse = await Course.findById(id)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .populate('validities', 'label durationInDays');

    return res.status(200).json({
      message: 'Classes added successfully',
      data: populatedCourse,
    });
  } catch (error) {
    console.error('Error adding classes to course:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update course descriptions and pricing note
exports.updateCourseDescriptions = async (req, res) => {
  try {
    const { id } = req.params;
    const { shortDescription, detailedDescription, pricingNote } = req.body;
    
    const updates = {};
    if (typeof shortDescription !== 'undefined') updates.shortDescription = shortDescription;
    if (typeof detailedDescription !== 'undefined') updates.detailedDescription = detailedDescription;
    if (typeof pricingNote !== 'undefined') updates.pricingNote = pricingNote;
    
    const course = await Course.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .populate('validities', 'label durationInDays');
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    return res.status(200).json({
      message: 'Course descriptions updated successfully',
      data: course,
    });
  } catch (error) {
    console.error('Error updating course descriptions:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Publish course (set isActive to true)
exports.publishCourse = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate that the course has all required fields before publishing
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if course has essential data
    if (!course.name || course.name.startsWith('Draft Course')) {
      return res.status(400).json({ 
        message: 'Course must have a proper name before publishing' 
      });
    }
    
    if (!course.categories || course.categories.length === 0) {
      return res.status(400).json({ 
        message: 'Course must have at least one category before publishing' 
      });
    }
    
    if (!course.subCategories || course.subCategories.length === 0) {
      return res.status(400).json({ 
        message: 'Course must have at least one subcategory before publishing' 
      });
    }
    
    if (course.originalPrice == null || course.originalPrice < 0) {
      return res.status(400).json({ 
        message: 'Course must have a valid price before publishing' 
      });
    }
    
    // Update the course to be active
    course.isActive = true;
    await course.save();
    
    const populatedCourse = await Course.findById(id)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .populate('validities', 'label durationInDays');
    
    return res.status(200).json({
      message: 'Course published successfully',
      data: populatedCourse,
    });
  } catch (error) {
    console.error('Error publishing course:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Upload media for a specific class (video, thumbnail, lecture photo)
exports.uploadClassMedia = async (req, res) => {
  try {
    const { id, classId } = req.params;
    
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    const classObj = course.classes.id(classId);
    if (!classObj) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    // Handle file uploads
    const thumbnail = req.files?.thumbnail?.[0];
    const lecturePhoto = req.files?.lecturePhoto?.[0];
    const video = req.files?.video?.[0];
    
    let updated = false;
    
    if (thumbnail) {
      const uploadResult = await uploadToCloudinary(
        thumbnail.buffer,
        'brainbuzz/courses/classes/thumbnails',
        'image'
      );
      classObj.thumbnailUrl = uploadResult.secure_url;
      updated = true;
    }
    
    if (lecturePhoto) {
      const uploadResult = await uploadToCloudinary(
        lecturePhoto.buffer,
        'brainbuzz/courses/classes/lectures',
        'image'
      );
      classObj.lecturePhotoUrl = uploadResult.secure_url;
      updated = true;
    }
    
    if (video) {
      const uploadResult = await uploadToCloudinary(
        video.buffer,
        'brainbuzz/courses/classes/videos',
        'video'
      );
      classObj.videoUrl = uploadResult.secure_url;
      updated = true;
    }
    
    if (!updated) {
      return res.status(400).json({ 
        message: 'At least one file (thumbnail, lecturePhoto, or video) is required' 
      });
    }
    
    await course.save();
    
    const populatedCourse = await Course.findById(id)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .populate('validities', 'label durationInDays');
    
    return res.status(200).json({
      message: 'Class media uploaded successfully',
      data: populatedCourse,
    });
  } catch (error) {
    console.error('Error uploading class media:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Unpublish course (set isActive to false)
exports.unpublishCourse = async (req, res) => {
  try {
    const { id } = req.params;
    
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Update the course to be inactive
    course.isActive = false;
    await course.save();
    
    const populatedCourse = await Course.findById(id)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .populate('validities', 'label durationInDays');
    
    return res.status(200).json({
      message: 'Course unpublished successfully',
      data: populatedCourse,
    });
  } catch (error) {
    console.error('Error unpublishing course:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Test function to debug course isActive updates
exports.testUpdateCourseActiveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    console.log('Received update request for course:', id);
    console.log('Requested isActive value:', isActive);
    console.log('Type of isActive:', typeof isActive);
    
    // Validate input
    if (typeof isActive === 'undefined') {
      return res.status(400).json({ 
        message: 'isActive field is required', 
        received: req.body 
      });
    }
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ 
        message: 'isActive must be a boolean value (true or false)', 
        received: isActive,
        type: typeof isActive
      });
    }
    
    // Find the course
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    console.log('Current course isActive value:', course.isActive);
    
    // Update the course
    course.isActive = isActive;
    const savedCourse = await course.save();
    
    console.log('Updated course isActive value:', savedCourse.isActive);
    
    const populatedCourse = await Course.findById(id)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .populate('validities', 'label durationInDays');
    
    return res.status(200).json({
      message: `Course isActive status updated to ${isActive}`,
      data: populatedCourse,
      debug: {
        requestedValue: isActive,
        previousValue: course.isActive,
        updatedValue: savedCourse.isActive
      }
    });
  } catch (error) {
    console.error('Error updating course isActive status:', error);
    return res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
```

---

## User Controllers

### User/courseController.js
```javascript
const Course = require('../../models/Course/Course');
const Language = require('../../models/Course/Language');
const { PurchaseService } = require('../../../services');

// Helper function to handle database errors
const handleDatabaseError = (error) => {
  console.error('Database error:', error);
  
  // Check for specific error types and return appropriate status codes
  if (error.name === 'CastError') {
    return {
      statusCode: 400,
      message: 'Invalid ID format',
      error: error.message
    };
  }
  
  if (error.name === 'ValidationError') {
    return {
      statusCode: 400,
      message: 'Validation error',
      error: error.message
    };
  }
  
  if (error.code === 11000) {
    return {
      statusCode: 409,
      message: 'Duplicate entry error',
      error: error.message
    };
  }
  
  // Default error response
  return {
    statusCode: 500,
    message: 'Internal server error',
    error: error.message
  };
};

// Helper function to check if user has purchased a course
const checkCoursePurchase = async (userId, courseId) => {
  if (!userId) return false;
  try {
    return await PurchaseService.hasAccess(userId, 'online_course', courseId);
  } catch (error) {
    console.error('Error checking course purchase:', error);
    return false;
  }
};

// Helper function to calculate finalPrice from originalPrice and discountPrice
const calculateFinalPrice = (originalPrice, discountPrice) => {
  const discountAmount = typeof discountPrice === 'number' && discountPrice >= 0
    ? discountPrice
    : 0;
  return Math.max(0, originalPrice - discountAmount);
};

// Helper function to process classes based on access
const processClassesForUser = (classes, hasPurchasedAndValid, isAdmin = false) => {
  // Sort classes by order field if available, otherwise keep original order
  const sortedClasses = [...classes].sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    if (a.order !== undefined) return -1;
    if (b.order !== undefined) return 1;
    return 0;
  });

  // Admin has full access to all classes
  if (isAdmin) {
    return sortedClasses.map(cls => ({
      ...cls.toObject ? cls.toObject() : cls,
      isLocked: false,
      hasAccess: true,
    }));
  }

  // Process classes: use isFree field, rest require purchase and valid expiry
  return sortedClasses.map((cls, index) => {
    // First 2 classes are free for users
    const isFreeClass = index < 2;
    const hasAccess = isFreeClass || (hasPurchasedAndValid === true);
    const isLocked = !hasAccess;

    const classObj = cls.toObject ? cls.toObject() : cls;
    
    // If locked, hide videoUrl but keep other metadata
    if (isLocked) {
      const { videoUrl, ...rest } = classObj;
      return {
        ...rest,
        isFree: isFreeClass,
        isLocked: true,
        hasAccess: false,
      };
    }

    return {
      ...classObj,
      isFree: isFreeClass,
      isLocked: false,
      hasAccess: true,
    };
  });
};

// Public: list courses (primarily ONLINE_COURSE) with optional filters
exports.listCourses = async (req, res) => {
  try {
    const { contentType, category, subCategory, language, lang } = req.query;
    const userId = req.user?._id;

    const filter = {
      isActive: true,
    };

    // default to ONLINE_COURSE when not provided
    filter.contentType = contentType || 'ONLINE_COURSE';

    if (category) filter.categories = category;
    if (subCategory) filter.subCategories = subCategory;
    if (language) filter.languages = language;
    if (lang) {
      const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const langDoc = await Language.findOne({
        $or: [
          { code: lang.toLowerCase() },
          { name: { $regex: `^${escapeRegex(lang)}$`, $options: 'i' } },
        ],
      });
      if (!langDoc) {
        return res.status(400).json({ message: 'Invalid language code or name' });
      }
      filter.languages = langDoc._id;
    }

    const courses = await Course.find(filter)
      .populate('categories', 'name slug description thumbnailUrl')
      .populate('subCategories', 'name slug description thumbnailUrl')
      .populate('languages', 'name code')
      .populate('validities', 'label durationInDays');

    // Process courses to return only specified fields
    const processedCourses = await Promise.all(
      courses.map(async (course) => {
        const hasPurchased = await checkCoursePurchase(userId, course._id);
        const courseObj = course.toObject();
        
        // Calculate finalPrice
        const finalPrice = calculateFinalPrice(courseObj.originalPrice, courseObj.discountPrice);
        
        // Return only the requested fields
        const filteredCourse = {
          _id: courseObj._id,
          name: courseObj.name,
          thumbnailUrl: courseObj.thumbnailUrl,
          originalPrice: courseObj.originalPrice,
          discountPrice: courseObj.discountPrice,
          finalPrice: finalPrice,
          languages: courseObj.languages,
          validities: courseObj.validities,
          hasPurchased: hasPurchased
        };
        
        return filteredCourse;
      })
    );

    return res.status(200).json({ data: processedCourses });
  } catch (error) {
    const errorResponse = handleDatabaseError(error);
    return res.status(errorResponse.statusCode).json({
      message: errorResponse.message,
      error: errorResponse.error
    });
  }
};

// Public: get single course by id
exports.getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;
    const userRole = req.user?.role;

    const course = await Course.findOne({
      _id: id,
      isActive: true,
    })
      .populate('categories', 'name slug description thumbnailUrl')
      .populate('subCategories', 'name slug description thumbnailUrl')
      .populate('languages', 'name code')
      .populate('validities', 'label durationInDays');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check access based on role
    let hasPurchased = false;
    let isValid = false;
    let accessInfo = { hasPurchased: false, isValid: false };

    // Admin has full access to all classes
    if (userRole === 'ADMIN') {
      // Admin bypass - no purchase needed
    } else {
      // Check user purchase access using helper function
      const checkUserPurchaseAccess = require('../../helpers/checkUserPurchaseAccess');
      accessInfo = await checkUserPurchaseAccess({ 
        userId, 
        itemType: 'online_course', 
        itemId: id 
      });
      hasPurchased = accessInfo.hasPurchased;
      isValid = accessInfo.isValid;
    }

    // Process classes based on access (admin has full access)
    const courseObj = course.toObject();
    const isAdmin = userRole === 'ADMIN';
    courseObj.classes = processClassesForUser(course.classes, hasPurchased && isValid, isAdmin);
    courseObj.hasPurchased = isAdmin ? true : hasPurchased;
    courseObj.isPurchaseValid = isAdmin ? true : isValid;
    courseObj.expiryDate = isAdmin ? null : accessInfo.expiryDate;
    
    // Calculate and add finalPrice
    if (courseObj.originalPrice !== undefined) {
      courseObj.finalPrice = calculateFinalPrice(courseObj.originalPrice, courseObj.discountPrice);
    }

    return res.status(200).json({ data: courseObj });
  } catch (error) {
    const errorResponse = handleDatabaseError(error);
    return res.status(errorResponse.statusCode).json({
      message: errorResponse.message,
      error: errorResponse.error
    });
  }
};

// Get a specific course class/video
exports.getCourseClass = async (req, res) => {
  try {
    const { courseId, classId } = req.params;
    const userId = req.user?._id;

    const course = await Course.findOne({
      _id: courseId,
      isActive: true,
    })
      .populate('categories', 'name slug description thumbnailUrl')
      .populate('subCategories', 'name slug description thumbnailUrl')
      .populate('languages', 'name code')
      .populate('validities', 'label durationInDays');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Find the specific class
    const classObj = course.classes.id(classId);
    if (!classObj) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Check if user has purchased the course or if it's a free class
    const hasPurchased = await checkCoursePurchase(userId, course._id);
    // First 2 classes are free
    const classIndex = course.classes.findIndex(c => c._id.toString() === classId);
    const isFreeClass = classIndex < 2;
    const hasAccess = isFreeClass || hasPurchased;

    if (!hasAccess) {
      return res.status(403).json({ 
        success: false, 
        message: 'Please purchase this course to access this content' 
      });
    }

    return res.status(200).json({ 
      success: true,
      data: classObj 
    });
  } catch (error) {
    const errorResponse = handleDatabaseError(error);
    return res.status(errorResponse.statusCode).json({
      message: errorResponse.message,
      error: errorResponse.error
    });
  }
};

// Initiate purchase for an online course (mock payment creation)
exports.initiateCoursePurchase = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;
    const { couponCode } = req.body;

    const course = await Course.findOne({ _id: courseId, isActive: true }).select('originalPrice discountPrice name');
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Already purchased?
    const hasAccess = await PurchaseService.hasAccess(userId, 'online_course', courseId);
    if (hasAccess) {
      return res.status(400).json({ success: false, message: 'You have already purchased this course' });
    }

    // Create mock payment id and purchase record
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const purchase = await PurchaseService.createPurchase(
      userId,
      [{ itemType: 'online_course', itemId: courseId }],
      paymentId,
      couponCode
    );

    return res.status(200).json({
      success: true,
      data: {
        paymentId: purchase.paymentId,
        amount: purchase.finalAmount,
        currency: 'INR',
        couponApplied: !!purchase.coupon,
        discountAmount: purchase.discountAmount,
      },
    });
  } catch (error) {
    const errorResponse = handleDatabaseError(error);
    return res.status(errorResponse.statusCode).json({
      success: false,
      message: errorResponse.message,
      error: errorResponse.error
    });
  }
};

// Get distinct categories for active courses
exports.getCourseCategories = async (req, res) => {
  try {
    const { contentType } = req.query;
    
    // Default to ONLINE_COURSE
    const type = contentType || 'ONLINE_COURSE';
    
    // Find active courses and get distinct categories
    const courses = await Course.find({ 
      contentType: type, 
      isActive: true 
    }).populate('categories', 'name slug description thumbnailUrl');

    // Extract unique categories
    const categories = [];
    const categoryIds = new Set();
    
    courses.forEach(course => {
      if (course.categories) {
        course.categories.forEach(cat => {
          if (!categoryIds.has(cat._id.toString())) {
            categoryIds.add(cat._id.toString());
            categories.push({
              _id: cat._id,
              name: cat.name,
              slug: cat.slug,
              description: cat.description,
             