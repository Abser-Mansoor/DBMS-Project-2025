const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../SQL/db');
const { verifyToken } = require('../middleware/auth');

// ---------------------------
// Get student's borrowed books
// ---------------------------
router.get('/my-books', verifyToken, async (req, res) => {
  try {
    const query = `
      SELECT br.*, b.title, b.author
      FROM borrow_requests br
      JOIN books b ON br.book_id = b.id
      WHERE br.student_id = $1 AND br.status = 'approved'
      ORDER BY br.request_date DESC;
    `;
    const result = await db.query(query, [req.user._id]);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------------------------
// Get student's borrow request history
// ---------------------------
router.get('/my-requests', verifyToken, async (req, res) => {
  try {
    const query = `
      SELECT br._id, br.book_id, b.title AS book_title,
             br.status, br.request_date, br.approval_date,
             br.return_date, br.due_date, br.actual_return_date,
             br.fine
      FROM borrow_requests br
      JOIN books b ON br.book_id = b.id
      WHERE br.student_id = $1
      ORDER BY br.request_date DESC;
    `;

    const result = await db.query(query, [req.user._id]);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------------------------
// Submit a borrow request
// ---------------------------
router.post(
  '/borrow-request',
  verifyToken,
  [body('bookId').notEmpty().withMessage('Book ID is required')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });

      const { bookId } = req.body;

      // Check book exists + available
      const bookQ = await db.query(
        `SELECT * FROM books WHERE id = $1`,
        [bookId]
      );

      if (bookQ.rows.length === 0)
        return res.status(404).json({ message: 'Book not found' });

      const book = bookQ.rows[0];

      if (book.available <= 0)
        return res
          .status(400)
          .json({ message: 'Book is not available for borrowing' });

      // Check student already has pending/approved request for this book
      const existQ = await db.query(
        `
        SELECT * FROM borrow_requests
        WHERE student_id = $1
        AND book_id = $2
        AND status IN ('pending', 'approved');
      `,
        [req.user._id, bookId]
      );

      if (existQ.rows.length > 0) {
        const r = existQ.rows[0];

        return res.status(400).json({
          message:
            r.status === 'pending'
              ? 'You already have a pending request for this book'
              : 'You have already borrowed this book',
        });
      }

      // Create borrow request
      const insertQuery = `
        INSERT INTO borrow_requests 
        (student_id, book_id, status, request_date, due_date)
        VALUES ($1, $2, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '14 days')
        RETURNING *;
      `;

      const newReq = await db.query(insertQuery, [req.user._id, bookId]);

      res.status(201).json(newReq.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// ---------------------------
// Submit a new book request
// ---------------------------
router.post(
  '/new-book-request',
  verifyToken,
  [
    body('title').trim().notEmpty().withMessage('Book title is required'),
    body('author').trim().notEmpty().withMessage('Author is required'),
    body('reason').trim().notEmpty().withMessage('Reason is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });

      const { title, author, reason } = req.body;

      const query = `
      INSERT INTO book_requests 
      (student_id, title, author, reason, status, request_date)
      VALUES ($1, $2, $3, $4, 'pending', CURRENT_TIMESTAMP)
      RETURNING *;
      `;

      const result = await db.query(query, [
        req.user._id,
        title,
        author,
        reason,
      ]);

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// ---------------------------
// Get student's new book requests
// ---------------------------
router.get('/new-book-requests', verifyToken, async (req, res) => {
  try {
    const query = `
      SELECT * FROM book_requests
      WHERE student_id = $1
      ORDER BY request_date DESC;
    `;
    const result = await db.query(query, [req.user._id]);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------------------------
// Search books
// ---------------------------
router.get('/books/search', verifyToken, async (req, res) => {
  try {
    const { query, category, available, page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;
    let where = [];
    let params = [];
    let idx = 1;

    if (query) {
      where.push(`(title ILIKE $${idx} OR author ILIKE $${idx} OR isbn ILIKE $${idx})`);
      params.push(`%${query}%`);
      idx++;
    }

    if (category && category !== 'all') {
      where.push(`category = $${idx}`);
      params.push(category);
      idx++;
    }

    if (available === 'true') {
      where.push(`available > 0`);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const booksQ = `
      SELECT * FROM books
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset};
    `;

    const countQ = `
      SELECT COUNT(*) FROM books
      ${whereClause};
    `;

    const books = await db.query(booksQ, params);
    const total = await db.query(countQ, params);

    res.json({
      books: books.rows,
      total: Number(total.rows[0].count),
      totalPages: Math.ceil(total.rows[0].count / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------------------------
// Return a borrowed book
// ---------------------------
router.post('/borrow-requests/:requestId/return', verifyToken, async (req, res) => {
  try {
    const query = `
      SELECT br.*, b.id AS book_id
      FROM borrow_requests br
      JOIN books b ON br.book_id = b.id
      WHERE br._id = $1 AND br.student_id = $2 AND br.status = 'approved';
    `;
    const result = await db.query(query, [req.params.requestId, req.user._id]);

    if (result.rows.length === 0)
      return res.status(404).json({ message: 'Borrow request not found or not approved' });

    const reqRow = result.rows[0];

    const returnDate = new Date(reqRow.return_date);
    const now = new Date();
    let fine = 0;

    if (now > returnDate) {
      const daysLate = Math.ceil((now - returnDate) / (1000 * 60 * 60 * 24));
      fine = daysLate * 1;
    }

    // Update book availability
    await db.query(`UPDATE books SET available = available + 1 WHERE id = $1`, [
      reqRow.book_id,
    ]);

    // Update borrow request
    const updateQ = `
      UPDATE borrow_requests
      SET status = 'returned',
          actual_return_date = CURRENT_TIMESTAMP,
          fine = $1
      WHERE _id = $2
      RETURNING *;
    `;
    const updated = await db.query(updateQ, [fine, req.params.requestId]);

    res.json(updated.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;