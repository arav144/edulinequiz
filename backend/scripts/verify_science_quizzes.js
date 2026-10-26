const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Quiz = require('../models/Quiz');
const Question = require('../models/Question');

async function verify() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    const scienceQuizzes = await Quiz.find({ scheduleBatchId: 'batch_1792224812790_714' }).sort({ targetClass: 1 });
    console.log('Found ' + scienceQuizzes.length + ' science quizzes in batch:');

    for (const q of scienceQuizzes) {
      const questions = await Question.find({ quizId: q._id });
      console.log('--------------------------------------------------');
      console.log('[' + q.targetClass + '] ' + q.name + ' (ID: ' + q._id + ')');
      console.log('Representative: ' + q.isRepresentative + ' | Featured: ' + q.isFeaturedOnPortal + ' | Total Questions: ' + questions.length);
      console.log('Q1: ' + questions[0].question);
      console.log('   Options: A: ' + questions[0].options.A + ' | B: ' + questions[0].options.B + ' | C: ' + questions[0].options.C + ' | D: ' + questions[0].options.D);
      console.log('   Correct Answer: ' + questions[0].correctAnswer);
      console.log('Q15: ' + questions[questions.length - 1].question);
      console.log('   Correct Answer: ' + questions[questions.length - 1].correctAnswer);
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

verify();
