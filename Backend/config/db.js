import mongoose from 'mongoose';
import { logError, logInfo, logWarn, serializeError } from '../utils/logger.js';

const DEFAULT_SERVER_SELECTION_TIMEOUT_MS = 5000;

const getServerSelectionTimeout = () => {
  const rawValue = process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS;
  const parsedValue = Number.parseInt(rawValue, 10);

  return Number.isInteger(parsedValue) && parsedValue > 0
    ? parsedValue
    : DEFAULT_SERVER_SELECTION_TIMEOUT_MS;
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: getServerSelectionTimeout(),
    });
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
