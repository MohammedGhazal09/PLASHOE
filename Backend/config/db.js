import mongoose from 'mongoose';
import { logError, logInfo, logWarn, serializeError } from '../utils/logger.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    logInfo('mongodb-connected', {
      readyState: conn.connection.readyState,
    });

    return { connected: true };
  } catch (error) {
    logError('mongodb-connection-failed', {
      readyState: mongoose.connection.readyState,
      error: serializeError(error),
    });
    logWarn('mongodb-unavailable', {
      reason: 'continuing_without_database',
    });
    // Don't exit - allow app to run with limited functionality
    return { connected: false, error: serializeError(error) };
  }
};

export default connectDB;
