const mongoose = require('mongoose');

const bookRequestSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'returned'],
    default: 'pending'
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  approvalDate: {
    type: Date
  },
  returnDate: {
    type: Date
  },
  dueDate: {
    type: Date
  },
  adminNotes: {
    type: String,
    trim: true
  }
});

module.exports = mongoose.model('BookRequest', bookRequestSchema); 