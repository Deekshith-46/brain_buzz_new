/**
 * Reusable helper function to validate that categories and subcategories
 * match the content type of the parent document
 * 
 * @param {Array} categories - Array of category IDs
 * @param {Array} subCategories - Array of subcategory IDs
 * @param {String} contentType - Expected content type
 * @param {Object} CategoryModel - Mongoose Category model
 * @param {Object} SubCategoryModel - Mongoose SubCategory model
 * @returns {Promise<void>} - Throws error if validation fails
 */
async function validateCategorySubCategory(categories, subCategories, contentType, CategoryModel, SubCategoryModel) {
  if (categories && categories.length > 0) {
    const cats = await CategoryModel.find({ _id: { $in: categories } });
    const invalidCategory = cats.find(cat => cat.contentType !== contentType);
    if (invalidCategory) {
      throw new Error(`Category ${invalidCategory.name} does not match content type ${contentType}`);
    }
  }

  if (subCategories && subCategories.length > 0) {
    const subs = await SubCategoryModel.find({ _id: { $in: subCategories } });
    const invalidSubCategory = subs.find(sub => sub.contentType !== contentType);
    if (invalidSubCategory) {
      throw new Error(`SubCategory ${invalidSubCategory.name} does not match content type ${contentType}`);
    }
  }
}

module.exports = { validateCategorySubCategory };