const { Pool } = require('pg'); // For PostgreSQL
// const mysql = require('mysql2/promise'); // For MySQL alternative
const bcrypt = require('bcrypt');
require('dotenv').config();

const initializeDb = async () => {
  let pool;
  
  try {
    // Create connection pool
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // PostgreSQL specific options
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
    });

    // Test connection
    const client = await pool.connect();
    console.log('Connected to PostgreSQL database');

    // Initialize schema (tables) if they don't exist
    await initializeSchema(client);
    
    // Check if admin user exists and create if not
    await initializeAdminUser(client);
    
    console.log('Database initialization completed successfully');
    
    client.release();
    
  } catch (error) {
    console.error('Database initialization failed:', error.message);
    
    // Specific error handling for SQL
    if (error.code === 'ECONNREFUSED') {
      console.error('Could not connect to database. Please check:');
      console.error('- Database server is running');
      console.error('- Connection string is correct');
      console.error('- Network connectivity');
    } else if (error.code === '28P01') {
      console.error('Authentication failed. Check username/password');
    }
    
  } finally {
    // Close the pool instead of single connection
    if (pool) {
      await pool.end();
    }
  }
};

const initializeSchema = async (client) => {
  try {
    // Create users table if it doesn't exist
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        employee_id VARCHAR(50) UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await client.query(createTableQuery);
    console.log('Users table verified/created');

    // Create index for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    `);

  } catch (error) {
    console.error('Schema initialization failed:', error.message);
    throw error;
  }
};

const initializeAdminUser = async (client) => {
  try {
    // Check if admin user exists
    const checkAdminQuery = 'SELECT id FROM users WHERE role = $1 LIMIT 1';
    const adminExists = await client.query(checkAdminQuery, ['admin']);

    if (adminExists.rows.length === 0) {
      // Create default admin user
      // In production, you should hash the password!
      const insertAdminQuery = `
        INSERT INTO users (name, email, password, role, employee_id) 
        VALUES ($1, $2, $3, $4, $5)
      `;
      
      await client.query(insertAdminQuery, [
        'Admin',
        'admin@library.com',
        bcrypt.hash('admin123'),
        'admin',
        'ADMIN001'
      ]);
      
      console.log('Default admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }
    
  } catch (error) {
    // Handle unique constraint violations
    if (error.code === '23505') { // PostgreSQL unique violation
      console.log('Admin user already exists (unique constraint)');
    } else {
      console.error('Admin user initialization failed:', error.message);
      throw error;
    }
  }
};

// Alternative MySQL version (commented)
/*
const initializeDbMySQL = async () => {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectTimeout: 5000,
    });

    console.log('Connected to MySQL database');
    await initializeSchemaMySQL(connection);
    await initializeAdminUserMySQL(connection);
    
  } catch (error) {
    console.error('MySQL initialization failed:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};
*/

// Run the initialization
initializeDb();