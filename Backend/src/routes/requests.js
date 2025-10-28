const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const BookRequest = require('../models/BookRequest');
const Book = require('../models/Book');

// Middleware to verify student role
const isStudent = (req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Access denied. Students only.' });
  }
  next();
};

// Get all requests for a student
router.get('/my-requests', isStudent, async (req, res) => {
  try {
    const requests = await BookRequest.find({ student: req.user.userId })
      .populate('book', 'title author isbn imageUrl');
    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new book request
router.post('/', isStudent, [
  body('bookId').notEmpty().withMessage('Book ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { bookId } = req.body;

    // Check if book exists and is available
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    if (book.available <= 0) {
      return res.status(400).json({ message: 'Book is not available' });
    }

    // Check if student already has a pending request for this book
    const existingRequest = await BookRequest.findOne({
      student: req.user.userId,
      book: bookId,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'You already have a pending request for this book' });
    }

    // Create new request
    const request = new BookRequest({
      student: req.user.userId,
      book: bookId,
      status: 'pending',
      requestDate: new Date()
    });

    await request.save();
    res.status(201).json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Return a book
router.post('/:id/return', isStudent, async (req, res) => {
  try {
    const request = await BookRequest.findById(req.params.id)
      .populate('book');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.student.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to return this book' });
    }

    if (request.status !== 'approved') {
      return res.status(400).json({ message: 'Book is not currently checked out' });
    }

    // Update request status
    request.status = 'returned';
    request.returnDate = new Date();

    // Update book availability
    const book = await Book.findById(request.book._id);
    book.available += 1;
    await book.save();

    await request.save();
    res.json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 