const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const BookRequest = require('../models/BookRequest');
const Book = require('../models/Book');
const User = require('../models/User');
const { verifyToken, isAdmin } = require('../middleware/auth');
const BorrowRequest = require('../models/BorrowRequest');
const NewBookRequest = require('../models/NewBookRequest');

// Dashboard Statistics
router.get('/dashboard/stats', verifyToken, isAdmin, async (req, res) => {
  try {
    const totalBooks = await Book.countDocuments();
    const totalUsers = await User.countDocuments({ role: 'student' });
    const totalRequests = await BookRequest.countDocuments();
    const pendingRequests = await BookRequest.countDocuments({ status: 'pending' });
    const borrowedBooks = await Book.countDocuments({ status: 'borrowed' });
    const availableBooks = await Book.countDocuments({ status: 'available' });

    // Get recent activities
    const recentRequests = await BookRequest.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('student', 'name')
      .populate('book', 'title');

    const recentBooks = await Book.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title author status');

    res.json({
      stats: {
        totalBooks,
        totalUsers,
        totalRequests,
        pendingRequests,
        borrowedBooks,
        availableBooks
      },
      recentActivity: {
        requests: recentRequests,
        books: recentBooks
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Book Management Routes
router.get('/books', verifyToken, isAdmin, async (req, res) => {
  try {
    const { page = 1, search = '', filter = 'all' } = req.query;
    const limit = 10;
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query = {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { author: { $regex: search, $options: 'i' } },
          { isbn: { $regex: search, $options: 'i' } }
        ]
      };
    }
    if (filter === 'available') {
      query.available = { $gt: 0 };
    } else if (filter === 'borrowed') {
      query.available = 0;
    }

    const [books, total] = await Promise.all([
      Book.find(query).skip(skip).limit(limit),
      Book.countDocuments(query)
    ]);

    res.json({ books, total });
  } catch (error) {
    console.error('Error in getAllBooks:', error);
    res.status(500).json({ message: 'Error fetching books' });
  }
});

router.get('/books/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.json(book);
  } catch (error) {
    console.error('Error in getBookById:', error);
    res.status(500).json({ message: 'Error fetching book details' });
  }
});

router.post('/books', verifyToken, isAdmin, async (req, res) => {
  try {
    const bookData = { ...req.body, available: req.body.quantity };
    const newBook = new Book(bookData);
    await newBook.save();
    res.status(201).json(newBook);
  } catch (error) {
    console.error('Error in addBook:', error);
    res.status(500).json({ message: 'Error adding book' });
  }
});

router.put('/books/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    if (req.body.quantity !== undefined) {
      const quantityDiff = req.body.quantity - book.quantity;
      req.body.available = Math.min(book.available + quantityDiff, req.body.quantity);
    }

    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.json(updatedBook);
  } catch (error) {
    console.error('Error in updateBook:', error);
    res.status(500).json({ message: 'Error updating book' });
  }
});

