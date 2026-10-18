const mongoose = require('mongoose');

// Determine if running inside a Serverless environment (e.g. Vercel)
const isServerless = !!process.env.VERCEL;

// Use global variable to cache connection across serverless invocations and hot-reloads
let cached = global._mongooseConnection;
if (!cached) {
  cached = global._mongooseConnection = { conn: null, promise: null };
}

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.trim() === '') {
    throw new Error('FATAL: MONGODB_URI is not configured in environment variables.');
  }

  // If connection is already open and ready, return existing connection
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // If a connection attempt is already in flight, await it
  if (cached.promise) {
    return cached.promise;
  }

  // Connection options optimized for Atlas Free (M0) and Serverless environments:
  // - On Serverless (Vercel): maxPoolSize strictly 2-4 (default 3), NEVER 10.
  //   Atlas M0 allows 500 connections; keeping maxPoolSize <= 4 guarantees that even
  //   125-250 concurrent lambda containers will never exhaust the Atlas connection pool.
  // - On Long-running / Local: maxPoolSize 12, minPoolSize 2
  const serverlessMaxPool = Math.min(
    Math.max(parseInt(process.env.MONGO_SERVERLESS_MAX_POOL_SIZE || '3', 10), 2),
    4
  );

  const poolOptions = isServerless
    ? {
        maxPoolSize: serverlessMaxPool, // Strictly 2-4 connections
        minPoolSize: 0,
        maxIdleTimeMS: 10000, // Quickly close idle connections in lambdas
      }
    : {
        maxPoolSize: 12,
        minPoolSize: 2,
        maxIdleTimeMS: 30000,
      };

  const opts = {
    bufferCommands: false,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000, // Atlas recommended socket timeout
    connectTimeoutMS: 8000,
    heartbeatFrequencyMS: 10000,
    ...poolOptions,
  };

  cached.promise = mongoose
    .connect(uri, opts)
    .then((m) => {
      cached.conn = m.connection;
      console.log(`✅ MongoDB Atlas Connected [${isServerless ? 'Serverless' : 'Server'}]: ${m.connection.host}`);
      return cached.conn;
    })
    .catch((error) => {
      console.error(`❌ MongoDB Atlas connection error: ${error.message}`);
      cached.promise = null; // Reset promise so next request can retry
      throw error;
    });

  return cached.promise;
};

module.exports = connectDB;