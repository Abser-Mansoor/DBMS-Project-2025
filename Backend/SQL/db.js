const { Pool } = require('pg');
require('dotenv').config();
nodemonconfig = require('../nodemon.json');

const pool = new Pool({
<<<<<<< HEAD
  connectionString: process.env.DATABASE_URL || nodemonconfig.env.DATABASE_URL,
=======
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:123@localhost:5432/librarydb?schema=public',
>>>>>>> f1adbd92f054e5f5192c0f4a10190758c787d27c
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
});

module.exports = pool;
