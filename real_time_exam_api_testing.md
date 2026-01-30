# Real-Time Exam API Testing Documentation

## Overview

This document provides testing procedures for the newly implemented real-time exam APIs that transform your existing system into a production-ready CBT (Computer-Based Test) engine.

## New APIs Implemented

### 1. Get Live Questions for Active Attempt
```
GET /api/v1/test-attempts/:attemptId/questions
```

### 2. Get Question Paper (Lightweight View)
```
GET /api/v1/test-attempts/:attemptId/question-paper?sectionId=optional
```

### 3. Enhanced Submit Answer API
```
POST /api/v1/test-attempts/:seriesId/:testId/submit-question
```
(Now supports markedForReview and null responses for clearing)

## Complete End-to-End Testing Flow

### Phase 1: Setup and Start Test

#### 1.1 Start a New Test Attempt
```bash
curl -X POST "http://localhost:5000/api/v1/test-attempts/SERIES_ID/TEST_ID/start" \
  -H "Authorization: Bearer USER_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Test started successfully",
  "data": {
    "_id": "attempt_id",
    "user": "user_id",
    "testSeries": "series_id",
    "testId": "test_id",
    "startedAt": "2024-01-28T10:00:00.000Z",
    "responses": [],
    "status": "IN_PROGRESS"
  }
}
```

### Phase 2: Load Exam Interface

#### 2.1 Get Live Questions (Exam Mode)
```bash
curl -X GET "http://localhost:5000/api/v1/test-attempts/ATTEMPT_ID/questions" \
  -H "Authorization: Bearer USER_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "remainingTime": 3600,
    "sections": [
      {
        "sectionId": "section1_id",
        "title": "General Studies",
        "questions": [
          {
            "questionId": "q1_id",
            "questionNumber": 1,
            "questionText": "Which Article of the Indian Constitution empowers the Parliament to amend the Constitution?",
            "options": [
              "Article 23",
              "Article 24", 
              "Article 25",
              "Article 26"
            ],
            "status": "UNVISITED",
            "selectedOption": null,
            "markedForReview": false
          }
        ]
      }
    ],
    "palette": {
      "ANSWERED": 0,
      "ANSWERED_MARKED": 0,
      "UNANSWERED": 0,
      "MARKED": 0,
      "UNVISITED": 1
    },
    "testInfo": {
      "testName": "UPSC Prelims Mock Test",
      "totalQuestions": 1,
      "startedAt": "2024-01-28T10:00:00.000Z"
    }
  }
}
```

### Phase 3: Question Interaction Testing

#### 3.1 Save Answer (Normal Response)
```bash
curl -X POST "http://localhost:5000/api/v1/test-attempts/SERIES_ID/TEST_ID/submit-question" \
  -H "Authorization: Bearer USER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sectionId": "section1_id",
    "questionId": "q1_id",
    "selectedOption": 2,
    "timeTaken": 45,
    "markedForReview": false
  }'
```

#### 3.2 Mark for Review Only
```bash
curl -X POST "http://localhost:5000/api/v1/test-attempts/SERIES_ID/TEST_ID/submit-question" \
  -H "Authorization: Bearer USER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sectionId": "section1_id",
    "questionId": "q1_id",
    "selectedOption": null,
    "timeTaken": 30,
    "markedForReview": true
  }'
```

#### 3.3 Save Answer AND Mark for Review
```bash
curl -X POST "http://localhost:5000/api/v1/test-attempts/SERIES_ID/TEST_ID/submit-question" \
  -H "Authorization: Bearer USER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sectionId": "section1_id",
    "questionId": "q1_id",
    "selectedOption": 1,
    "timeTaken": 60,
    "markedForReview": true
  }'
```

#### 3.4 Clear Response
```bash
curl -X POST "http://localhost:5000/api/v1/test-attempts/SERIES_ID/TEST_ID/submit-question" \
  -H "Authorization: Bearer USER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sectionId": "section1_id",
    "questionId": "q1_id",
    "selectedOption": null,
    "timeTaken": 15,
    "markedForReview": false
  }'
```