router.delete('/books/:id', verifyToken, isAdmin, async (req, res) => {
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

// Book Request Routes
router.get('/requests', verifyToken, isAdmin, async (req, res) => {
  try {
    const { status = 'all', page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (status !== 'all') {
      query.status = status;
    }

    const [requests, total] = await Promise.all([
      BookRequest.find(query)
        .populate('student', 'name email')
        .populate('book', 'title author isbn')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      BookRequest.countDocuments(query)
    ]);

    res.json({
      requests,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Borrow Request Management
router.get('/borrow-requests', verifyToken, isAdmin, async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const requests = await BorrowRequest.find({ status })
      .populate('student', 'name email')
      .populate('book', 'title author')
      .sort({ createdAt: -1 });

    const formattedRequests = requests.map(request => ({
      _id: request._id,
      book: request.book._id,
      bookTitle: request.book.title,
      student: request.student._id,
      studentName: request.student.name,
      studentEmail: request.student.email,
      status: request.status,
      requestDate: request.requestDate,
      approvalDate: request.approvalDate,
      returnDate: request.returnDate,
      dueDate: request.dueDate,
      actualReturnDate: request.actualReturnDate,
      fine: request.fine
    }));

    res.json(formattedRequests);
  } catch (error) {
    console.error('Error in getBorrowRequests:', error);
    res.status(500).json({ message: 'Error fetching borrow requests' });
  }
});

router.put('/borrow-requests/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const request = await BorrowRequest.findById(req.params.id)
      .populate('student', 'name email')
      .populate('book', 'title author');
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (status === 'approved') {
      const book = await Book.findById(request.book._id);
      if (!book) {
        return res.status(404).json({ message: 'Book not found' });
      }
      if (book.available <= 0) {
        return res.status(400).json({ message: 'Book is not available for borrowing' });
      }
      book.available -= 1;
      await book.save();
    }

    request.status = status;
    request.processedDate = new Date();
    await request.save();

    // Format the response to match the GET endpoint
    const formattedResponse = {
      _id: request._id,
      book: request.book._id,
      bookTitle: request.book.title,
      student: request.student._id,
      studentName: request.student.name,
      status: request.status,
      borrowDate: request.borrowDate,
      returnDate: request.returnDate,
      actualReturnDate: request.actualReturnDate,
      fine: request.fine
    };

    res.json(formattedResponse);
  } catch (error) {
    console.error('Error in updateBorrowRequest:', error);
    res.status(500).json({ message: 'Error updating borrow request' });
  }
});

// New Book Request Management
router.get('/new-book-requests', verifyToken, isAdmin, async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const requests = await NewBookRequest.find({ status });
    res.json(requests);
  } catch (error) {
    console.error('Error in getNewBookRequests:', error);
    res.status(500).json({ message: 'Error fetching new book requests' });
  }
});

router.put('/new-book-requests/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const request = await NewBookRequest.findByIdAndUpdate(
      req.params.id,
      { status, processedDate: new Date() },
      { new: true }
    );
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    res.json(request);
  } catch (error) {
    console.error('Error in updateNewBookRequest:', error);
    res.status(500).json({ message: 'Error updating new book request' });
  }
});

// User Management
router.get('/users', verifyToken, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (page - 1) * limit;

    let query = { role: 'student' };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(query)
    ]);

    res.json({
      users,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// User Status Management
router.put('/users/:id/status', verifyToken, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Return Book Management
router.post('/return-book/:requestId', verifyToken, isAdmin, async (req, res) => {
  try {
    const request = await BookRequest.findById(req.params.requestId)
      .populate('book');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'approved') {
      return res.status(400).json({ message: 'Book is not borrowed' });
    }

    // Update book availability
    const book = await Book.findById(request.book._id);
    book.available += 1;
    await book.save();

    // Update request status
    request.status = 'returned';
    request.returnDate = new Date();
    await request.save();

    res.json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add return book endpoint
router.post('/borrow-requests/:id/return', verifyToken, isAdmin, async (req, res) => {
  try {
    const request = await BorrowRequest.findById(req.params.id)
      .populate('book')
      .populate('student', 'name');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'approved') {
      return res.status(400).json({ message: 'Book is not currently borrowed' });
    }

    // Calculate fine if returned late
    const returnDate = new Date(request.returnDate);
    const actualReturnDate = new Date();
    let fine = 0;

    if (actualReturnDate > returnDate) {
      const daysLate = Math.ceil((actualReturnDate - returnDate) / (1000 * 60 * 60 * 24));
      fine = daysLate * 1; // $1 per day late
    }

    // Update book availability
    const book = await Book.findById(request.book._id);
    book.available += 1;
    await book.save();

    // Update request
    request.status = 'returned';
    request.actualReturnDate = actualReturnDate;
    request.fine = fine;
    await request.save();

    // Format response
    const formattedResponse = {
      _id: request._id,
      book: request.book._id,
      bookTitle: request.book.title,
      student: request.student._id,
      studentName: request.student.name,
      status: request.status,
      borrowDate: request.borrowDate,
      returnDate: request.returnDate,
      actualReturnDate: request.actualReturnDate,
      fine: request.fine
    };

    res.json(formattedResponse);
  } catch (error) {
    console.error('Error in returnBook:', error);
    res.status(500).json({ message: 'Error returning book' });
  }
});

module.exports = router; 