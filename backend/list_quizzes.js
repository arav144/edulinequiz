const mongoose = require('mongoose');
require('dotenv').config();

const Quiz = require('./models/Quiz');

async function listQuizzes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    const quizzes = await Quiz.find({}, 'name classes');
    console.log(JSON.stringify(quizzes, null, 2));

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

listQuizzes();
