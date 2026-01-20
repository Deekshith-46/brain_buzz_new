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