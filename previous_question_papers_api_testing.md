# Previous Question Papers (PYQ) API Testing Guide

This guide provides step-by-step instructions for testing all PYQ-related APIs, including required request bodies, endpoints, and expected responses.

## Important Note on Request Format

All PYQ creation and update requests must follow a specific format:
1. Metadata (categoryId, subCategoryId, paperCategory, etc.) must be sent as individual form-data fields
2. Files (thumbnail and paper) must be sent as separate multipart form data fields

This allows direct field mapping without JSON parsing.

## Base URL
```
https://brain-buzz-web.vercel.app/
```

## Authentication
Most admin endpoints require authentication. Ensure you have a valid admin JWT token before making requests.

---

## 1. EXAMS - Admin CRUD Operations

### 1.1 Create Exam
**Endpoint:** `POST /api/admin/exams`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "name": "UPSC"
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "_id": "exam_id",
    "name": "UPSC",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

### 1.2 List All Exams
**Endpoint:** `GET /api/admin/exams`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "exam_id",
      "name": "UPSC",
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
    }
  ]
}
```

### 1.3 Update Exam
**Endpoint:** `PUT /api/admin/exams/:examId`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "name": "UPSC Civil Services"
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "_id": "exam_id",
    "name": "UPSC Civil Services",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

### 1.4 Delete Exam
**Endpoint:** `DELETE /api/admin/exams/:examId`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`

**Expected Response:**
```json
{
  "success": true,
  "message": "Exam deleted"
}
```

---

## 2. SUBJECTS - Admin CRUD Operations

### 2.1 Create Subject
**Endpoint:** `POST /api/admin/subjects`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "name": "History"
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "_id": "subject_id",
    "name": "History",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

### 2.2 List All Subjects
**Endpoint:** `GET /api/admin/subjects`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "subject_id",
      "name": "History",
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
    }
  ]
}
```

### 2.3 Update Subject
**Endpoint:** `PUT /api/admin/subjects/:subjectId`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "name": "Ancient History"
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "_id": "subject_id",
    "name": "Ancient History",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

### 2.4 Delete Subject
**Endpoint:** `DELETE /api/admin/subjects/:subjectId`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`

**Expected Response:**
```json
{
  "success": true,
  "message": "Subject deleted"
}
```

---

## 3. PREVIOUS QUESTION PAPERS - Admin CRUD Operations

### Prerequisites
Before creating a PYQ, you need:
1. A Category with contentType "PYQ_EBOOK"
2. A SubCategory under that Category
3. (Optional) An Exam and Subject if paperCategory is "EXAM"
4. (Optional) A Language if you want to associate a specific language with the PYQ

