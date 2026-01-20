# Online Courses API Testing Guide

This guide provides step-by-step instructions for testing all Online Courses-related APIs, including required request bodies, endpoints, and expected responses.

## Important Note on Request Format

Online Courses APIs have different request formats depending on the operation:
1. Basic CRUD operations (create/update courses) require form-data with text fields and file uploads
2. Nested operations (adding classes, tutors, study materials) typically use JSON payloads
3. File uploads (thumbnails, class media, study materials) require multipart form-data

## Base URL
```
https://brain-buzz-web.vercel.app/
```

## Authentication
Most admin endpoints require authentication. Ensure you have a valid admin JWT token before making requests.

User endpoints for course access require a valid user JWT token. Additionally, the purchase check middleware protects user course endpoints to ensure users have proper access to content.

---

## ADMIN APIs

### 1. COURSES - Basic CRUD Operations

#### 1.1 Create Course Shell (Recommended Approach)
**Endpoint:** `POST /api/admin/courses`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`
- `Content-Type: multipart/form-data`

**Form Fields:**
- `name`: "Complete UPSC Prelims Course"
- `courseType`: "PRELIMS"
- `startDate`: "2025-01-15T00:00:00Z"
- `originalPrice`: 4999
- `discountPrice`: 999
- `pricingNote`: "Limited time offer"
- `shortDescription`: "Comprehensive course covering all UPSC Prelims topics"
- `detailedDescription`: "Detailed course description with syllabus..."
- `isActive`: true
- `accessType`: "PAID"
- `categoryIds[]`: (array of category IDs)
- `subCategoryIds[]`: (array of sub-category IDs)
- `languageIds[]`: (array of language IDs)
- `validityIds[]`: (array of validity option IDs)
- `thumbnail`: (select your image file)

**Expected Response:**
```json
{
  "success": true,
  "message": "Course draft created. Proceed with next steps.",
  "data": {
    "_id": "course_id",
    "contentType": "ONLINE_COURSE",
    "accessType": "PAID",
    "name": "Draft Course 1700000000000",
    "startDate": "2025-01-15T00:00:00Z",
    "categories": ["category_id_1"],
    "subCategories": ["subcategory_id_1"],
    "languages": [],
    "validities": [],
    "thumbnailUrl": "https://res.cloudinary.com/.../thumbnail.jpg",
    "originalPrice": 0,
    "discountPrice": 0,
    "discountPercent": 0,
    "pricingNote": "",
    "shortDescription": "",
    "detailedDescription": "",
    "tutors": [],
    "classes": [],
    "studyMaterials": [],
    "isActive": true,
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

#### 1.2 Update Course Basics
**Endpoint:** `PUT /api/admin/courses/:id/basics`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`
- `Content-Type: multipart/form-data`

**Form Fields:**
- `name`: "Complete UPSC Prelims Course"
- `originalPrice`: 4999
- `discountPrice`: 999
- `courseType`: "PRELIMS"
- `languageIds[]`: (array of language IDs)
- `validityIds[]`: (array of validity option IDs)
- `thumbnail`: (select your image file)

**Expected Response:**
```json
{
  "success": true,
  "message": "Course basic details updated",
  "data": {
    "_id": "course_id",
    "contentType": "ONLINE_COURSE",
    "accessType": "PAID",
    "name": "Complete UPSC Prelims Course",
    "courseType": "PRELIMS",
    "startDate": "2025-01-15T00:00:00Z",
    "categories": ["category_id_1"],
    "subCategories": ["subcategory_id_1"],
    "languages": ["language_id_1"],
    "validities": ["validity_id_1"],
    "thumbnailUrl": "https://res.cloudinary.com/.../updated_thumbnail.jpg",
    "originalPrice": 4999,
    "discountPrice": 999,
    "pricingNote": "",
    "shortDescription": "",
    "detailedDescription": "",
    "tutors": [],
    "classes": [],
    "studyMaterials": [],
    "isActive": true,
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

#### 1.3 List All Courses
**Endpoint:** `GET /api/admin/courses`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`

**Query Parameters (optional):**
- `contentType`: Filter by content type (default: ONLINE_COURSE)
- `category`: Filter by category ID
- `subCategory`: Filter by sub-category ID
- `language`: Filter by language ID
- `isActive`: Filter by active status (true/false)
- `minPrice`: Minimum price filter
- `maxPrice`: Maximum price filter

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "course_id",
      "contentType": "ONLINE_COURSE",
      "accessType": "PAID",
      "name": "Complete UPSC Prelims Course",
      "courseType": "PRELIMS",
      "startDate": "2025-01-15T00:00:00Z",
      "categories": [],
      "subCategories": [],
      "languages": [],
      "validities": [],
      "thumbnailUrl": "https://res.cloudinary.com/.../thumbnail.jpg",
      "originalPrice": 4999,
      "discountPrice": 999,
      "pricingNote": "Limited time offer",
      "shortDescription": "Comprehensive course covering all UPSC Prelims topics",
      "detailedDescription": "Detailed course description with syllabus...",
      "tutors": [],
      "classes": [],
      "studyMaterials": [],
      "isActive": true,
      "createdAt": "timestamp",
      "updatedAt": "timestamp",
      "finalPrice": 4000
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 10
  }
}
```

#### 1.4 Get Single Course
**Endpoint:** `GET /api/admin/courses/:id`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "_id": "course_id",
    "contentType": "ONLINE_COURSE",
    "accessType": "PAID",
    "name": "Complete UPSC Prelims Course",
    "courseType": "PRELIMS",
    "startDate": "2025-01-15T00:00:00Z",
    "categories": [
      {
        "_id": "category_id",
        "name": "UPSC",
        "slug": "upsc"
      }
    ],
    "subCategories": [
      {
        "_id": "subcategory_id",
        "name": "Prelims",
        "slug": "prelims"
      }
    ],
    "languages": [
      {
        "_id": "language_id",
        "name": "English",
        "code": "en"
      }
    ],
    "validities": [
      {
        "_id": "validity_id",
        "label": "6 Months",
        "durationInDays": 180
      }
    ],
    "thumbnailUrl": "https://res.cloudinary.com/.../thumbnail.jpg",
    "originalPrice": 4999,
    "discountPrice": 999,
    "pricingNote": "Limited time offer",
    "shortDescription": "Comprehensive course covering all UPSC Prelims topics",
    "detailedDescription": "Detailed course description with syllabus...",
    "tutors": [
      {
        "_id": "tutor_id",
        "photoUrl": "https://res.cloudinary.com/.../tutor.jpg",
        "name": "Dr. John Doe",
        "qualification": "PhD",
        "subject": "History"
      }
    ],
    "classes": [
      {
        "_id": "class_id",
        "title": "Introduction to Indian Polity",
        "topic": "Polity",
        "order": 1,
        "thumbnailUrl": "https://res.cloudinary.com/.../class_thumb.jpg",
        "lecturePhotoUrl": "https://res.cloudinary.com/.../class_lecture.jpg",
        "videoUrl": "https://res.cloudinary.com/.../class_video.mp4",
        "isFree": true,
        "isLocked": false,
        "hasAccess": true
      }
    ],
    "studyMaterials": [
      {
        "_id": "material_id",
        "title": "Polity Study Material.pdf",
        "description": "Complete study material for polity",
        "fileUrl": "https://res.cloudinary.com/.../polity.pdf"
      }
    ],
    "isActive": true,
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

#### 1.5 Update Entire Course
**Endpoint:** `PATCH /api/admin/courses/:id/all-in-one`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`
- `Content-Type: multipart/form-data`

**Form Fields:**
- All course fields as needed
- File uploads for thumbnail, tutor images, class media, study materials

**Expected Response:**
```json
{
  "success": true,
  "message": "Course updated successfully",
  "data": {
    "_id": "course_id",
    "contentType": "ONLINE_COURSE",
    "accessType": "PAID",
    "name": "Updated UPSC Prelims Course",
    "...": "..."
  }
}
```

#### 1.6 Publish Course
**Endpoint:** `PATCH /api/admin/courses/:id/publish`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`

**Expected Response:**
```json
{
  "success": true,
  "message": "Course published successfully",
  "data": {
    "_id": "course_id",
    "contentType": "ONLINE_COURSE",
    "accessType": "PAID",
    "name": "Complete UPSC Prelims Course",
    "isActive": true,
    "...": "..."
  }
}
```

#### 1.7 Unpublish Course
**Endpoint:** `PATCH /api/admin/courses/:id/unpublish`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`

**Expected Response:**
```json
{
  "success": true,
  "message": "Course unpublished successfully",
  "data": {
    "_id": "course_id",
    "contentType": "ONLINE_COURSE",
    "accessType": "PAID",
    "name": "Complete UPSC Prelims Course",
    "isActive": false,
    "...": "..."
  }
}
```

#### 1.8 Delete Course
**Endpoint:** `DELETE /api/admin/courses/:id`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`

**Expected Response:**
```json
{
  "success": true,
  "message": "Course deleted successfully"
}
```

### 2. TUTORS - Within a Course

#### 2.1 Add Tutors to Course
**Endpoint:** `POST /api/admin/courses/:id/tutors`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`
- `Content-Type: multipart/form-data`

**Form Fields:**
- `tutors`: JSON array of tutor objects
- `tutorImages[]`: (select tutor image files - matched by index)

**Request Body (tutors field):**
```json
[
  {
    "name": "Dr. John Doe",
    "qualification": "PhD",
    "subject": "History"
  },
  {
    "name": "Prof. Jane Smith",
    "qualification": "M.Sc",
    "subject": "Geography"
  }
]
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Tutors added successfully",
  "data": {
    "_id": "course_id",
    "contentType": "ONLINE_COURSE",
    "accessType": "PAID",
    "name": "Complete UPSC Prelims Course",
    "tutors": [
      {
        "_id": "tutor_id_1",
        "photoUrl": "https://res.cloudinary.com/.../tutor1.jpg",
        "name": "Dr. John Doe",
        "qualification": "PhD",
        "subject": "History"
      },
      {
        "_id": "tutor_id_2",
        "photoUrl": "https://res.cloudinary.com/.../tutor2.jpg",
        "name": "Prof. Jane Smith",
        "qualification": "M.Sc",
        "subject": "Geography"
      }
    ],
    "...": "..."
  }
}
```

#### 2.2 Update Tutor in Course
**Endpoint:** `PUT /api/admin/courses/:id/tutors/:tutorId`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`
- `Content-Type: multipart/form-data`

**Form Fields:**
- `name`: "Updated Tutor Name"
- `qualification`: "Updated Qualification"
- `subject`: "Updated Subject"
- `tutorImage`: (select new tutor image)

**Expected Response:**
```json
{
  "success": true,
  "message": "Tutor updated",
  "data": {
    "_id": "course_id",
    "contentType": "ONLINE_COURSE",
    "accessType": "PAID",
    "name": "Complete UPSC Prelims Course",
    "tutors": [
      {
        "_id": "tutor_id",
        "photoUrl": "https://res.cloudinary.com/.../updated_tutor.jpg",
        "name": "Updated Tutor Name",
        "qualification": "Updated Qualification",
        "subject": "Updated Subject"
      }
    ],
    "...": "..."
  }
}
```

#### 2.3 Delete Tutor from Course
**Endpoint:** `DELETE /api/admin/courses/:id/tutors/:tutorId`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`

**Expected Response:**
```json
{
  "success": true,
  "message": "Tutor deleted",
  "data": {
    "_id": "course_id",
    "contentType": "ONLINE_COURSE",
    "accessType": "PAID",
    "name": "Complete UPSC Prelims Course",
    "tutors": [],
    "...": "..."
  }
}
```

### 3. CLASSES - Within a Course

#### 3.1 Add Classes to Course
**Endpoint:** `POST /api/admin/courses/:id/classes`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`
- `Content-Type: multipart/form-data`

**Form Fields:**
- `classes`: JSON array of class objects
- `classThumbnails[]`: (select class thumbnail files - matched by index)
- `classLecturePics[]`: (select class lecture photo files - matched by index)
- `classVideos[]`: (select class video files - matched by index)

**Note:** Only the first 2 classes in a course are automatically marked as free. The system automatically sets `isFree` to `true` for the first two classes based on their position, and `false` for subsequent classes. The `isFree` field is calculated dynamically and not stored in the database.

**Important Design Decision:** The `isFree` field is intentionally NOT stored in the database. Instead, FREE/PAID access is derived at runtime based on the class's position. This approach ensures:
- No database pollution with redundant fields
- Future-proof flexibility (can easily change "first 2 free" to "first 3 free")
- Consistent business logic enforcement

**Request Body (classes field):**
```json
[
  {
    "title": "Introduction to Indian Polity",
    "topic": "Polity",
    "order": 1
  },
  {
    "title": "Indian Constitution",
    "topic": "Polity",
    "order": 2
  },
  {
    "title": "Parliament and State Legislatures",
    "topic": "Polity",
    "order": 3
  }
]
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Classes added successfully",
  "data": {
    "_id": "course_id",
    "contentType": "ONLINE_COURSE",
    "accessType": "PAID",
    "name": "Complete UPSC Prelims Course",
    "classes": [
      {
        "_id": "class_id_1",
        "title": "Introduction to Indian Polity",
        "topic": "Polity",
        "order": 1,
        "thumbnailUrl": "https://res.cloudinary.com/.../class1_thumb.jpg",
        "lecturePhotoUrl": "https://res.cloudinary.com/.../class1_lecture.jpg",
        "videoUrl": "https://res.cloudinary.com/.../class1_video.mp4",
        "isFree": true
      },
      {
        "_id": "class_id_2",
        "title": "Indian Constitution",
        "topic": "Polity",
        "order": 2,
        "thumbnailUrl": "https://res.cloudinary.com/.../class2_thumb.jpg",
        "lecturePhotoUrl": "https://res.cloudinary.com/.../class2_lecture.jpg",
        "videoUrl": "https://res.cloudinary.com/.../class2_video.mp4",
        "isFree": true
      },
      {
        "_id": "class_id_3",
        "title": "Parliament and State Legislatures",
        "topic": "Polity",
        "order": 3,
        "thumbnailUrl": "https://res.cloudinary.com/.../class3_thumb.jpg",
        "lecturePhotoUrl": "https://res.cloudinary.com/.../class3_lecture.jpg",
        "videoUrl": "https://res.cloudinary.com/.../class3_video.mp4",
        "isFree": false
      }
    ],
    "...": "..."
  }
}
```

#### 3.2 Update Class in Course
**Endpoint:** `PUT /api/admin/courses/:id/classes/:classId`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`
- `Content-Type: application/json` or `Content-Type: multipart/form-data`

**Request Body (JSON for text fields only):**
```json
{
  "title": "Updated Introduction to Indian Polity",
  "topic": "Polity Fundamentals",
  "order": 1
}
```

**Form Fields (multipart/form-data for text fields and/or file uploads):**
- Text fields (optional):
  - `title`: (new class title)
  - `topic`: (new class topic)
  - `order`: (new class order)
- File uploads (optional):
  - `thumbnail` or `classThumbnail`: (select new thumbnail image)
  - `lecturePhoto` or `classLecturePic`: (select new lecture photo)
  - `video` or `classVideo`: (select new video file)

**Note:** The `isFree` flag is automatically determined by the system based on the class's position in the course. The first two classes are automatically marked as free, and subsequent classes are marked as paid. The `isFree` field is calculated dynamically and not stored in the database. Any value provided for `isFree` in the request body will be ignored.

**Access Control Logic:**
- **Admin View:** Admins can access ALL classes without restriction
- **User View (Non-Purchased):** First 2 classes → Free access, Remaining classes → "Buy to unlock"
- **User View (Purchased):** All classes → Unlocked

**Expected Response:**
```json
{
  "success": true,
  "message": "Class updated successfully",
  "data": {
    "_id": "course_id",
    "contentType": "ONLINE_COURSE",
    "accessType": "PAID",
    "name": "Updated UPSC Prelims Course",
    "classes": [
      {
        "_id": "class_id_1",
        "title": "Updated Introduction to Indian Polity",
        "topic": "Polity Fundamentals",
        "order": 1,
        "thumbnailUrl": "https://res.cloudinary.com/.../class1_thumb.jpg",
        "lecturePhotoUrl": "https://res.cloudinary.com/.../class1_lecture.jpg",
        "videoUrl": "https://res.cloudinary.com/.../class1_video.mp4",
        "isFree": true
      },
      "...": "..."
    ],
    "...": "..."
  }
}
```

#### 3.3 Delete Class from Course
**Endpoint:** `DELETE /api/admin/courses/:id/classes/:classId`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`

**Expected Response:**
```json
{
  "success": true,
  "message": "Class removed from course successfully",
  "data": {
    "_id": "course_id",
    "contentType": "ONLINE_COURSE",
    "accessType": "PAID",
    "name": "Updated UPSC Prelims Course",
    "classes": [
      {
        "_id": "class_id_2",
        "title": "Indian Constitution",
        "topic": "Polity",
        "order": 2,
        "thumbnailUrl": "https://res.cloudinary.com/.../class2_thumb.jpg",
        "lecturePhotoUrl": "https://res.cloudinary.com/.../class2_lecture.jpg",
        "videoUrl": "https://res.cloudinary.com/.../class2_video.mp4",
        "isFree": true
      }
    ],
    "...": "..."
  }
}
```

### 4. STUDY MATERIALS - Within a Course

#### 4.1 Add Study Materials to Course
**Endpoint:** `PUT /api/admin/courses/:id/content`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`
- `Content-Type: multipart/form-data`

**Form Fields:**
- `shortDescription`: "Brief course overview"
- `detailedDescription`: "Complete course description with syllabus..."
- `pricingNote`: "Special offer for early birds"
- `studyMaterials`: JSON array of study material objects
- `studyMaterialFiles[]`: (select study material files - matched by index)

**Request Body (studyMaterials field):**
```json
[
  {
    "title": "Polity Study Material.pdf",
    "description": "Complete study material for polity"
  },
  {
    "title": "Geography Notes.docx",
    "description": "Handwritten notes for geography"
  }
]
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Course content updated",
  "data": {
    "_id": "course_id",
    "contentType": "ONLINE_COURSE",
    "accessType": "PAID",
    "name": "Complete UPSC Prelims Course",
    "shortDescription": "Brief course overview",
    "detailedDescription": "Complete course description with syllabus...",
    "pricingNote": "Special offer for early birds",
    "studyMaterials": [
      {
        "_id": "material_id_1",
        "title": "Polity Study Material.pdf",
        "description": "Complete study material for polity",
        "fileUrl": "https://res.cloudinary.com/.../polity.pdf"
      },
      {
        "_id": "material_id_2",
        "title": "Geography Notes.docx",
        "description": "Handwritten notes for geography",
        "fileUrl": "https://res.cloudinary.com/.../geography.docx"
      }
    ],
    "...": "..."
  }
}
```

#### 4.2 Delete Study Material from Course
**Endpoint:** `DELETE /api/admin/courses/:id/study-materials/:materialId`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`

**Expected Response:**
```json
{
  "success": true,
  "message": "Study material deleted",
  "data": {
    "_id": "course_id",
    "contentType": "ONLINE_COURSE",
    "accessType": "PAID",
    "name": "Complete UPSC Prelims Course",
    "studyMaterials": [],
    "...": "..."
  }
}
```

---

## USER APIs

### 1. COURSE FILTERS

#### 1.1 Get Active Course Categories
**Endpoint:** `GET /api/v1/courses/filters/categories`  
**Headers:** 
- `Authorization: Bearer <user_jwt_token>` (optional)

**Query Parameters:**
- `contentType`: Filter by content type (default: ONLINE_COURSE)

**Backend Logic:**
* Fetch **only ACTIVE courses**
* Extract **unique categories** from those courses

**Expected Response:**
```json
{
  "success": true,
  "data": [
    { "_id": "cat_upsc", "name": "UPSC" },
    { "_id": "cat_appsc", "name": "APPSC" }
  ]
}
```

**Important:**
* Do **NOT** show categories with zero courses
* This matches your UI screenshots perfectly

#### 1.2 Get Subcategories for Category and Language
**Endpoint:** `GET /api/v1/courses/filters/subcategories`  
**Headers:** 
- `Authorization: Bearer <user_jwt_token>` (optional)

**Query Parameters:**
- `category`: Category ID (required)
- `language`: Language ID (optional)
- `lang`: Language code or name (optional, alternative to language ID)

**Backend Logic:**
* Filter by:
  * category
  * language (if provided)
  * isActive = true

**Expected Response:**
```json
{
  "success": true,
  "data": [
    { "_id": "sub_ias", "name": "IAS" },
    { "_id": "sub_ifs", "name": "IFS" }
  ]
}
```

**Important:**
* Subcategories shown **only if courses exist for the given category and language**
* No empty UI states

### 2. COURSE LISTING AND DETAILS

#### 2.1 List Courses with Filters
**Endpoint:** `GET /api/v1/courses`  
**Headers:** 
- `Authorization: Bearer <user_jwt_token>` (optional)

**Query Parameters:**
- `contentType`: Filter by content type (default: ONLINE_COURSE)
- `category`: Filter by category ID
- `subCategory`: Filter by sub-category ID
- `language`: Filter by language ID
- `lang`: Language code or name (alternative to language ID)

**Backend Logic:**
* Filter by all provided parameters
* Only show active courses
* Calculate final price
* Add purchase status

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "course_id",
      "name": "GS Foundation",
      "originalPrice": 10000,
      "finalPrice": 9000,
      "languages": ["telugu"],
      "thumbnailUrl": "...",
      "hasPurchased": false,
      "categories": [
        {
          "_id": "category_id",
          "name": "UPSC",
          "slug": "upsc"
        }
      ],
      "subCategories": [
        {
          "_id": "subcategory_id",
          "name": "Prelims",
          "slug": "prelims"
        }
      ]
    }
  ]
}
```

#### 2.2 Get Single Course Details
**Endpoint:** `GET /api/v1/courses/:courseId`  
**Headers:** 
- `Authorization: Bearer <user_jwt_token>` (optional)

**Backend Logic:**
* Show course details
* Process classes with access logic:
  - First 2 classes: Free (isFree=true, isLocked=false, hasAccess=true)
  - Purchased classes: Unlocked (isFree=false, isLocked=false, hasAccess=true)
  - Other classes: Locked (isFree=false, isLocked=true, hasAccess=false)

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "_id": "course_id",
    "name": "Complete UPSC Prelims Course",
    "originalPrice": 4999,
    "finalPrice": 4000,
    "hasPurchased": false,
    "classes": [
      {
        "_id": "class_id_1",
        "title": "Introduction to Indian Polity",
        "topic": "Polity",
        "order": 1,
        "thumbnailUrl": "https://res.cloudinary.com/.../class1_thumb.jpg",
        "isFree": true,
        "isLocked": false,
        "hasAccess": true
      },
      {
        "_id": "class_id_2",
        "title": "Indian Constitution",
        "topic": "Polity",
        "order": 2,
        "thumbnailUrl": "https://res.cloudinary.com/.../class2_thumb.jpg",
        "isFree": true,
        "isLocked": false,
        "hasAccess": true
      },
      {
        "_id": "class_id_3",
        "title": "Parliament and State Legislatures",
        "topic": "Polity",
        "order": 3,
        "thumbnailUrl": "https://res.cloudinary.com/.../class3_thumb.jpg",
        "isFree": false,
        "isLocked": true,
        "hasAccess": false
      }
    ],
    "...": "..."
  }
}
```

