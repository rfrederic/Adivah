import mongoose from 'mongoose';
import { env } from './env.js';

// Enveloppe tout opérateur « $ » venu d'une entrée utilisateur (protection contre l'injection NoSQL).
mongoose.set('sanitizeFilter', true);
mongoose.set('strictQuery', true);

export async function connectDb(uri = env.MONGODB_URI) {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  return mongoose.connection;
}

export const disconnectDb = () => mongoose.disconnect();
