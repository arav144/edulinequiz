const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Quiz = require('../models/Quiz');
  const res = await Quiz.updateMany({}, { $set: { timePerQuestion: 40 } });
  console.log('Updated quizzes:', res);
  const all = await Quiz.find({}, 'name timePerQuestion numberOfQuestions');
  console.log('Current Quizzes in DB:', all);
  await mongoose.disconnect();
}

run().catch(console.error);
