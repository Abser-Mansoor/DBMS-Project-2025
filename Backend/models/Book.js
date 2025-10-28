const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: String,
    required: true,
    trim: true
  },
  isbn: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['fiction', 'non-fiction', 'science', 'technology', 'history', 'philosophy', 'biography', 'other']
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  available: {
    type: Number,
    required: true,
    min: 0,
    default: function() {
      return this.quantity;
    }
  },
  description: {
    type: String,
    trim: true
  },
  publishedYear: {
    type: String
  },
  publisher: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['available', 'borrowed'],
    default: 'available'
  }
}, {
  timestamps: true
});

// Add indexes for better search performance
bookSchema.index({ title: 'text', author: 'text', isbn: 'text' });

// Pre-save middleware to ensure available doesn't exceed quantity
bookSchema.pre('save', function(next) {
  if (this.available > this.quantity) {
    this.available = this.quantity;
  }
  if (this.available === 0) {
    this.status = 'borrowed';
  } else {
    this.status = 'available';
  }
  next();
});

module.exports = mongoose.model('Book', bookSchema); 