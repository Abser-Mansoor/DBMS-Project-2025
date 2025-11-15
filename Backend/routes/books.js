const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

// Middleware to verify admin role
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
  next();
};

// ============================
// Get all books
// ============================
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM books ORDER BY _id');
    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================
// Get a single book
// ============================
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM books WHERE _id = $1', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Book not found' });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================
// Add a new book (Admin only)
// ============================
router.post(
  '/',
  verifyToken,
  isAdmin,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('author').trim().notEmpty().withMessage('Author is required'),
    body('isbn').trim().notEmpty().withMessage('ISBN is required'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
  ],
  async (req, res) => {
    try {

      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { title, author, isbn, description, category, quantity } = req.body;

      // Check for duplicate ISBN
      const existing = await db.query('SELECT * FROM books WHERE isbn = $1', [isbn]);
      if (existing.rows.length > 0) {
        return res.status(400).json({ message: 'Book with this ISBN already exists' });
      }

      // Insert
      const insertQuery = `
        INSERT INTO books (title, author, isbn, description, category, quantity, available)
        VALUES ($1, $2, $3, $4, $5, $6, $6)
        RETURNING *
      `;

      const result = await db.query(insertQuery, [
        title, author, isbn, description, category, quantity
      ]);

      res.status(201).json(result.rows[0]);

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// ============================
// Update a book (Admin only)
// ============================
router.put(
  '/:id',
  verifyToken,
  isAdmin,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('author').trim().notEmpty().withMessage('Author is required'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('quantity').isInt({ min: 0 }).withMessage('Quantity must be ≥ 0')
  ],
  async (req, res) => {
    try {

      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { title, author, description, category, quantity } = req.body;

      // Fetch book
      const bookResult = await db.query('SELECT * FROM books WHERE _id = $1', [req.params.id]);
      if (bookResult.rows.length === 0)
        return res.status(404).json({ message: 'Book not found' });

      const book = bookResult.rows[0];

      // How many copies are currently borrowed?
      const borrowed = book.quantity - book.available;

      if (quantity < borrowed) {
        return res.status(400).json({
          message: 'Quantity cannot be less than borrowed copies'
        });
      }

      const available = quantity - borrowed;

      // Update query
      const updateQuery = `
        UPDATE books
        SET title=$1, author=$2, description=$3, category=$4, quantity=$5, available=$6
        WHERE _id=$7
        RETURNING *
      `;

      const updated = await db.query(updateQuery, [
        title, author, description, category, quantity, available, req.params.id
      ]);

      res.json(updated.rows[0]);

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// ============================
// Delete a book (Admin only)
// ============================
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {

    const result = await db.query('SELECT * FROM books WHERE _id = $1', [req.params.id]);
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'Book not found' });

    const book = result.rows[0];

    const borrowed = book.quantity - book.available;
    if (borrowed > 0) {
      return res.status(400).json({
        message: 'Cannot delete book with active borrows',
        activeLoans: borrowed
      });
    }

    // Pending borrow requests?
    const pending = await db.query(
      'SELECT COUNT(*) FROM borrow_requests WHERE book_id = $1 AND status = $2',
      [book._id, 'pending']
    );

    if (parseInt(pending.rows[0].count) > 0) {
      return res.status(400).json({
        message: 'Cannot delete book with pending borrow requests',
        pendingRequests: pending.rows[0].count
      });
    }

    await db.query('DELETE FROM books WHERE _id = $1', [book._id]);

    res.json({
      message: 'Book deleted successfully',
      deletedBook: {
        title: book.title,
        author: book.author,
        isbn: book.isbn
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
