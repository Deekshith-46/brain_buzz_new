const EBook = require('../../models/EBook/EBook');

// Public: list e-books with optional filters
exports.listEBooks = async (req, res) => {
  try {
    const { category, subCategory, language } = req.query;

    const filter = {
      contentType: 'E_BOOK',
      isActive: true,
    };

    if (category) filter.categories = category;
    if (subCategory) filter.subCategories = subCategory;
    if (language) filter.languages = language;

    const ebooks = await EBook.find(filter)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code');

    return res.status(200).json({ data: ebooks });
  } catch (error) {
    console.error('Error listing E-Books:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Public: get single e-book by id
exports.getEBookById = async (req, res) => {
  try {
    const { id } = req.params;

    const ebook = await EBook.findOne({
      _id: id,
      contentType: 'E_BOOK',
      isActive: true,
    })
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code');

    if (!ebook) {
      return res.status(404).json({ message: 'E-Book not found' });
    }

    return res.status(200).json({ data: ebook });
  } catch (error) {
    console.error('Error fetching E-Book:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
