const mongoose = require('mongoose');
require('dotenv').config();

const Quiz = require('./models/Quiz');
const Question = require('./models/Question');

async function updateQuizzes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    // 1. Update Hindi Diwas Quiz
    const hindiQuizzes = await Quiz.find({ name: /Hindi Diwas/i });
    if (hindiQuizzes.length > 0) {
      const mainQuiz = hindiQuizzes[0];
      mainQuiz.classes = ['Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8'];
      mainQuiz.targetClass = 'Classes 3-8';
      mainQuiz.name = 'Hindi Diwas Quiz';
      mainQuiz.status = 'Published';
      await mainQuiz.save();
      console.log('Updated main Hindi Diwas Quiz.');
      
      for (let i = 1; i < hindiQuizzes.length; i++) {
        await Quiz.deleteOne({ _id: hindiQuizzes[i]._id });
        console.log(`Deleted extra Hindi Diwas Quiz: ${hindiQuizzes[i].name}`);
      }
    } else {
       console.log('No Hindi Diwas Quiz found.');
    }

    // 2. Add Gandhi Jayanti Quiz
    // Start Date: Oct 2, 2026, 12:00 PM IST (which is 06:30 AM UTC)
    // End Date: Oct 2, 2026, 1:00 PM IST (which is 07:30 AM UTC)
    const startDateIST = new Date('2026-10-02T06:30:00.000Z');
    const endDateIST = new Date('2026-10-02T07:30:00.000Z');

    let gandhiQuiz = await Quiz.findOne({ name: /Gandhi Jayanti/i });
    if (!gandhiQuiz) {
      gandhiQuiz = new Quiz({
        name: 'Gandhi Jayanti Special Quiz',
        status: 'Published',
        classes: ['Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8'],
        targetClass: 'Classes 3-8',
        startDate: startDateIST,
        endDate: endDateIST,
        numberOfQuestions: 5,
        timePerQuestion: 40,
        bannerUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/7a/Mahatma-Gandhi%2C_studio%2C_1931.jpg',
        description: 'A special quiz honoring the Father of the Nation, Mahatma Gandhi.',
        instructions: '15 Multiple Choice Questions. 40 Seconds / per question. Language of the quiz – English.',
      });
      await gandhiQuiz.save();

      // Add questions
      const q1 = new Question({
        quizId: gandhiQuiz._id,
        question: "When is Mahatma Gandhi's birthday celebrated?",
        options: { A: "August 15", B: "October 2", C: "January 26", D: "November 14" },
        correctAnswer: 'B'
      });
      const q2 = new Question({
        quizId: gandhiQuiz._id,
        question: "What is Mahatma Gandhi's full name?",
        options: { A: "Mohandas Karamchand Gandhi", B: "Rajiv Gandhi", C: "Indira Gandhi", D: "Sonia Gandhi" },
        correctAnswer: 'A'
      });
      const q3 = new Question({
        quizId: gandhiQuiz._id,
        question: "What title is given to Mahatma Gandhi in India?",
        options: { A: "Father of the Nation", B: "Iron Man of India", C: "Chacha", D: "Netaji" },
        correctAnswer: 'A'
      });
      const q4 = new Question({
        quizId: gandhiQuiz._id,
        question: "Which non-violent movement was started by Gandhi in 1930?",
        options: { A: "Quit India Movement", B: "Salt March (Dandi March)", C: "Non-Cooperation Movement", D: "Khilafat Movement" },
        correctAnswer: 'B'
      });
      const q5 = new Question({
        quizId: gandhiQuiz._id,
        question: "What was the name of Gandhi's wife?",
        options: { A: "Kamala Nehru", B: "Kasturba Gandhi", C: "Sarojini Naidu", D: "Putlibai" },
        correctAnswer: 'B'
      });

      await Question.insertMany([q1, q2, q3, q4, q5]);
      console.log('Gandhi Jayanti Quiz and Questions added.');
    } else {
      gandhiQuiz.classes = ['Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8'];
      gandhiQuiz.targetClass = 'Classes 3-8';
      gandhiQuiz.startDate = startDateIST;
      gandhiQuiz.endDate = endDateIST;
      gandhiQuiz.status = 'Published';
      await gandhiQuiz.save();
      console.log('Gandhi Jayanti Quiz updated.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

updateQuizzes();
