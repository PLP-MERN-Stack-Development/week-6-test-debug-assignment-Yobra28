const express = require('express');
const {
  getTransactions,
  getTransaction,
  requestBook,
  updateTransactionStatus,
  returnBook,
  completeReturn,
  deleteTransaction
} = require('../controllers/transactionController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// Admin gets all transactions, users get their own
router.route('/')
  .get(protect, getTransactions);

router.post('/request', protect, requestBook);
router.post('/return', protect, returnBook);

router.route('/:id')
  .get(protect, getTransaction)
  .delete(protect, admin, deleteTransaction);

router.put('/:id/status', protect, admin, updateTransactionStatus);
router.put('/:id/complete', protect, admin, completeReturn);

module.exports = router; 