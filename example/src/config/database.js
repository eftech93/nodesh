/**
 * MongoDB Configuration
 */
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27017/nodeconsole?authSource=admin';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, {
      // Mongoose 6+ doesn't need these options anymore
    });
    console.log('✓ MongoDB connected');
    return mongoose.connection;
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    throw err;
  }
}

async function disconnectDB() {
  await mongoose.disconnect();
  console.log('MongoDB disconnected');
}

module.exports = {
  connectDB,
  disconnectDB,
  mongoose
};