#### 2.3 Get Specific Class Details
**Endpoint:** `GET /api/v1/courses/:courseId/classes/:classId`  
**Headers:** 
- `Authorization: Bearer <user_jwt_token>` (required)

**Access Rules:**
| Condition | Result    |
| --------- | --------- |
| Class ≤ 2 | Allowed   |
| Purchased | Allowed   |
| Else      | ❌ Blocked |

**Expected Response (Success):**
```json
{
  "success": true,
  "data": {
    "_id": "class_id",
    "title": "Introduction to Indian Polity",
    "topic": "Polity",
    "order": 1,
    "thumbnailUrl": "https://res.cloudinary.com/.../class1_thumb.jpg",
    "lecturePhotoUrl": "https://res.cloudinary.com/.../class1_lecture.jpg",
    "videoUrl": "https://res.cloudinary.com/.../class1_video.mp4"
  }
}
```

**Expected Response (Blocked):**
```json
{
  "success": false,
  "message": "Please purchase this course to access this content"
}
```

### 3. PURCHASE FLOW

#### 3.1 Initiate Course Purchase
**Endpoint:** `POST /api/payment/order/create`  
**Headers:** 
- `Authorization: Bearer <user_jwt_token>` (required)
- `Content-Type: application/json`

**Request Body:**
```json
{
  "courseId": "course_id",
  "couponCode": "EARLYBIRD20" (optional)
}
```

