const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Book = require('../models/Book');
const BorrowRequest = require('../models/BorrowRequest');

// Middleware to verify admin role
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
  next();
};

// Get all books
router.get('/', async (req, res) => {
  try {
    const books = await Book.find();
    res.json(books);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single book
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.json(book);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a new book (Admin only)
router.post('/', isAdmin, [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('author').trim().notEmpty().withMessage('Author is required'),
  body('isbn').trim().notEmpty().withMessage('ISBN is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, author, isbn, description, category, quantity, imageUrl } = req.body;

    // Check if ISBN already exists
    const existingBook = await Book.findOne({ isbn });
    if (existingBook) {
      return res.status(400).json({ message: 'Book with this ISBN already exists' });
    }

    const book = new Book({
      title,
      author,
      isbn,
      description,
      category,
      quantity,
      available: quantity,
      imageUrl
    });

    await book.save();
    res.status(201).json(book);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a book (Admin only)
router.put('/:id', isAdmin, [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('author').trim().notEmpty().withMessage('Author is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, author, description, category, quantity, imageUrl } = req.body;

    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Calculate new available count
    const newAvailable = book.available + (quantity - book.quantity);

    book.title = title;
    book.author = author;
    book.description = description;
    book.category = category;
    book.quantity = quantity;
    book.available = newAvailable;
    book.imageUrl = imageUrl;

    await book.save();
    res.json(book);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a book (Admin only)
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Check for active borrows
    if (book.quantity !== book.available) {
      return res.status(400).json({ 
        message: 'Cannot delete book with active borrows',
        activeLoans: book.quantity - book.available
      });
    }

    // Check for pending borrow requests
    const pendingRequests = await BorrowRequest.countDocuments({
      book: book._id,
      status: 'pending'
    });

    if (pendingRequests > 0) {
      return res.status(400).json({
        message: 'Cannot delete book with pending borrow requests',
        pendingRequests
      });
    }

    // Use deleteOne instead of deprecated remove()
    await Book.deleteOne({ _id: book._id });

    res.json({ 
      message: 'Book deleted successfully',
      deletedBook: {
        title: book.title,
        author: book.author,
        isbn: book.isbn
      }
    });
  } catch (error) {
    console.error('Error in deleteBook:', error);
    res.status(500).json({ 
      message: 'Error deleting book',
      error: error.message 
    });
  }
});

module.exports = router; 