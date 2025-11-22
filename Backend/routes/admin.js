const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/auth');
const db = require('../SQL/db'); // Your initialized pg Pool
const { body, validationResult } = require('express-validator');

// ---------------- Dashboard Stats ----------------
router.get('/dashboard/stats', verifyToken, isAdmin, async (req, res) => {
  try {
    // Get counts
    const [
      { rows: totalBooksRows },
      { rows: availableBooksRows },
      { rows: pendingBorrowRequestsRows },
      { rows: pendingBookRequestsRows }
    ] = await Promise.all([
      db.query('SELECT COUNT(*) FROM books'),
      db.query('SELECT COUNT(*) FROM books WHERE available > 0'),
      db.query("SELECT COUNT(*) FROM borrow_requests WHERE status = 'pending'"),
      db.query("SELECT COUNT(*) FROM book_requests WHERE status = 'pending'")
    ]);

    // Get all borrow requests with student and book info
    const { rows: borrowRequests } = await db.query(`
      SELECT 
        br._id, 
        br.status, 
        br.request_date, 
        br.due_date, 
        u.name AS student_name, 
        b.title AS book_title
      FROM borrow_requests br
      JOIN users u ON br.student_id = u._id
      JOIN books b ON br.book_id = b._id
      ORDER BY br.request_date DESC
    `);

    // Get all book requests with requester info
    const { rows: bookRequests } = await db.query(`
      SELECT 
        br._id, 
        br.status, 
        br.request_date, 
        br.title AS book_title, 
        br.author, 
        br.genre, 
        u.name AS requester_name
      FROM book_requests br
      JOIN users u ON br.student_id = u._id
      ORDER BY br.request_date DESC
    `);

    res.json({
      stats: {
        totalBooks: parseInt(totalBooksRows[0].count),
        availableBooks: parseInt(availableBooksRows[0].count),
        pendingBorrowRequests: parseInt(pendingBorrowRequestsRows[0].count),
        pendingBookRequests: parseInt(pendingBookRequestsRows[0].count)
      },
      borrowRequests,
      bookRequests
    });
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------------- Books ----------------
router.get('/books', verifyToken, isAdmin, async (req, res) => {
  try {
    const { page = 1, search = '', filter = 'all' } = req.query;
    const limit = 10;
    const offset = (page - 1) * limit;

    let whereClauses = [];
    let params = [];

    if (search) {
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      whereClauses.push('(title ILIKE $1 OR author ILIKE $2 OR isbn ILIKE $3)');
    }

    if (filter === 'available') whereClauses.push('available > 0');
    if (filter === 'borrowed') whereClauses.push('available = 0');

    const whereSQL = whereClauses.length ? 'WHERE ' + whereClauses.join(' AND ') : '';

    const { rows: books } = await db.query(
      `SELECT * FROM books ${whereSQL} ORDER BY created_at DESC OFFSET $${params.length + 1} LIMIT $${params.length + 2}`,
      [...params, offset, limit]
    );

    const { rows: totalRows } = await db.query(`SELECT COUNT(*) FROM books ${whereSQL}`, params);
    const total = parseInt(totalRows[0].count);

    res.json({ books, total });
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/books/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM books WHERE _id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Book not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching book by ID:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/books', verifyToken, isAdmin, async (req, res) => {
  try {
    const { title, author, isbn, quantity } = req.body;
    const { rows } = await db.query(
      `INSERT INTO books (title, author, isbn, quantity, available) VALUES ($1,$2,$3,$4,$4) RETURNING *`,
      [title, author, isbn, quantity]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error adding book:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/books/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { rows: existingRows } = await db.query('SELECT * FROM books WHERE _id=$1', [req.params.id]);
    if (!existingRows.length) return res.status(404).json({ message: 'Book not found' });

    const book = existingRows[0];
    let { title, author, isbn, quantity } = req.body;

    quantity = quantity ?? book.quantity;
    const available = Math.min(book.available + (quantity - book.quantity), quantity);

    const { rows } = await db.query(
      `UPDATE books SET title=$1, author=$2, isbn=$3, quantity=$4, available=$5, updated_at=NOW() WHERE _id=$6 RETURNING *`,
      [title ?? book.title, author ?? book.author, isbn ?? book.isbn, quantity, available, req.params.id]
    );

    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/books/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { rows: bookRows } = await db.query('SELECT * FROM books WHERE _id=$1', [req.params.id]);
    if (!bookRows.length) return res.status(404).json({ message: 'Book not found' });

    const book = bookRows[0];

    // Check active borrows
    if (book.quantity !== book.available) {
      return res.status(400).json({ message: 'Cannot delete book with active borrows' });
    }

    // Check pending borrow requests
    const { rows: pendingRows } = await db.query(
      'SELECT COUNT(*) FROM borrow_requests WHERE book_id=$1 AND status=$2',
      [book._id, 'pending']
    );

    if (parseInt(pendingRows[0].count) > 0) {
      return res.status(400).json({ message: 'Cannot delete book with pending borrow requests' });
    }

    await db.query('DELETE FROM books WHERE _id=$1', [book._id]);
    res.json({ message: 'Book deleted successfully', deletedBook: book });
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------------- Book Requests ----------------
router.get('/requests', verifyToken, isAdmin, async (req, res) => {
  try {
    const { status = 'all', page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let whereSQL = '';
    let params = [];
    if (status !== 'all') {
      whereSQL = 'WHERE br.status=$1';
      params.push(status);
    }

    const { rows: requests } = await db.query(
      `SELECT br.*, u.name AS student_name, u.email AS student_email, b.title AS book_title, b.author AS book_author
       FROM book_requests br
       JOIN users u ON br.student_id=u._id
       JOIN books b ON br.book_id=b._id
       ${whereSQL}
       ORDER BY br.created_at DESC
       OFFSET $${params.length + 1} LIMIT $${params.length + 2}`,
      [...params, offset, parseInt(limit)]
    );

    const { rows: totalRows } = await db.query(
      `SELECT COUNT(*) FROM book_requests br ${whereSQL}`,
      params
    );

    res.json({
      requests,
      total: parseInt(totalRows[0].count),
      totalPages: Math.ceil(parseInt(totalRows[0].count) / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Error fetching book requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
