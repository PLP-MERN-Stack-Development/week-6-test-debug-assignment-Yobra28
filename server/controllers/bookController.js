const Book = require('../models/Book');
const Transaction = require('../models/Transaction');

// @desc    Get all books
// @route   GET /api/books
// @access  Public
const getBooks = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    
    let query = { isActive: true };
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { genre: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (page - 1) * limit;
    
    const books = await Book.find(query)
      .populate('addedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Book.countDocuments(query);
    
    res.json({
      books,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single book
// @route   GET /api/books/:id
// @access  Public
const getBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
      .populate('addedBy', 'firstName lastName');
    
    if (!book || !book.isActive) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    res.json(book);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create new book
// @route   POST /api/books
// @access  Private (Admin only)
const createBook = async (req, res) => {
  try {
    const bookData = {
      ...req.body,
      addedBy: req.user._id
    };

    // Set availableCopies to totalCopies if not provided
    if (bookData.availability && !bookData.availability.availableCopies) {
      bookData.availability.availableCopies = bookData.availability.totalCopies || 1;
    }

    const book = await Book.create(bookData);
    await book.populate('addedBy', 'firstName lastName');
    
    res.status(201).json(book);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update book
// @route   PUT /api/books/:id
// @access  Private (Admin only)
const updateBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    
    if (!book || !book.isActive) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('addedBy', 'firstName lastName');
    
    res.json(updatedBook);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete book
// @route   DELETE /api/books/:id
// @access  Private (Admin only)
const deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    // Check if book is currently issued
    const activeTransactions = await Transaction.countDocuments({
      book: book._id,
      status: 'approved',
      returnedAt: { $exists: false }
    });
    
    if (activeTransactions > 0) {
      return res.status(400).json({ message: 'Cannot delete book that is currently issued' });
    }
    
    // Soft delete
    book.isActive = false;
    await book.save();
    
    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Search books
// @route   GET /api/books/search
// @access  Public
const searchBooks = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: 'Search query required' });
    }
    
    const books = await Book.find({
      isActive: true,
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { author: { $regex: q, $options: 'i' } },
        { genre: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ]
    }).populate('addedBy', 'firstName lastName');
    
    res.json(books);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
  searchBooks
}; 