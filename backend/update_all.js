const mongoose = require('mongoose');
require('dotenv').config();

const Quiz = require('./models/Quiz');

async function updateAllQuizzes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    // 1. Hindi Diwas Quizzes
    const hindiQuizzes = await Quiz.find({ name: /हिंदी दिवस/ });
    if (hindiQuizzes.length > 0) {
      // Pick the first one as the master
      const masterQuiz = hindiQuizzes[0];
      masterQuiz.name = 'हिंदी दिवस प्रतियोगिता';
      masterQuiz.classes = ['Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8'];
      masterQuiz.targetClass = 'Classes 3-8';
      masterQuiz.status = 'Published';
      await masterQuiz.save();
      console.log('Updated Master Hindi Diwas Quiz.');

      // Delete the rest
      for (let i = 1; i < hindiQuizzes.length; i++) {
        await Quiz.deleteOne({ _id: hindiQuizzes[i]._id });
        console.log(`Deleted extra Hindi Quiz: ${hindiQuizzes[i].name}`);
      }
    } else {
      console.log('No Hindi Diwas quizzes found.');
    }

    // 2. Gandhi Jayanti Quiz
    const gandhiQuiz = await Quiz.findOne({ name: /Gandhi/i });
    if (gandhiQuiz) {
      const startDateIST = new Date('2026-10-02T06:30:00.000Z');
      const endDateIST = new Date('2026-10-02T07:30:00.000Z');

      gandhiQuiz.name = 'Gandhi Jayanti Special Quiz';
      gandhiQuiz.classes = ['Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8'];
      gandhiQuiz.targetClass = 'Classes 3-8';
      gandhiQuiz.startDate = startDateIST;
      gandhiQuiz.endDate = endDateIST;
      gandhiQuiz.status = 'Published';
      await gandhiQuiz.save();
      console.log('Updated Gandhi Jayanti Quiz to be Oct 2 12 PM - 1 PM IST for Classes 3-8.');
    } else {
      console.log('No Gandhi Jayanti quiz found.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

updateAllQuizzes();
