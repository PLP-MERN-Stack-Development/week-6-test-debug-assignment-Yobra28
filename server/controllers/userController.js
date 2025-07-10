const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Book = require('../models/Book');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('issuedBooks.bookId', 'title author');

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber, address } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { firstName, lastName, phoneNumber, address },
      { new: true, runValidators: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user's transactions
// @route   GET /api/users/transactions
// @access  Private
const getMyTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id })
      .populate('book', 'title author coverImage')
      .sort({ createdAt: -1 });

    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private (Admin)
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    
    let query = {};
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (page - 1) * limit;
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(query);
    
    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single user (Admin only)
// @route   GET /api/users/:id
// @access  Private (Admin)
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('issuedBooks.bookId', 'title author');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const transactions = await Transaction.find({ user: user._id })
      .populate('book', 'title author')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ user, transactions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user (Admin only)
// @route   PUT /api/users/:id
// @access  Private (Admin)
const updateUser = async (req, res) => {
  try {
    const { firstName, lastName, role, isActive, phoneNumber, address } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { firstName, lastName, role, isActive, phoneNumber, address },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has active book issues
    const activeTransactions = await Transaction.countDocuments({
      user: user._id,
      status: 'approved',
      returnedAt: { $exists: false }
    });

    if (activeTransactions > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete user with active book issues. Please return all books first.' 
      });
    }

    // Soft delete - deactivate user instead of actually deleting
    user.isActive = false;
    await user.save();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get dashboard statistics (Admin only)
// @route   GET /api/users/dashboard/stats
// @access  Private (Admin)
const getDashboardStats = async (req, res) => {
  try {
    console.log('Dashboard stats endpoint hit');
    
    // Simplified version for debugging
    const totalUsers = await User.countDocuments({ isActive: true });
    console.log('Total users:', totalUsers);
    
    res.json({
      totalUsers,
      totalBooks: 0,
      totalTransactions: 0,
      pendingRequests: 0,
      activeIssues: 0,
      availableBooks: 0,
      recentTransactions: []
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getMyTransactions,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getDashboardStats
}; 