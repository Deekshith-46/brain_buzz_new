# Daily Quizzes API Testing Guide

This document provides detailed step-by-step instructions for testing the Daily Quizzes APIs through the Admin interface.

## Table of Contents
1. [Daily Quizzes API](#daily-quizzes-api)
   - [Create Daily Quiz](#create-daily-quiz)
   - [Get Daily Quizzes](#get-daily-quizzes)
   - [Get Daily Quiz by ID](#get-daily-quiz-by-id)
   - [Update Daily Quiz](#update-daily-quiz)
   - [Delete Daily Quiz](#delete-daily-quiz)
   - [Update Single Question](#update-single-question)
   - [Add Question](#add-question)
   - [Delete Question](#delete-question)

## Daily Quizzes API

### Create Daily Quiz

**Endpoint**: `POST /api/admin/daily-quizzes`
**Method**: POST
**Content-Type**: `application/json`
**Authentication**: Required (Admin token)

#### Required Fields
- `quiz` (JSON object) - Contains all quiz data

#### Optional Fields
- `name` (String) - Name of the quiz (Required)
- `month` (String) - Month of the quiz (Enum: JANUARY, FEBRUARY, MARCH, APRIL, MAY, JUNE, JULY, AUGUST, SEPTEMBER, OCTOBER, NOVEMBER, DECEMBER)
- `examDate` (Date) - Date of the exam
- `categoryIds` (Array of ObjectId) - Categories associated with the quiz
- `subCategoryIds` (Array of ObjectId) - Sub-categories associated with the quiz
- `languageIds` (Array of ObjectId) - Languages associated with the quiz
- `freeMockLinks` (String) - Links to free mock tests
- `instructions` (String) - Instructions for the quiz
- `sections` (Array of Objects) - Sections with questions
- `isActive` (Boolean) - Whether the quiz is active (Default: true)

> **Important**: `totalMarks` and `totalQuestions` are automatically calculated from the questions and should NOT be provided by the admin.

#### Sample Request Body
```json
{
  "quiz": {
    "name": "Daily Quiz - December 16, 2025",
    "month": "DECEMBER",
    "examDate": "2025-12-16T00:00:00.000Z",
    "categoryIds": ["69410d3024dbc54cc33ff3c3"],
    "subCategoryIds": ["69412e394ed8fce5824373cc"],
    "languageIds": ["694006c46abada1001df7f29"],
    "freeMockLinks": "https://example.com/free-mock",
    "instructions": "Read all instructions carefully before starting the quiz.",
    "sections": [
      {
        "title": "General Knowledge",
        "order": 1,
        "questions": [
          {
            "questionNumber": 1,
            "questionText": "What is the capital of France?",
            "questionType": "MCQ",
            "options": ["London", "Berlin", "Paris", "Madrid"],
            "correctOptionIndex": 2,
            "explanation": "Paris is the capital of France.",
            "marks": 2,
            "negativeMarks": 0
          }
        ]
      }
    ],
    "isActive": true
  }
}
```

#### Expected Response
```json
{
  "message": "Daily Quiz created successfully",
  "data": {
    "_id": "69412ede4ed8fce5824373cf",
    "contentType": "DAILY_QUIZ",
    "accessType": "PAID",
    "name": "Daily Quiz - December 16, 2025",
    "month": "DECEMBER",
    "examDate": "2025-12-16T00:00:00.000Z",
    "categories": [
      {
        "_id": "69410d3024dbc54cc33ff3c3",
        "name": "UPSC",
        "slug": "upsc"
      }
    ],
    "subCategories": [
      {
        "_id": "69412e394ed8fce5824373cc",
        "name": "UPSC Prelims",
        "slug": "upsc-prelims"
      }
    ],
    "languages": [
      {
        "_id": "694006c46abada1001df7f29",
        "name": "Telugu",
        "code": "te"
      }
    ],
    "totalMarks": 2,
    "totalQuestions": 1,
    "freeMockLinks": "https://example.com/free-mock",
    "instructions": "Read all instructions carefully before starting the quiz.",
    "sections": [
      {
        "_id": "69412ede4ed8fce5824373d0",
        "title": "General Knowledge",
        "order": 1,
        "questions": [
          {
            "_id": "69412ede4ed8fce5824373d1",
            "questionNumber": 1,
            "questionText": "What is the capital of France?",
            "questionType": "MCQ",
            "options": ["London", "Berlin", "Paris", "Madrid"],
            "correctOptionIndex": 2,
            "explanation": "Paris is the capital of France.",
            "marks": 2,
            "negativeMarks": 0
          }
        ]
      }
    ],
    "isActive": true,
    "createdAt": "2025-12-16T10:05:18.178Z",
    "updatedAt": "2025-12-16T10:05:18.178Z"
  }
}
```

### Get Daily Quizzes

**Endpoint**: `GET /api/admin/daily-quizzes`
**Method**: GET
**Authentication**: Required (Admin token)

#### Query Parameters (Optional)
- `category` (ObjectId) - Filter by category ID
- `subCategory` (ObjectId) - Filter by sub-category ID
- `language` (ObjectId) - Filter by language ID
- `month` (String) - Filter by month (Enum values)
- `isActive` (Boolean) - Filter by active status

#### Sample Request
```
GET /api/admin/daily-quizzes?month=DECEMBER&isActive=true
```

#### Expected Response
```json
{
  "data": [
    {
      "_id": "69412ede4ed8fce5824373cf",
      "contentType": "DAILY_QUIZ",
      "accessType": "PAID",
      "name": "Daily Quiz - December 16, 2025",
      "month": "DECEMBER",
      "examDate": "2025-12-16T00:00:00.000Z",
      "categories": [
        {
          "_id": "69410d3024dbc54cc33ff3c3",
          "name": "UPSC",
          "slug": "upsc"
        }
      ],
      "subCategories": [
        {
          "_id": "69412e394ed8fce5824373cc",
          "name": "UPSC Prelims",
          "slug": "upsc-prelims"
        }
      ],
      "languages": [
        {
          "_id": "694006c46abada1001df7f29",
          "name": "Telugu",
          "code": "te"
        }
      ],
      "totalMarks": 2,
      "totalQuestions": 1,
      "freeMockLinks": "https://example.com/free-mock",
      "instructions": "Read all instructions carefully before starting the quiz.",
      "sections": [
        {
          "_id": "69412ede4ed8fce5824373d0",
          "title": "General Knowledge",
          "order": 1,
          "questions": [
            {
              "_id": "69412ede4ed8fce5824373d1",
              "questionNumber": 1,
              "questionText": "What is the capital of France?",
              "questionType": "MCQ",
              "options": ["London", "Berlin", "Paris", "Madrid"],
              "correctOptionIndex": 2,
              "explanation": "Paris is the capital of France.",
              "marks": 2,
              "negativeMarks": 0
            }
          ]
        }
      ],
      "isActive": true,
      "createdAt": "2025-12-16T10:05:18.178Z",
      "updatedAt": "2025-12-16T10:05:18.178Z"
    }
  ]
}
```

### Get Daily Quiz by ID

**Endpoint**: `GET /api/admin/daily-quizzes/:id`
**Method**: GET
**Authentication**: Required (Admin token)

#### Path Parameters
- `id` (ObjectId) - ID of the daily quiz

#### Sample Request
```
GET /api/admin/daily-quizzes/69412ede4ed8fce5824373cf
```

#### Expected Response
```json
{
  "data": {
    "_id": "69412ede4ed8fce5824373cf",
    "contentType": "DAILY_QUIZ",
    "accessType": "PAID",
    "name": "Daily Quiz - December 16, 2025",
    "month": "DECEMBER",
    "examDate": "2025-12-16T00:00:00.000Z",
    "categories": [
      {
        "_id": "69410d3024dbc54cc33ff3c3",
        "name": "UPSC",
        "slug": "upsc"
      }
    ],
    "subCategories": [
      {
        "_id": "69412e394ed8fce5824373cc",
        "name": "UPSC Prelims",
        "slug": "upsc-prelims"
      }
    ],
    "languages": [
      {
        "_id": "694006c46abada1001df7f29",
        "name": "Telugu",
        "code": "te"
      }
    ],
    "totalMarks": 2,
    "totalQuestions": 1,
    "freeMockLinks": "https://example.com/free-mock",
    "instructions": "Read all instructions carefully before starting the quiz.",
    "sections": [
      {
        "_id": "69412ede4ed8fce5824373d0",
        "title": "General Knowledge",
        "order": 1,
        "questions": [
          {
            "_id": "69412ede4ed8fce5824373d1",
            "questionNumber": 1,
            "questionText": "What is the capital of France?",
            "questionType": "MCQ",
            "options": ["London", "Berlin", "Paris", "Madrid"],
            "correctOptionIndex": 2,
            "explanation": "Paris is the capital of France.",
            "marks": 2,
            "negativeMarks": 0
          }
        ]
      }
    ],
    "isActive": true,
    "createdAt": "2025-12-16T10:05:18.178Z",
    "updatedAt": "2025-12-16T10:05:18.178Z"
  }
}
```

### Update Daily Quiz

**Endpoint**: `PATCH /api/admin/daily-quizzes/:id`
**Method**: PATCH
**Content-Type**: `application/json`
**Authentication**: Required (Admin token)

> **Important**: Changed from PUT to PATCH to follow REST best practices for partial updates

#### Path Parameters
- `id` (ObjectId) - ID of the daily quiz to update

#### Fields That Can Be Updated
Any field from the quiz object can be updated. Only the fields provided in the request will be updated.

> **Important**: `totalMarks` and `totalQuestions` are automatically calculated from the questions and should NOT be provided by the admin.

#### Sample Request Body - Update Quiz Basic Info
```json
{
  "quiz": {
    "name": "Updated Daily Quiz - December 16, 2025",
    "isActive": false
  }
}
```

#### Sample Request Body - Update Sections Only
```json
{
  "sections": [
    {
      "_id": "69412ede4ed8fce5824373d0",
      "title": "Updated General Knowledge",
      "questions": [
        {
          "_id": "69412ede4ed8fce5824373d1",
          "questionText": "What is the capital of Germany?",
          "options": ["London", "Berlin", "Paris", "Madrid"],
          "correctOptionIndex": 1,
          "marks": 3
        }
      ]
    }
  ]
}
```

#### Expected Response
```json
{
  "message": "Daily Quiz updated successfully",
  "data": {
    "_id": "69412ede4ed8fce5824373cf",
    "contentType": "DAILY_QUIZ",
    "accessType": "PAID",
    "name": "Updated Daily Quiz - December 16, 2025",
    "month": "DECEMBER",
    "examDate": "2025-12-16T00:00:00.000Z",
    "categories": [
      {
        "_id": "69410d3024dbc54cc33ff3c3",
        "name": "UPSC",
        "slug": "upsc"
      }
    ],
    "subCategories": [
      {
        "_id": "69412e394ed8fce5824373cc",
        "name": "UPSC Prelims",
        "slug": "upsc-prelims"
      }
    ],
    "languages": [
      {
        "_id": "694006c46abada1001df7f29",
        "name": "Telugu",
        "code": "te"
      }
    ],
    "totalMarks": 3,
    "totalQuestions": 1,
    "freeMockLinks": "https://example.com/free-mock",
    "instructions": "Read all instructions carefully before starting the quiz.",
    "sections": [
      {
        "_id": "69412ede4ed8fce5824373d0",
        "title": "Updated General Knowledge",
        "order": 1,
        "questions": [
          {
            "_id": "69412ede4ed8fce5824373d1",
            "questionNumber": 1,
            "questionText": "What is the capital of Germany?",
            "questionType": "MCQ",
            "options": ["London", "Berlin", "Paris", "Madrid"],
            "correctOptionIndex": 1,
            "explanation": "Berlin is the capital of Germany.",
            "marks": 3,
            "negativeMarks": 0
          }
        ]
      }
    ],
    "isActive": false,
    "createdAt": "2025-12-16T10:05:18.178Z",
    "updatedAt": "2025-12-16T11:30:45.210Z"
  }
}
```

### Delete Daily Quiz

**Endpoint**: `DELETE /api/admin/daily-quizzes/:id`
**Method**: DELETE
**Authentication**: Required (Admin token)

#### Path Parameters
- `id` (ObjectId) - ID of the daily quiz to delete

#### Sample Request
```
DELETE /api/admin/daily-quizzes/69412ede4ed8fce5824373cf
```

#### Expected Response
```json
{
  "message": "Daily Quiz deleted successfully"
}
```

### Update Single Question

**Endpoint**: `PATCH /api/admin/daily-quizzes/:quizId/questions/:questionId`
**Method**: PATCH
**Content-Type**: `application/json`
**Authentication**: Required (Admin token)

> **Granular API**: Allows updating a single question without sending the entire quiz data

#### Path Parameters
- `quizId` (ObjectId) - ID of the daily quiz
- `questionId` (ObjectId) - ID of the question to update

#### Fields That Can Be Updated
Any field from the question object can be updated.

> **Important**: When marks are updated, the totalMarks for the quiz will be automatically recalculated.

#### Sample Request Body
```json
{
  "questionText": "What is the largest planet in our solar system?",
  "options": ["Earth", "Mars", "Jupiter", "Saturn"],
  "correctOptionIndex": 2,
  "explanation": "Jupiter is the largest planet in our solar system.",
  "marks": 4
}
```

#### Expected Response
```json
{
  "message": "Question updated successfully",
  "data": {
    "_id": "69412ede4ed8fce5824373d1",
    "questionNumber": 1,
    "questionText": "What is the largest planet in our solar system?",
    "questionType": "MCQ",
    "options": ["Earth", "Mars", "Jupiter", "Saturn"],
    "correctOptionIndex": 2,
    "explanation": "Jupiter is the largest planet in our solar system.",
    "marks": 4,
    "negativeMarks": 0
  }
}
```

### Add Question

**Endpoint**: `POST /api/admin/daily-quizzes/:quizId/questions`
**Method**: POST
**Content-Type**: `application/json`
**Authentication**: Required (Admin token)

> **Granular API**: Allows adding a new question to an existing quiz

#### Path Parameters
- `quizId` (ObjectId) - ID of the daily quiz

#### Required Fields
- `sectionId` (ObjectId) - ID of the section to add the question to
- `questionText` (String) - The question text
- `questionType` (String) - Type of question (MCQ or SUBJECTIVE)
- `options` (Array of Strings) - Answer options (required for MCQ)
- `correctOptionIndex` (Number) - Index of correct option (required for MCQ)
- `marks` (Number) - Marks for the question (must be greater than 0)
- `negativeMarks` (Number) - Negative marking for incorrect answer (must be >= 0)

#### Sample Request Body
```json
{
  "sectionId": "69414a3f1cb6eb929b166b32",
  "questionText": "What is the chemical symbol for gold?",
  "questionType": "MCQ",
  "options": ["Go", "Gd", "Au", "Ag"],
  "correctOptionIndex": 2,
  "marks": 4,
  "negativeMarks": 0.5
}
```

#### Expected Response
```json
{
  "message": "Question added successfully",
  "data": {
    "_id": "69412ede4ed8fce5824373d2",
    "questionNumber": 6,
    "questionText": "What is the chemical symbol for gold?",
    "questionType": "MCQ",
    "options": ["Go", "Gd", "Au", "Ag"],
    "correctOptionIndex": 2,
    "explanation": "",
    "marks": 4,
    "negativeMarks": 0.5
  }
}
```

### Delete Question

**Endpoint**: `DELETE /api/admin/daily-quizzes/:quizId/questions/:questionId`
**Method**: DELETE
**Authentication**: Required (Admin token)

> **Granular API**: Allows deleting a specific question from a quiz

#### Path Parameters
- `quizId` (ObjectId) - ID of the daily quiz
- `questionId` (ObjectId) - ID of the question to delete

#### Sample Request
```
DELETE /api/admin/daily-quizzes/69412ede4ed8fce5824373cf/questions/69412ede4ed8fce5824373d1
```

#### Expected Response
```json
{
  "message": "Question deleted successfully"
}