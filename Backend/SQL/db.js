const { Pool } = require('pg');
require('dotenv').config();
nodemonconfig = require('../nodemon.json');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || nodemonconfig.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
});

module.exports = pool;