**Backend Logic:**
* Verify course exists and is active
* Check if already purchased
* Calculate final amount with discounts
* Create payment record
* Return payment details

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "paymentId": "pay_1700000000000_randomstring",
    "amount": 4000,
    "currency": "INR",
    "couponApplied": true,
    "discountAmount": 999
  }
}
```

#### 3.2 After Payment Success
**Backend Logic:**
* Save purchase record
* `hasPurchased = true`

**Result:**
* All classes unlocked for the user
* User can access all course content

---

## ACCESS CONTROL SUMMARY

### User View
| Feature | Logic |
|--------|-------|
| **Categories** | Only categories with active courses |
| **Subcategories** | Only subcategories with active courses in selected category/language |
| **Courses** | Only active courses matching filters |
| **Classes** | First 2 free, rest locked until purchase |
| **Study Materials** | Locked until purchase |

### Admin View
| Feature | Logic |
|--------|-------|
| **Categories** | All categories |
| **Subcategories** | All subcategories |
| **Courses** | All courses (draft, inactive, active) |
| **Classes** | All classes accessible |
| **Study Materials** | All study materials accessible |

---

## DESIGN PRINCIPLES

### 1. Dynamic Access Control
- No `isFree` field in database
- First 2 classes free calculated at runtime
- Easy to change business rules later

### 2. Consistent APIs
- Same endpoints for user and admin
- Different response data based on role
- Minimal code duplication

### 3. Scalable Architecture
- Filter-driven UI
- Extensible course structure
- Clean separation of concerns