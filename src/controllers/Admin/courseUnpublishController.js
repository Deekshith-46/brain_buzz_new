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