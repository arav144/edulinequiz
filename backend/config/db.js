const mongoose = require('mongoose');

// Cache the connection promise itself (not just a boolean) so that
// multiple concurrent requests in a serverless invocation all await
// the SAME in-flight connection attempt instead of racing each other.
let connectionPromise = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.trim() === '') {
    throw new Error('FATAL: MONGODB_URI is not configured in environment variables.');
  }

  if (mongoose.connection.readyState === 1) {
    return true;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(uri, {
        bufferCommands: false,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 8000,
      })
      .then((conn) => {
        console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
        return true;
      })
      .catch((error) => {
        console.error(`❌ MongoDB Atlas connection failed: ${error.message}`);
        // Reset so the NEXT request can retry instead of being stuck
        // forever on a rejected cached promise.
        connectionPromise = null;
        throw error;
      });
  }

  return connectionPromise;
};

module.exports = connectDB;