### Phase 4: Question Paper View

#### 4.1 Get All Questions (Question Paper View)
```bash
curl -X GET "http://localhost:5000/api/v1/test-attempts/ATTEMPT_ID/question-paper" \
  -H "Authorization: Bearer USER_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "questionId": "q1_id",
      "questionNumber": 1,
      "sectionTitle": "General Studies"
    },
    {
      "questionId": "q2_id", 
      "questionNumber": 2,
      "sectionTitle": "General Studies"
    }
  ]
}
```

#### 4.2 Get Questions from Specific Section
```bash
curl -X GET "http://localhost:5000/api/v1/test-attempts/ATTEMPT_ID/question-paper?sectionId=section1_id" \
  -H "Authorization: Bearer USER_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "questionId": "q1_id",
      "questionNumber": 1,
      "questionText": "Which Article of the Indian Constitution..."
    }
  ]
}
```

### Phase 5: Status Verification

#### 5.1 Verify Question Status Updates
After each interaction, call the live questions API to verify status changes:

```bash
curl -X GET "http://localhost:5000/api/v1/test-attempts/ATTEMPT_ID/questions" \
  -H "Authorization: Bearer USER_JWT_TOKEN"
```

**Status Mapping:**
- `UNVISITED` → Question never accessed
- `ANSWERED` → Option selected, not marked for review
- `MARKED` → Marked for review, no option selected
- `ANSWERED_MARKED` → Option selected AND marked for review

### Phase 6: Timer and Auto-submit Testing

#### 6.1 Test Timer Calculation
The API automatically calculates remaining time based on:
```
remainingTime = test_duration - (current_time - startedAt)
```

Call the live questions API multiple times to verify timer decreases:
```bash
# First call
curl -X GET "http://localhost:5000/api/v1/test-attempts/ATTEMPT_ID/questions" \
  -H "Authorization: Bearer USER_JWT_TOKEN"

# Wait 30 seconds
sleep 30

# Second call - should show reduced time
curl -X GET "http://localhost:5000/api/v1/test-attempts/ATTEMPT_ID/questions" \
  -H "Authorization: Bearer USER_JWT_TOKEN"
```

### Phase 7: Complete Test Submission

#### 7.1 Submit Completed Test
```bash
curl -X POST "http://localhost:5000/api/v1/test-attempts/SERIES_ID/TEST_ID/submit" \
  -H "Authorization: Bearer USER_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Phase 8: Result Verification

#### 8.1 Get Detailed Results
```bash
curl -X GET "http://localhost:5000/api/v1/test-attempts/ATTEMPT_ID/result" \
  -H "Authorization: Bearer USER_JWT_TOKEN"
```

## Test Scenarios

### Scenario 1: Normal Exam Flow
1. Start test
2. Answer 5 questions normally
3. Mark 3 questions for review
4. Answer 2 marked questions
5. Submit test
6. Verify results and ranking

### Scenario 2: Time-based Auto-submit
1. Start test with short duration (60 seconds)
2. Don't submit manually
3. Verify auto-submission when time expires
4. Check results are generated

### Scenario 3: Mixed Interactions
1. Answer question → Status: ANSWERED
2. Mark same question → Status: ANSWERED_MARKED
3. Clear answer → Status: MARKED
4. Unmark → Status: UNVISITED

### Scenario 4: Section Navigation
1. Load questions from specific section
2. Navigate between sections
3. Verify palette updates correctly
4. Submit and verify section-wise analysis

## Error Handling Tests

### 1. Invalid Attempt ID
```bash
curl -X GET "http://localhost:5000/api/v1/test-attempts/INVALID_ID/questions" \
  -H "Authorization: Bearer USER_JWT_TOKEN"
