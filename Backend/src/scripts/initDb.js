const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const initializeDb = async () => {
  try {
    // Connect to MongoDB Atlas
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('Connected to MongoDB Atlas');

    // Check if admin user exists
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (!adminExists) {
      // Create default admin user
      const adminUser = new User({
        name: 'Admin',
        email: 'admin@library.com',
        password: 'admin123',
        role: 'admin',
        employeeId: 'ADMIN001'
      });

      await adminUser.save();
      console.log('Default admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }

    console.log('Database initialization completed');
  } catch (error) {
    console.error('Database initialization failed:', error.message);
    if (error.name === 'MongoServerSelectionError') {
      console.error('Could not connect to MongoDB Atlas. Please check your connection string and network connection.');
    }
  } finally {
    await mongoose.connection.close();
  }
};

// Run the initialization
initializeDb(); 