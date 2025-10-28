const express = require('express');
const router = express.Router();
const borrowRequestController = require('../controllers/borrowRequest.controller');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Create a new borrow request (student only)
router.post('/', authenticateToken, borrowRequestController.createBorrowRequest);

// Get all borrow requests (admin only)
router.get('/all', authenticateToken, isAdmin, borrowRequestController.getAllBorrowRequests);

// Get student's borrow requests
router.get('/student', authenticateToken, borrowRequestController.getStudentBorrowRequests);

// Update borrow request status (admin only)
router.patch('/:requestId/status', authenticateToken, isAdmin, borrowRequestController.updateBorrowRequestStatus);

// Return a book
router.post('/:requestId/return', authenticateToken, borrowRequestController.returnBook);

module.exports = router; 