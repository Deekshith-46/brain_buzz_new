# Test Series and Online Course Creation using FormData

This guide explains how to create Test Series and Online Courses using multipart/form-data requests, which is the standard way to handle file uploads in web applications.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Test Series Creation](#test-series-creation)
3. [Online Course Creation](#online-course-creation)
4. [Common Form Fields](#common-form-fields)
5. [File Upload Handling](#file-upload-handling)
6. [API Endpoints Summary](#api-endpoints-summary)

## Prerequisites

Before creating Test Series or Courses, ensure you have:
- Valid admin JWT token
- Required category and subcategory IDs
- Validity options configured (for courses)
- Language IDs (if applicable)

## Test Series Creation

### 1. Create Basic Test Series

**Endpoint:** `POST /api/admin/test-series`
**Content-Type:** `multipart/form-data`
**Authentication:** Required (Admin JWT token)

#### Required Form Fields:
- `name` - Test series name
- `description` - Detailed description
- `noOfTests` - Maximum number of tests allowed
- `originalPrice` - Price of the test series

#### Optional Form Fields:
- `categoryIds[]` - Array of category IDs
- `subCategoryIds[]` - Array of sub-category IDs
- `discountType` - "percentage" or "fixed"
- `discountValue` - Discount amount/percentage
- `date` - Expiry date (ISO format)
- `language` - Language of the test series
- `validity` - Validity period
- `thumbnail` - Thumbnail image file

#### Example Request:
```bash
curl -X POST "http://localhost:3000/api/admin/test-series" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -F "name=UPSC Prelims Test Series" \
  -F "description=Complete test series for UPSC Prelims preparation" \
  -F "noOfTests=20" \
  -F "originalPrice=499" \
  -F "categoryIds[]=CATEGORY_ID_1" \
  -F "categoryIds[]=CATEGORY_ID_2" \
  -F "subCategoryIds[]=SUB_CATEGORY_ID_1" \
  -F "discountType=percentage" \
  -F "discountValue=10" \
  -F "language=English" \
  -F "validity=Lifetime" \
  -F "thumbnail=@/path/to/thumbnail.jpg"
```

#### JavaScript/Node.js Example:
```javascript
const formData = new FormData();
formData.append('name', 'UPSC Prelims Test Series');
formData.append('description', 'Complete test series for UPSC Prelims preparation');
formData.append('noOfTests', '20');
formData.append('originalPrice', '499');
formData.append('categoryIds[]', 'CATEGORY_ID_1');
formData.append('categoryIds[]', 'CATEGORY_ID_2');
formData.append('subCategoryIds[]', 'SUB_CATEGORY_ID_1');
formData.append('discountType', 'percentage');
formData.append('discountValue', '10');
formData.append('language', 'English');
formData.append('validity', 'Lifetime');
formData.append('thumbnail', fileInput.files[0]); // File from file input

fetch('http://localhost:3000/api/admin/test-series', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`
  },
  body: formData
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

### 2. Add Tests to Test Series

**Endpoint:** `POST /api/admin/test-series/:seriesId/tests`
**Content-Type:** `application/json`

```bash
curl -X POST "http://localhost:3000/api/admin/test-series/SERIES_ID/tests" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "testName": "General Studies Paper 1 - Test 1",
    "noOfQuestions": 100,
    "totalMarks": 200,
    "positiveMarks": 2,
    "negativeMarks": 0.67,
    "date": "2024-06-15T00:00:00Z",
    "startTime": "2024-06-15T09:00:00Z",
    "endTime": "2024-06-15T12:00:00Z",
    "resultPublishTime": "2024-06-16T12:00:00Z"
  }'
```

## Online Course Creation

### Method 1: Step-by-Step Approach (Recommended)

#### Step 1: Create Course Shell
**Endpoint:** `POST /api/admin/courses`
**Content-Type:** `multipart/form-data`

```bash
curl -X POST "http://localhost:3000/api/admin/courses" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -F "contentType=ONLINE_COURSE" \
  -F "name=Complete Python Programming Course" \
  -F "startDate=2024-01-15T00:00:00Z" \
  -F "categoryIds[]=CATEGORY_ID_1" \
  -F "subCategoryIds[]=SUB_CATEGORY_ID_1" \
  -F "thumbnail=@/path/to/course-thumbnail.jpg"
```

#### Step 2: Update Course Basics
**Endpoint:** `PUT /api/admin/courses/:id/basics`
**Content-Type:** `multipart/form-data`

```bash
curl -X PUT "http://localhost:3000/api/admin/courses/COURSE_ID/basics" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -F "originalPrice=2999" \
  -F "discountPrice=999" \
  -F "pricingNote=Limited time offer" \
  -F "shortDescription=Learn Python from basics to advanced level" \
  -F "detailedDescription=Comprehensive Python course covering..." \
  -F "isActive=true" \
  -F "accessType=PAID" \
  -F "languageIds[]=LANGUAGE_ID_1" \
  -F "validityIds[]=VALIDITY_ID_1"
```

#### Step 3: Add Tutors
**Endpoint:** `POST /api/admin/courses/:id/tutors`
**Content-Type:** `multipart/form-data`

```bash
curl -X POST "http://localhost:3000/api/admin/courses/COURSE_ID/tutors" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -F 'tutors=[{"name":"John Doe","qualification":"M.Tech","subject":"Python"}]' \
  -F "tutorImages[]=@/path/to/tutor-photo.jpg"
```

#### Step 4: Add Classes
**Endpoint:** `POST /api/admin/courses/:id/classes`
**Content-Type:** `multipart/form-data`

```bash
curl -X POST "http://localhost:3000/api/admin/courses/COURSE_ID/classes" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -F 'classes=[{"title":"Introduction to Python","topic":"Basics","order":1}]' \
  -F "classThumbnails[]=@/path/to/class-thumbnail.jpg" \
  -F "classLecturePics[]=@/path/to/lecture-photo.jpg" \
  -F "classVideos[]=@/path/to/class-video.mp4"
```

#### Step 5: Add Study Materials
**Endpoint:** `PUT /api/admin/courses/:id/content`
**Content-Type:** `multipart/form-data`

```bash
curl -X PUT "http://localhost:3000/api/admin/courses/COURSE_ID/content" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -F "shortDescription=Brief course overview" \
  -F "detailedDescription=Complete course description" \
  -F "pricingNote=Special offer details" \
  -F 'studyMaterials=[{"title":"Python Notes.pdf","description":"Complete study material"}]' \
  -F "studyMaterialFiles[]=@/path/to/study-material.pdf"
```

#### Step 6: Publish Course
**Endpoint:** `PATCH /api/admin/courses/:id/publish`

```bash
curl -X PATCH "http://localhost:3000/api/admin/courses/COURSE_ID/publish" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

### Method 2: Single API Call (Full Course Creation)

**Endpoint:** `POST /api/admin/courses/full`
**Content-Type:** `multipart/form-data`

```bash
curl -X POST "http://localhost:3000/api/admin/courses/full" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -F "name=Complete Python Programming Course" \
  -F "courseType=PROGRAMMING" \
  -F "startDate=2024-01-15T00:00:00Z" \
  -F "originalPrice=2999" \
  -F "discountPrice=999" \
  -F "pricingNote=Limited time offer" \
  -F "shortDescription=Learn Python from basics to advanced level" \
  -F "detailedDescription=Comprehensive Python course covering..." \
  -F "isActive=true" \
  -F "accessType=PAID" \
  -F "categoryIds[]=CATEGORY_ID_1" \
  -F "subCategoryIds[]=SUB_CATEGORY_ID_1" \
  -F "languageIds[]=LANGUAGE_ID_1" \
  -F "validity=1_YEAR" \
  -F "thumbnail=@/path/to/course-thumbnail.jpg" \
  -F 'tutors=[{"name":"John Doe","qualification":"M.Tech","subject":"Python"}]' \
  -F "tutorImages[]=@/path/to/tutor-photo.jpg" \
  -F 'classes=[{"title":"Introduction to Python","topic":"Basics","order":1}]' \
  -F "classThumbnails[]=@/path/to/class-thumbnail.jpg" \
  -F "classLecturePics[]=@/path/to/lecture-photo.jpg" \
  -F "classVideos[]=@/path/to/class-video.mp4" \
  -F 'studyMaterials=[{"title":"Python Notes.pdf","description":"Complete study material"}]' \
  -F "studyMaterialFiles[]=@/path/to/study-material.pdf"
```

## Common Form Fields

### Shared Fields for Both Test Series and Courses:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Name/title of the content |
| `description` | string | Yes | Detailed description |
| `categoryIds[]` | array | No | Associated categories |
| `subCategoryIds[]` | array | No | Associated sub-categories |
| `thumbnail` | file | No | Main thumbnail image |
| `originalPrice` | number | Yes | Base price |
| `discountType` | string | No | "percentage" or "fixed" |
| `discountValue` | number | No | Discount amount |
| `language` | string/array | No | Content language(s) |
| `validity` | string | No | Validity period |
| `isActive` | boolean | No | Publication status |

### Test Series Specific Fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `noOfTests` | number | Yes | Maximum tests allowed |
| `date` | string | No | Expiry date |

### Course Specific Fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `courseType` | string | Yes | Type of course |
| `startDate` | string | Yes | Course start date |
| `shortDescription` | string | No | Brief description |
| `detailedDescription` | string | No | Full description |
| `pricingNote` | string | No | Special pricing notes |

## File Upload Handling

### Supported File Types:
- Images: JPG, PNG, GIF (thumbnails, photos)
- Videos: MP4, MOV, AVI (lectures, explanations)
- Documents: PDF, DOC, DOCX (study materials)

### File Size Limits:
- Images: Maximum 5MB
- Videos: Maximum 100MB
- Documents: Maximum 20MB

### File Naming Convention:
Files are automatically uploaded to Cloudinary with organized folder structure:
- Test Series: `/brainbuzz/test-series/`
- Courses: `/brainbuzz/courses/`
- Thumbnails: `/thumbnails/`
- Videos: `/videos/`
- Documents: `/materials/`

## API Endpoints Summary

### Test Series Endpoints:
```
POST    /api/admin/test-series              # Create test series
GET     /api/admin/test-series              # List all test series
GET     /api/admin/test-series/:id          # Get specific test series
PUT     /api/admin/test-series/:id          # Update test series
DELETE  /api/admin/test-series/:id          # Delete test series
POST    /api/admin/test-series/:id/tests    # Add test to series
```

### Course Endpoints:
```
POST    /api/admin/courses                  # Create course shell
POST    /api/admin/courses/full             # Create complete course
PUT     /api/admin/courses/:id              # Update course shell
PUT     /api/admin/courses/:id/basics       # Update course basics
PUT     /api/admin/courses/:id/content      # Update course content
POST    /api/admin/courses/:id/tutors       # Add tutors
POST    /api/admin/courses/:id/classes      # Add classes
PATCH   /api/admin/courses/:id/publish      # Publish course
PATCH   /api/admin/courses/:id/unpublish    # Unpublish course
DELETE  /api/admin/courses/:id              # Delete course
```

## Error Handling

Common error responses:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

Common error scenarios:
- Missing required fields
- Invalid file formats
- Authentication failures
- Insufficient permissions
- Database validation errors

## Best Practices

1. **Always validate data** before sending requests
2. **Handle file uploads asynchronously** for better UX
3. **Use proper error handling** in your frontend code
4. **Store JWT tokens securely** (localStorage/sessionStorage)
5. **Implement progress indicators** for file uploads
6. **Validate file types and sizes** client-side before upload
7. **Use consistent naming conventions** for form fields
8. **Test thoroughly** with different combinations of optional fields

This documentation provides a comprehensive guide for creating Test Series and Online Courses using formData in your Brain Buzz backend system.