### 3.1 Create PYQ with EXAM Category
**Endpoint:** `POST /api/admin/previous-question-papers`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`
- `Content-Type: multipart/form-data`

**Form Data:**
- `categoryId`: category_id_here
- `subCategoryId`: subcategory_id_here
- `paperCategory`: EXAM
- `examId`: exam_id_here
- `subjectId`: subject_id_here
- `languageId`: language_id_here
- `date`: 2023-12-01
- `description`: UPSC History Prelims 2023
- `thumbnail`: (file upload - image)
- `paper`: (file upload - PDF)

**Expected Response:**
```json
{
  "success": true,
  "message": "Question paper added",
  "data": {
    "_id": "pyq_id",
    "contentType": "PYQ_EBOOK",
    "categoryId": "category_id",
    "subCategoryId": "subcategory_id",
    "paperCategory": "EXAM",
    "examId": "exam_id",
    "subjectId": "subject_id",
    "languageId": "language_id",
    "date": "2023-12-01T00:00:00.000Z",
    "description": "UPSC History Prelims 2023",
    "thumbnailUrl": "thumbnail_url",
    "fileUrl": "file_url",
    "isActive": true,
    "languages": [],
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

### 3.2 Create PYQ with LATEST Category
**Endpoint:** `POST /api/admin/previous-question-papers`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`
- `Content-Type: multipart/form-data`

**Form Data:**
- `categoryId`: category_id_here
- `subCategoryId`: subcategory_id_here
- `paperCategory`: LATEST
- `languageId`: language_id_here
- `date`: 2023-12-01
- `description`: Latest Current Affairs December 2023
- `thumbnail`: (file upload - image)
- `paper`: (file upload - PDF)

**Expected Response:**
```json
{
  "success": true,
  "message": "Question paper added",
  "data": {
    "_id": "pyq_id",
    "contentType": "PYQ_EBOOK",
    "categoryId": "category_id",
    "subCategoryId": "subcategory_id",
    "paperCategory": "LATEST",
    "examId": null,
    "subjectId": null,
    "languageId": "language_id",
    "date": "2023-12-01T00:00:00.000Z",
    "description": "Latest Current Affairs December 2023",
    "thumbnailUrl": "thumbnail_url",
    "fileUrl": "file_url",
    "isActive": true,
    "languages": [],
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

### 3.3 List All PYQs (Admin)
**Endpoint:** `GET /api/admin/previous-question-papers`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`

**Query Parameters (Optional):**
- `categoryId`: Filter by category
- `subCategoryId`: Filter by subcategory
- `paperCategory`: Filter by paper category (EXAM/LATEST)
- `examId`: Filter by exam (if paperCategory is EXAM)
- `subjectId`: Filter by subject (if paperCategory is EXAM)

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "pyq_id",
      "contentType": "PYQ_EBOOK",
      "categoryId": "category_id",
      "subCategoryId": "subcategory_id",
      "paperCategory": "EXAM",
      "examId": "exam_id",
      "subjectId": "subject_id",
      "languageId": {
        "_id": "language_id",
        "name": "English",
        "code": "en",
        "isActive": true,
        "createdAt": "timestamp",
        "updatedAt": "timestamp",
        "__v": 0
      },
      "date": "2023-12-01T00:00:00.000Z",
      "description": "UPSC History Prelims 2023",
      "thumbnailUrl": "thumbnail_url",
      "fileUrl": "file_url",
      "isActive": true,
      "languages": [],
      "createdAt": "timestamp",
      "updatedAt": "timestamp",
      "examId": {
        "_id": "exam_id",
        "name": "UPSC"
      },
      "subjectId": {
        "_id": "subject_id",
        "name": "History"
      }
    }
  ]
}
```

### 3.4 Update PYQ
**Endpoint:** `PUT /api/admin/previous-question-papers/:pyqId`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`
- `Content-Type: multipart/form-data`

**Form Data (any combination of fields):**
- `description`: Updated description
- `date`: 2023-12-15
- `thumbnail`: (file upload - new thumbnail image)
- `paper`: (file upload - new paper PDF)

**Expected Response:**
``json
{
  "success": true,
  "data": {
    "_id": "pyq_id",
    "contentType": "PYQ_EBOOK",
    "categoryId": "category_id",
    "subCategoryId": "subcategory_id",
    "paperCategory": "EXAM",
    "examId": "exam_id",
    "subjectId": "subject_id",
    "languageId": "language_id",
    "date": "2023-12-15T00:00:00.000Z",
    "description": "Updated description",
    "thumbnailUrl": "updated_thumbnail_url",
    "fileUrl": "updated_file_url",
    "isActive": true,
    "languages": [],
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

### 3.5 Delete PYQ
**Endpoint:** `DELETE /api/admin/previous-question-papers/:pyqId`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`

**Expected Response:**
```json
{
  "success": true,
  "message": "Question paper deleted"
}
```

---

## 4. USER APIs - View PYQs

### 4.1 List Active PYQs (User)
**Endpoint:** `GET /api/v1/previous-question-papers`  

**Query Parameters (Optional):**
- `categoryId`: Filter by category
- `subCategoryId`: Filter by subcategory
- `paperCategory`: Filter by paper category (EXAM/LATEST)
- `examId`: Filter by exam (if paperCategory is EXAM)
- `subjectId`: Filter by subject (if paperCategory is EXAM)

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "pyq_id",
      "contentType": "PYQ_EBOOK",
      "categoryId": "category_id",
      "subCategoryId": "subcategory_id",
      "paperCategory": "EXAM",
      "examId": "exam_id",
      "subjectId": "subject_id",
      "languageId": {
        "_id": "language_id",
        "name": "English",
        "code": "en",
        "isActive": true,
        "createdAt": "timestamp",
        "updatedAt": "timestamp",
        "__v": 0
      },
      "date": "2023-12-01T00:00:00.000Z",
      "description": "UPSC History Prelims 2023",
      "thumbnailUrl": "thumbnail_url",
      "fileUrl": "file_url",
      "isActive": true,
      "languages": [],
      "createdAt": "timestamp",
      "updatedAt": "timestamp",
      "examId": {
        "_id": "exam_id",
        "name": "UPSC"
      },
      "subjectId": {
        "_id": "subject_id",
        "name": "History"
      }
    }
  ]
}
```

---

---

## Testing Steps Summary

1. **Setup Phase:**
   - Create a Category with contentType "PYQ_EBOOK"
   - Create a SubCategory under that Category
   - Create Exams and Subjects (for EXAM-type papers)

2. **Admin Testing:**
   - Test Exam CRUD operations
   - Test Subject CRUD operations
   - Test PYQ creation with EXAM category
   - Test PYQ creation with LATEST category
   - Test PYQ listing with filters
   - Test PYQ update
   - Test PYQ deletion

3. **User Testing:**
   - Test PYQ listing with various filters
   - Verify only active papers are returned
   - Verify populated exam/subject data

4. **File Upload Testing:**
   - Test thumbnail image uploads
   - Test paper PDF uploads
   - Verify file URLs are correctly stored
   - Test updating files

Ensure all endpoints return appropriate error messages for invalid requests.

---

## Troubleshooting Common Issues

### Example Request Format

Here's a complete example of how to format your request:

**Endpoint:** `POST /api/admin/previous-question-papers`
**Headers:**
- `Authorization: Bearer your_admin_token`
- `Content-Type: multipart/form-data`

**Form Fields:**
- `categoryId`: 654321abcdef123456789012
- `subCategoryId`: 789012abcdef345678901234
- `paperCategory`: EXAM
- `examId`: 123456abcdef789012345678
- `subjectId`: 234567abcdef890123456789
- `languageId`: 345678abcdef901234567890
- `date`: 2023-12-01
- `description`: UPSC History Prelims 2023
- `thumbnail`: (select your image file)
- `paper`: (select your PDF file)

Replace the IDs with actual IDs from your database.

### 1. "PreviousQuestionPaper validation failed: fileUrl: Path `fileUrl` is required" Error

**Cause:** This error occurs when the `paper` file is not included in the request or is not properly formatted.

**Solution:**
1. Ensure you're sending the paper file as a multipart form data field named `paper`
2. Make sure the `pyq` field contains all required metadata as a JSON string
3. Verify that the paper file is not corrupted and is within size limits

### 2. Field validation errors

**Cause:** This error occurs when required fields are missing or invalid.

**Solution:**
1. Ensure all required fields are provided as individual form-data fields
2. Verify that field names match exactly (camelCase format)
3. Check that field values are valid

### 3. "Category ID is required" or Similar Validation Errors

**Cause:** Missing required fields in the `pyq` JSON.

**Solution:**
1. Verify that all required fields (categoryId, subCategoryId, paperCategory, date) are present in the `pyq` JSON
2. Check that field names match exactly (camelCase format)
3. If including languageId, ensure the language exists in the database (validation will fail if the languageId doesn't exist)