```
**Expected:** 404 Not Found

### 2. Unauthorized Access
```bash
curl -X GET "http://localhost:5000/api/v1/test-attempts/ATTEMPT_ID/questions"
```
**Expected:** 401 Unauthorized

### 3. Completed Test Access
Try accessing questions after test submission
**Expected:** 400 Bad Request - "Test is no longer active"

### 4. Invalid Option Index
```bash
curl -X POST "http://localhost:5000/api/v1/test-attempts/SERIES_ID/TEST_ID/submit-question" \
  -H "Authorization: Bearer USER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sectionId": "section1_id",
    "questionId": "q1_id",
    "selectedOption": 99,  # Invalid option
    "timeTaken": 30
  }'
```
**Expected:** 400 Bad Request - "Invalid option selected"

## Integration with Figma UI

### Frontend Implementation Guide

#### 1. Initial Load
```javascript
// On exam page load
const loadExam = async (attemptId) => {
  const response = await fetch(`/api/v1/test-attempts/${attemptId}/questions`, {
    headers: {
      'Authorization': `Bearer ${jwtToken}`
    }
  });
  
  const data = await response.json();
  
  // Set timer
  setRemainingTime(data.data.remainingTime);
  
  // Load sections and questions
  setSections(data.data.sections);
  
  // Update palette
  setPalette(data.data.palette);
};
```

#### 2. Handle Answer Submission
```javascript
const saveAnswer = async (questionId, selectedOption, markedForReview = false) => {
  const response = await fetch(`/api/v1/test-attempts/${seriesId}/${testId}/submit-question`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sectionId: currentSectionId,
      questionId: questionId,
      selectedOption: selectedOption,
      timeTaken: timeSpentOnQuestion,
      markedForReview: markedForReview
    })
  });
  
  // Refresh question data to update status
  loadExam(currentAttemptId);
};
```

#### 3. Timer Management
```javascript
useEffect(() => {
  const timer = setInterval(() => {
    setRemainingTime(prev => {
      if (prev <= 0) {
        clearInterval(timer);
        autoSubmitTest();
        return 0;
      }
      return prev - 1;
    });
  }, 1000);
  
  return () => clearInterval(timer);
}, []);
```

#### 4. Question Palette Rendering
```javascript
const renderPalette = (palette) => (
  <div className="question-palette">
    <div className="palette-item answered">
      Answered: {palette.ANSWERED}
    </div>
    <div className="palette-item answered-marked">
      Answered & Marked: {palette.ANSWERED_MARKED}
    </div>
    <div className="palette-item marked">
      Marked: {palette.MARKED}
    </div>
    <div className="palette-item unvisited">
      Unvisited: {palette.UNVISITED}
    </div>
  </div>
);
```

## Performance Considerations

### 1. Caching Strategy
- Cache question data for 30 seconds to reduce API calls
- Invalidate cache on answer submission
- Refresh timer data every 10 seconds

### 2. WebSocket Alternative (Future Enhancement)
For real-time synchronization:
```javascript
// Subscribe to attempt updates
const socket = io('/exam', {
  auth: { token: jwtToken }
});

socket.on('attemptUpdate', (data) => {
  // Update UI in real-time
  setRemainingTime(data.remainingTime);
  setPalette(data.palette);
});
```

## Security Best Practices

### 1. Rate Limiting
Implement rate limiting on question submission:
- Max 10 submissions per minute per user
- Prevent rapid answer changing

### 2. Session Validation
- Validate JWT token on every request
- Check attempt ownership
- Verify test is still active

### 3. Data Sanitization
- Validate all input parameters
- Escape special characters in question text
- Limit request payload size

## Monitoring and Logging

### Essential Metrics to Track:
1. Average time per question
2. Question navigation patterns
3. Test completion rates
4. System response times
5. Error frequencies

### Log Important Events:
```javascript
// Log question interactions
logger.info({
  event: 'question_answered',
  userId: req.user._id,
  attemptId: req.params.attemptId,
  questionId: req.body.questionId,
  timeTaken: req.body.timeTaken,
  timestamp: new Date()
});
```

This comprehensive testing framework ensures your real-time exam system is production-ready and matches the Figma design requirements exactly.