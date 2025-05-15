const mongoose = require('mongoose');
require('dotenv').config(); // To access environment variables

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      // useNewUrlParser: true, // Deprecated
      // useUnifiedTopology: true, // Deprecated
      // Mongoose 6 doesn't require useCreateIndex and useFindAndModify anymore
    });
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('MongoDB Connection Error:', err); // Log the full error object
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;
