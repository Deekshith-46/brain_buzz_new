# Enhanced Access Control Implementation

## Overview

This document outlines the enhanced access control system implemented for the Brain Buzz Backend application. The system ensures proper enforcement of course access rules, including free previews, purchase requirements, and validity periods.

## Key Improvements

### 1. Enhanced Access Control Middleware
- Created `checkCourseAccess` middleware that strictly enforces the business rules
- Validates all three conditions: purchase existence, completion status, and validity period
- Handles both course-level and class-level access control

### 2. Centralized Access Context
- Introduced `getCourseAccessContext()` to provide a single source of truth
- Avoids multiple database calls in loops
- Separates course-level and class-level access logic

### 3. Strict Enforcement Rules
- **First 2 classes are free**: Users can access the first 2 classes without purchase
- **Purchase required**: From the 3rd class onwards, users must have purchased the course
- **Validity check**: Purchases must have `status: 'completed'` and not be expired
- **Active course check**: Ensures the course itself is active

### 4. Optimized Performance
- Eliminated N+1 database query problem in `getCourseById`
- Reduced redundant database calls by fetching purchase once
- Centralized access logic for better maintainability

### 5. Updated Controllers
- Enhanced `getCourseById` to use centralized access context
- Updated `getCourseClass` to enforce strict access rules
- Improved `listCourses` to use course-level access validation
- Updated `initiateCoursePurchase` to use centralized access checks

## Implementation Details

### Middleware: `checkCourseAccess`

Location: `src/middlewares/checkCourseAccess.js`

#### Features:
- Checks course activity status
- Validates user purchase with status and expiry date
- Handles both free preview classes and paid content
- Supports both course ID and class ID parameter extraction

#### Logic Flow:
```javascript
if (course.accessType === 'FREE') {
  allowAccess();
} else if (classIndex < 2) {
  allowAccessAsFreePreview();
} else {
  if (!purchase) deny("Requires purchase");
  if (purchase.status !== "completed") deny("Payment incomplete");
  if (purchase.expiryDate < today) deny("Course expired");
  allowAccess();
}
```

### Helper Functions

#### `getCourseAccessContext(userId, courseId)`
- Fetches purchase details once for the entire course
- Provides `canAccessClass(index)` method for class-level access
- Returns centralized access information

#### `checkCoursePurchase(userId, courseId)`
- Validates course-level purchase and validity
- Separated from class-level access logic

#### `checkClassAccess(index, courseAccess)`
- Determines access based on class index and purchase context
- Handles free preview logic separately

### Controller Updates

#### `getCourseById`
- Uses centralized access context to avoid multiple DB calls
- Processes classes with single access check
- Properly awaits async operations
- Maintains admin access privileges
- Includes validity status in response

#### `getCourseClass`
- Implements strict access control for individual classes
- Uses centralized access context
- Validates purchase status and expiry date
- Provides clear error messages for access denials

#### `listCourses`
- Uses course-level access validation
- Properly determines purchase status without class-level concerns
- Maintains performance with optimized queries

#### `initiateCoursePurchase`
- Uses centralized access context for duplicate purchase checks
- Properly validates existing purchase status

### Route Updates

#### Course Class Route
- Updated `/courses/:courseId/classes/:classId` to use enhanced middleware
- Replaced generic `checkContentAccess` with specific `checkCourseAccess`
- Maintains user authentication requirement

## Business Rules Enforced

### 1. Free Preview Policy
- First 2 classes in any course are available for free
- Applies to all non-free courses
- Class order determined by `order` field or array position

### 2. Purchase Requirements
- Courses marked as `accessType: 'FREE'` are always accessible
- Paid courses require valid purchase with:
  - `status: 'completed'`
  - Valid `expiryDate` (future date)
  - Matching `itemId` and `itemType`

### 3. Validity Enforcement
- Purchase validity checked on every protected endpoint
- Expiry date compared against current date
- Invalid/expired purchases denied access

## Performance Optimizations

### 1. N+1 Query Prevention
- `getCourseById` now fetches purchase once instead of per class
- Centralized access context eliminates redundant DB calls
- Significantly improved performance for courses with many classes

### 2. Separation of Concerns
- Course-level access separated from class-level access
- Cleaner, more maintainable code structure
- Better testability and debugging

## Security Considerations

### 1. Server-Side Validation
- All access checks performed on server
- Client cannot bypass validation
- Proper error handling prevents information leakage

### 2. Data Protection
- Video URLs hidden for locked classes
- Only metadata accessible without proper access
- Purchase status not cached client-side

### 3. Parameter Validation
- Course and class IDs validated for existence
- User ID extracted from authenticated session
- Proper error responses for invalid parameters

## Integration Points

### 1. Database Models
- Works with `Course` model for course validation
- Integrates with `Purchase` model for access validation
- Uses `ValidityOption` for expiry calculation

### 2. Payment System
- Compatible with existing Razorpay integration
- Purchase records created via `PurchaseService`
- Coupon and discount handling preserved

### 3. Frontend Integration
- Clear API responses for access states
- Proper error messages for purchase prompts
- Consistent response format maintained

## Testing Scenarios

### Positive Cases:
1. Free course access (always allowed)
2. First 2 classes in paid course (free preview)
3. Valid purchase with active course
4. Admin access (full privileges)

### Negative Cases:
1. No purchase for paid course
2. Pending/incomplete purchase
3. Expired purchase
4. Inactive course
5. Invalid course/class IDs

## Deployment Checklist

- [ ] Verify middleware is properly imported in routes
- [ ] Test all course access scenarios
- [ ] Confirm admin access remains unrestricted
- [ ] Validate performance improvements
- [ ] Test edge cases with courses having many classes
- [ ] Confirm existing functionality remains intact

## Future Enhancements

### Planned Features:
- Time-based access restrictions
- Per-class purchase options
- Bulk access validation for playlists
- Analytics for access patterns

### Potential Improvements:
- Caching for frequently accessed validations
- Rate limiting for access attempts
- Audit logging for access events
- Integration with content delivery network