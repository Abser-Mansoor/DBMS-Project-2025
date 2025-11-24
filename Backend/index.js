const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const morgan = require('morgan');
nodemonconfig = require('./nodemon.json');

// Load environment variables
dotenv.config();

// Import routes (PostgreSQL route files)
const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');
// const requestRoutes = require('./routes/requests');
const adminRoutes = require('./routes/admin');
const studentRoutes = require('./routes/student');
const generalRoutes = require('./routes/general');
const nodemon = require('nodemon');

const app = express();

app.use(morgan('dev'));

// CORS must come first - use simple origin without trailing slash
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing must come before routes
app.use(express.json());

// Security middleware (configured to not interfere with CORS)
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100
});
app.use('/api/', limiter);

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || nodemonconfig.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

// Test connection
const testDbConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('Connected to PostgreSQL successfully');
    client.release();
  } catch (err) {
    console.error('PostgreSQL connection failed:', err.message);
    process.exit(1);
  }
};

testDbConnection();

// Make pool accessible to routes via app.locals
app.locals.db = pool;

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api', generalRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});