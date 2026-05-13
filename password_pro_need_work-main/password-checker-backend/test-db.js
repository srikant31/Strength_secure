import mongoose from 'mongoose';

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error('❌ MONGO_URI is not defined in environment variables');
  process.exit(1);
}

async function testConnect() {
  try {
    console.log('Testing URI:', uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
    await mongoose.connect(uri);
    console.log('✅ CONNECTION SUCCESS!');
    console.log('Host:', mongoose.connection.host);
    mongoose.connection.close();
  } catch (err) {
    console.error('❌ FAILED:', err.message);
  }
}

testConnect();
