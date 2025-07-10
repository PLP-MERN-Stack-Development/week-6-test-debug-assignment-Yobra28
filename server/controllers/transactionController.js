const Transaction = require('../models/Transaction');
const Book = require('../models/Book');
const User = require('../models/User');

// @desc    Get all transactions (Admin) or user's own transactions (User)
// @route   GET /api/transactions
// @access  Private
const getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type } = req.query;
    
    let query = {};
    
    // Users can only see their own transactions, admins see all
    if (req.user.role !== 'admin') {
      query.user = req.user._id;
    }
    
    if (status) query.status = status;
    if (type) query.type = type;
    
    const skip = (page - 1) * limit;
    
    const transactions = await Transaction.find(query)
      .populate('user', 'firstName lastName email')
      .populate('book', 'title author')
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Transaction.countDocuments(query);
    
    res.json({
      transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single transaction
// @route   GET /api/transactions/:id
// @access  Private
const getTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('user', 'firstName lastName email')
      .populate('book', 'title author')
      .populate('approvedBy', 'firstName lastName');
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    // Check if user can view this transaction
    if (req.user.role !== 'admin' && transaction.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this transaction' });
    }
    
    res.json(transaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Request book issue
// @route   POST /api/transactions/request
// @access  Private
const requestBook = async (req, res) => {
  try {
    const { bookId, notes } = req.body;
    
    // Check if book exists and is available
    const book = await Book.findById(bookId);
    if (!book || !book.isActive || !book.isAvailable()) {
      return res.status(400).json({ message: 'Book not available' });
    }
    
    // Check if user already has this book
    const existingTransaction = await Transaction.findOne({
      user: req.user._id,
      book: bookId,
      status: 'approved',
      returnedAt: { $exists: false }
    });
    
    if (existingTransaction) {
      return res.status(400).json({ message: 'You already have this book issued' });
    }
    
    const transaction = await Transaction.create({
      user: req.user._id,
      book: bookId,
      type: 'issue',
      notes
    });
    
    await transaction.populate([
      { path: 'user', select: 'firstName lastName email' },
      { path: 'book', select: 'title author' }
    ]);
    
    res.status(201).json(transaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Approve/Reject transaction (Admin only)
// @route   PUT /api/transactions/:id/status
// @access  Private (Admin)
const updateTransactionStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    if (transaction.status !== 'pending') {
      return res.status(400).json({ message: 'Can only update pending transactions' });
    }
    
    transaction.status = status;
    transaction.approvedBy = req.user._id;
    transaction.notes = notes || transaction.notes;
    
    if (status === 'approved' && transaction.type === 'issue') {
      // Set due date (14 days from now)
      transaction.issuedAt = new Date();
      transaction.dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      
      // Update book availability
      const book = await Book.findById(transaction.book);
      await book.issueBook();
      
      // Add to user's issued books
      const user = await User.findById(transaction.user);
      user.issuedBooks.push({
        bookId: transaction.book,
        issuedAt: transaction.issuedAt,
        dueDate: transaction.dueDate
      });
      await user.save();
    }
    
    await transaction.save();
    
    await transaction.populate([
      { path: 'user', select: 'firstName lastName email' },
      { path: 'book', select: 'title author' },
      { path: 'approvedBy', select: 'firstName lastName' }
    ]);
    
    res.json(transaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Return book
// @route   POST /api/transactions/return
// @access  Private
const returnBook = async (req, res) => {
  try {
    const { bookId, notes } = req.body;
    
    // Find the active issue transaction
    const issueTransaction = await Transaction.findOne({
      user: req.user._id,
      book: bookId,
      type: 'issue',
      status: 'approved',
      returnedAt: { $exists: false }
    });
    
    if (!issueTransaction) {
      return res.status(400).json({ message: 'No active issue found for this book' });
    }
    
    // Create return transaction
    const returnTransaction = await Transaction.create({
      user: req.user._id,
      book: bookId,
      type: 'return',
      status: 'pending',
      notes
    });
    
    await returnTransaction.populate([
      { path: 'user', select: 'firstName lastName email' },
      { path: 'book', select: 'title author' }
    ]);
    
    res.status(201).json(returnTransaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Complete return (Admin only)
// @route   PUT /api/transactions/:id/complete
// @access  Private (Admin)
const completeReturn = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    if (transaction.type !== 'return' || transaction.status !== 'approved') {
      return res.status(400).json({ message: 'Invalid transaction for completion' });
    }
    
    transaction.status = 'completed';
    transaction.returnedAt = new Date();
    
    // Check for overdue and calculate fine
    const issueTransaction = await Transaction.findOne({
      user: transaction.user,
      book: transaction.book,
      type: 'issue',
      status: 'approved'
    });
    
    if (issueTransaction && issueTransaction.dueDate < new Date()) {
      await issueTransaction.checkOverdue();
    }
    
    // Update book availability
    const book = await Book.findById(transaction.book);
    await book.returnBook();
    
    // Remove from user's issued books
    const user = await User.findById(transaction.user);
    const issuedBookIndex = user.issuedBooks.findIndex(
      book => book.bookId.toString() === transaction.book.toString() && !book.returned
    );
    
    if (issuedBookIndex !== -1) {
      user.issuedBooks[issuedBookIndex].returned = true;
      user.issuedBooks[issuedBookIndex].returnedAt = new Date();
      await user.save();
    }
    
    await transaction.save();
    
    res.json({ message: 'Return completed successfully', transaction });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete transaction (Admin only)
// @route   DELETE /api/transactions/:id
// @access  Private (Admin)
const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    // Check if it's an active issue transaction
    if (transaction.type === 'issue' && transaction.status === 'approved' && !transaction.returnedAt) {
      return res.status(400).json({ 
        message: 'Cannot delete active issue transaction. Please complete return first.' 
      });
    }
    
    await Transaction.findByIdAndDelete(req.params.id);
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getTransactions,
  getTransaction,
  requestBook,
  updateTransactionStatus,
  returnBook,
  completeReturn,
  deleteTransaction
}; 