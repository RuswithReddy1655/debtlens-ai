import mongoose from 'mongoose';
import { config } from './env';

export interface DatabaseStatus {
  isConnected: boolean;
  readyState: number; // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  host?: string;
  name?: string;
  error?: string | null;
}

let dbStatus: DatabaseStatus = {
  isConnected: false,
  readyState: 0,
  error: null,
};

export const connectDatabase = async (): Promise<boolean> => {
  if (config.mongoDebug) {
    mongoose.set('debug', true);
  }

  mongoose.connection.on('connected', () => {
    dbStatus = {
      isConnected: true,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      name: mongoose.connection.name,
      error: null,
    };
    console.log(`[Database] Connected to MongoDB: ${mongoose.connection.host}/${mongoose.connection.name}`);
  });

  mongoose.connection.on('error', (err) => {
    dbStatus.isConnected = false;
    dbStatus.readyState = mongoose.connection.readyState;
    dbStatus.error = err.message;
    console.error(`[Database] MongoDB connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    dbStatus.isConnected = false;
    dbStatus.readyState = mongoose.connection.readyState;
    console.warn('[Database] MongoDB disconnected');
  });

  try {
    console.log(`[Database] Attempting connection to ${config.mongoUri.replace(/:([^:@]{1,})@/, ':****@')}...`);
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      maxPoolSize: 10,
      minPoolSize: 2,
      retryWrites: true,
    });
    dbStatus.isConnected = true;
    dbStatus.readyState = 1;
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown connection error';
    dbStatus = {
      isConnected: false,
      readyState: 0,
      error: message,
    };
    console.warn(`[Database] Initial MongoDB connection could not be established: ${message}`);
    console.warn(`[Database] Server will continue operating with Demo Mode / Mock persistence.`);
    return false;
  }
};

export const getDatabaseStatus = (): DatabaseStatus => {
  return {
    ...dbStatus,
    readyState: mongoose.connection.readyState,
    isConnected: mongoose.connection.readyState === 1,
  };
};

export const disconnectDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('[Database] Disconnected from MongoDB');
  }
};
