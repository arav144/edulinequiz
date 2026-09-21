const mongoose = require('mongoose');
require('dotenv').config();
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const ClassModel = require('../models/ClassLevel');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const classes = await ClassModel.find({}).sort({ order: 1 }).lean();
  console.log('=== CLASSES ===');
  for (const c of classes) {
    console.log(`Class: ${c.name} | Assigned Quiz: ${c.assignedQuizId}`);
  }

  const quizzes = await Quiz.find({}).lean();
  console.log('\n=== ALL QUIZZES ===');
  for (const q of quizzes) {
    const count = await Question.countDocuments({ quizId: q._id });
    console.log(`ID: ${q._id} | Name: "${q.name}" | Class: "${q.targetClass}" | Lang: ${q.language} | Qs: ${count}/${q.numberOfQuestions}`);
  }

  process.exit(0);
}

run();
