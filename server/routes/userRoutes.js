const express = require('express');
const {
  getProfile,
  updateProfile,
  getMyTransactions,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getDashboardStats
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.route('/profile')
  .get(protect, getProfile)
  .put(protect, updateProfile);

router.get('/transactions', protect, getMyTransactions);

router.get('/stats', protect, admin, getDashboardStats);

router.get('/dashboard/stats', protect, admin, getDashboardStats);

router.route('/')
  .get(protect, admin, getUsers);

router.route('/:id')
  .get(protect, admin, getUser)
  .put(protect, admin, updateUser)
  .delete(protect, admin, deleteUser);

module.exports = router; 