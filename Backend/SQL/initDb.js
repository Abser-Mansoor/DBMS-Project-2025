const db = require('./db')
const bcrypt = require('bcrypt');
nodemonconfig = require('../nodemon.json');

const initializeDb = async () => {
  try {
    
    // Test connection
    const client = await db.connect();
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
  }
};

const initializeSchema = async (client) => {
  try {
    // Create users table if it doesn't exist
    const createUserQuery = `--sql
      CREATE TABLE IF NOT EXISTS users (
        _id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        roll_number VARCHAR(50) UNIQUE,
        employee_id VARCHAR(50) UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await client.query(createUserQuery);
    console.log('Users table verified/created');

    await client.query(`--sql
      CREATE TABLE IF NOT EXISTS books (
        _id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        author VARCHAR(255) NOT NULL,
        isbn VARCHAR(50) UNIQUE NOT NULL,
        category VARCHAR(50) NOT NULL CHECK (category IN (
            'fiction', 'non-fiction', 'science', 'technology',
            'history', 'philosophy', 'biography', 'other'
        )),
        quantity INT NOT NULL CHECK (quantity >= 1),
        available INT NOT NULL,
        description TEXT,
        published_year VARCHAR(10),
        publisher VARCHAR(100),
        location VARCHAR(100) NOT NULL,
        status VARCHAR(20) CHECK (status IN ('available', 'not available')) DEFAULT 'available',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`--sql
      CREATE OR REPLACE FUNCTION set_available_to_quantity()
      RETURNS TRIGGER AS $$
      BEGIN
          IF NEW.available IS NULL THEN
              NEW.available := NEW.quantity;
          END IF;
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await client.query(`--sql
      CREATE TRIGGER books_available_trigger
      BEFORE INSERT ON books
      FOR EACH ROW
      EXECUTE FUNCTION set_available_to_quantity();
    `);

    console.log('Books table verified/created');
    
    await client.query(`--sql
      CREATE TABLE IF NOT EXISTS borrow_requests (
        _id SERIAL PRIMARY KEY,
        book_id INT NOT NULL references books(_id),
        student_id INT NOT NULL references users(_id),
        staff_id INT references users(_id),
        status VARCHAR(20) NOT NULL CHECK(status IN ('pending', 'approved', 'rejected', 'returned')) DEFAULT 'pending',
        request_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        approval_date TIMESTAMP WITH TIME ZONE,
        due_date TIMESTAMP WITH TIME ZONE,
        return_date TIMESTAMP WITH TIME ZONE
      );
      `)
    
    console.log('Borrow_Requests table verified/created');

    await client.query(`--sql
      CREATE TABLE IF NOT EXISTS book_requests (
        _id SERIAL PRIMARY KEY,
        student_id INT NOT NULL references users(_id),
        staff_id INT references users(_id),
        title VARCHAR(255) NOT NULL,
        author VARCHAR(255) NOT NULL,
        reason TEXT,
        status VARCHAR(20) NOT NULL CHECK(status IN ('pending', 'approved', 'rejected', 'added')) DEFAULT 'pending',
        request_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        approval_date TIMESTAMP WITH TIME ZONE
      );
      `)

      console.log('Book_Requests table verified/created');
    // Create index for better performance
    await client.query(`--sql
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
    const checkAdminQuery = 'SELECT _id FROM users WHERE role = $1 LIMIT 1';
    const adminExists = await client.query(checkAdminQuery, ['admin']);

    if (adminExists.rows.length === 0) {
      // Create default admin user
      // In production, you should hash the password!
      const insertAdminQuery = `--sql
        INSERT INTO users (name, email, password, role, employee_id) 
        VALUES ($1, $2, $3, $4, $5)
      `;
      
      await client.query(insertAdminQuery, [
        'Admin',
        'admin@library.com',
        await bcrypt.hash('admin123', 10),
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

initializeDb();