import mongoose from 'mongoose';
import { env } from './env.js';

let isConnected = false;

export async function connectDB(): Promise<void> {
  if (isConnected) {
    return;
  }

  try {
    const opts: mongoose.ConnectOptions = {
      maxPoolSize: 10, // Safe for MongoDB Atlas M0 free tier
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    mongoose.connection.on('connected', () => {
      console.log('✅ MongoDB connected successfully');
      isConnected = true;
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
      isConnected = false;
    });

    await mongoose.connect(env.MONGODB_URI, opts);
  } catch (err: any) {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    if (env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.warn('⚠️ Running in development mode without active MongoDB. Some database features may be limited until MongoDB is connected.');
    }
  }
}

export async function disconnectDB(): Promise<void> {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  console.log('MongoDB disconnected gracefully');
}
