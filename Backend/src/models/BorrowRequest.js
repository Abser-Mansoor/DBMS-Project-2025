const mongoose = require('mongoose');

const borrowRequestSchema = new mongoose.Schema({
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
        default: () => new Date().toLocaleDateString('en-US')
    },
    borrowDate: {
        type: String,
        default: () => new Date().toLocaleDateString('en-US')
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
}, {
    timestamps: true
});

module.exports = mongoose.model('BorrowRequest', borrowRequestSchema); 