import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is not defined in environment variables');

  mongoose.set('strictQuery', true);

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
  });

  console.log(`✅  MongoDB connected: ${mongoose.connection.host}`);
  console.log("Connected DB:", mongoose.connection.name);

  mongoose.connection.on('error', err =>
    console.error('MongoDB connection error:', err)
  );
}
