const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const client = require('../SQL/db'); // your PG client

// Middleware to verify student role
const isStudent = (req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Access denied. Students only.' });
  }
  next();
};

// ==========================================
// GET: Fetch all requests for a student
// ==========================================
router.get('/my-requests', isStudent, async (req, res) => {
  try {
    const query = `
      SELECT br.*, 
             b.title, b.author, b.isbn, b.image_url
      FROM borrow_requests br
      JOIN books b ON br.book_id = b._id
      WHERE br.student_id = $1
      ORDER BY br.request_date DESC;
    `;

    const result = await client.query(query, [req.user.userId]);
    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==========================================
// POST: Create a new book request
// ==========================================
router.post('/', isStudent, [
  body('bookId').notEmpty().withMessage('Book ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { bookId } = req.body;
    const studentId = req.user.userId;

    // Check if book exists and is available
    const bookQuery = `SELECT * FROM books WHERE _id = $1`;
    const book = await client.query(bookQuery, [bookId]);

    if (book.rows.length === 0) {
      return res.status(404).json({ message: 'Book not found' });
    }

    if (book.rows[0].available <= 0) {
      return res.status(400).json({ message: 'Book is not available' });
    }

    // Check if student already has a pending request for this book
    const existQuery = `
      SELECT * FROM borrow_requests
      WHERE student_id = $1 AND book_id = $2 AND status = 'pending'
    `;

    const existing = await client.query(existQuery, [studentId, bookId]);

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'You already have a pending request for this book' });
    }

    // Create new request
    const insertQuery = `
      INSERT INTO borrow_requests (book_id, student_id, status, request_date)
      VALUES ($1, $2, 'pending', CURRENT_TIMESTAMP)
      RETURNING *;
    `;

    const request = await client.query(insertQuery, [bookId, studentId]);

    res.status(201).json(request.rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==========================================
// POST: Return a book
// ==========================================
router.post('/:id/return', isStudent, async (req, res) => {
  try {
    const requestId = req.params.id;

    // Get request info + book info
    const query = `
      SELECT br.*, b._id AS book_id, b.available
      FROM borrow_requests br
      JOIN books b ON br.book_id = b._id
      WHERE br._id = $1
    `;

    const result = await client.query(query, [requestId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const request = result.rows[0];

    if (request.student_id !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to return this book' });
    }

    if (request.status !== 'approved') {
      return res.status(400).json({ message: 'Book is not currently checked out' });
    }

    // Update request → returned
    const updateReqQuery = `
      UPDATE borrow_requests
      SET status = 'returned', return_date = CURRENT_TIMESTAMP
      WHERE _id = $1
    `;
    await client.query(updateReqQuery, [requestId]);

    // Update book availability
    const updateBookQuery = `
      UPDATE books
      SET available = available + 1
      WHERE _id = $1
    `;
    await client.query(updateBookQuery, [request.book_id]);

    res.json({ message: 'Book returned successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
