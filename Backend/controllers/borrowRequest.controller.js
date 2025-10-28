const BorrowRequest = require('../models/borrowRequest.model');
const Book = require('../models/book.model');
const User = require('../models/user.model');

// Create a new borrow request
exports.createBorrowRequest = async (req, res) => {
  try {
    const { bookId, returnDate } = req.body;
    const studentId = req.user.id;

    // Check if book exists and is available
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    if (book.available <= 0) {
      return res.status(400).json({ message: 'Book is not available for borrowing' });
    }

    // Check if student has any pending requests for the same book
    const existingRequest = await BorrowRequest.findOne({
      student: studentId,
      book: bookId,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'You already have a pending request for this book' });
    }

    // Create new borrow request
    const borrowRequest = new BorrowRequest({
      student: studentId,
      book: bookId,
      returnDate
    });

    await borrowRequest.save();

    res.status(201).json({
      message: 'Borrow request created successfully',
      borrowRequest
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating borrow request', error: error.message });
  }
};

// Get all borrow requests (for admin)
exports.getAllBorrowRequests = async (req, res) => {
  try {
    const borrowRequests = await BorrowRequest.find()
      .populate('student', 'name email')
      .populate('book', 'title author');
    res.status(200).json(borrowRequests);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching borrow requests', error: error.message });
  }
};

// Get student's borrow requests
exports.getStudentBorrowRequests = async (req, res) => {
  try {
    const studentId = req.user.id;
    const borrowRequests = await BorrowRequest.find({ student: studentId })
      .populate('book', 'title author');
    res.status(200).json(borrowRequests);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching borrow requests', error: error.message });
  }
};

// Update borrow request status (for admin)
exports.updateBorrowRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;

    const borrowRequest = await BorrowRequest.findById(requestId);
    if (!borrowRequest) {
      return res.status(404).json({ message: 'Borrow request not found' });
    }

    if (status === 'approved') {
      // Update book availability
      const book = await Book.findById(borrowRequest.book);
      if (book.available <= 0) {
        return res.status(400).json({ message: 'Book is no longer available' });
      }
      book.available -= 1;
      await book.save();
    }

    borrowRequest.status = status;
    await borrowRequest.save();

    res.status(200).json({
      message: 'Borrow request status updated successfully',
      borrowRequest
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating borrow request', error: error.message });
  }
};

// Return a book
exports.returnBook = async (req, res) => {
  try {
    const { requestId } = req.params;
    const borrowRequest = await BorrowRequest.findById(requestId);

    if (!borrowRequest) {
      return res.status(404).json({ message: 'Borrow request not found' });
    }

    if (borrowRequest.status !== 'approved') {
      return res.status(400).json({ message: 'This request is not approved for return' });
    }

    // Calculate fine if returned late
    const returnDate = new Date(borrowRequest.returnDate);
    const actualReturnDate = new Date();
    let fine = 0;

    if (actualReturnDate > returnDate) {
      const daysLate = Math.ceil((actualReturnDate - returnDate) / (1000 * 60 * 60 * 24));
      fine = daysLate * 1; // $1 per day late
    }

    // Update book availability
    const book = await Book.findById(borrowRequest.book);
    book.available += 1;
    await book.save();

    // Update borrow request
    borrowRequest.status = 'returned';
    borrowRequest.actualReturnDate = actualReturnDate;
    borrowRequest.fine = fine;
    await borrowRequest.save();

    res.status(200).json({
      message: 'Book returned successfully',
      borrowRequest
    });
  } catch (error) {
    res.status(500).json({ message: 'Error returning book', error: error.message });
  }
}; 