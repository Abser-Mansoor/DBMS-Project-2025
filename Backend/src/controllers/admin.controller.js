const Book = require('../models/Book');
const BorrowRequest = require('../models/BorrowRequest');
const NewBookRequest = require('../models/NewBookRequest');

// Book Management Controllers
exports.getAllBooks = async (req, res) => {
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
};

exports.getBookById = async (req, res) => {
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
};

exports.addBook = async (req, res) => {
    try {
        const bookData = { ...req.body, available: req.body.quantity };
        const newBook = new Book(bookData);
        await newBook.save();
        res.status(201).json(newBook);
    } catch (error) {
        console.error('Error in addBook:', error);
        res.status(500).json({ message: 'Error adding book' });
    }
};

exports.updateBook = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }

        // If quantity is being updated, adjust available copies
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
};

exports.deleteBook = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }

        // Check if book has any active borrows
        if (book.quantity !== book.available) {
            return res.status(400).json({ message: 'Cannot delete book with active borrows' });
        }

        await book.remove();
        res.json({ message: 'Book deleted successfully' });
    } catch (error) {
        console.error('Error in deleteBook:', error);
        res.status(500).json({ message: 'Error deleting book' });
    }
};

// Borrow Request Controllers
exports.getBorrowRequests = async (req, res) => {
    try {
        const { status = 'pending' } = req.query;
        const requests = await BorrowRequest.find({ status })
            .populate('student', 'name')
            .populate('book', 'title');

        const formattedRequests = requests.map(request => ({
            _id: request._id,
            book: request.book._id,
            bookTitle: request.book.title,
            student: request.student._id,
            userName: request.student.name,
            requestDate: request.requestDate,
            status: request.status,
            approvalDate: request.approvalDate,
            returnDate: request.returnDate,
            dueDate: request.dueDate,
            adminNotes: request.adminNotes
        }));

        res.json(formattedRequests);
    } catch (error) {
        console.error('Error in getBorrowRequests:', error);
        res.status(500).json({ message: 'Error fetching borrow requests' });
    }
};

exports.updateBorrowRequest = async (req, res) => {
    try {
        const { status } = req.body;
        const request = await BorrowRequest.findById(req.params.id);
        
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // Update book status if request is approved
        if (status === 'approved') {
            const book = await Book.findById(request.book);
            if (!book) {
                return res.status(404).json({ message: 'Book not found' });
            }
            if (book.available <= 0) {
                return res.status(400).json({ message: 'Book is not available for borrowing' });
            }
            book.available -= 1;
            await book.save();
            request.approvalDate = new Date();
            request.dueDate = new Date();
            request.dueDate.setDate(request.dueDate.getDate() + 14); // 2 weeks from now
        }

        request.status = status;
        await request.save();

        res.json(request);
    } catch (error) {
        console.error('Error in updateBorrowRequest:', error);
        res.status(500).json({ message: 'Error updating borrow request' });
    }
};

// New Book Request Controllers
exports.getNewBookRequests = async (req, res) => {
    try {
        const { status = 'pending' } = req.query;
        const requests = await NewBookRequest.find({ status });
        res.json(requests);
    } catch (error) {
        console.error('Error in getNewBookRequests:', error);
        res.status(500).json({ message: 'Error fetching new book requests' });
    }
};

exports.updateNewBookRequest = async (req, res) => {
    try {
        const { status } = req.body;
        const request = await NewBookRequest.findByIdAndUpdate(
            req.params.id,
            { 
                status, 
                processedDate: new Date() 
            },
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
}; 