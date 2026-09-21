const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Quiz = require('./models/Quiz');

async function seedGandhiQuiz() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB.');

    // Check if it already exists
    const existing = await Quiz.findOne({ name: /Gandhi/i });
    if (existing) {
      console.log('Gandhi Jayanti quiz already exists.');
      process.exit(0);
    }

    const newQuiz = new Quiz({
      name: 'Gandhi Jayanti Special Quiz',
      subject: 'History', // Ensure this subject or generic subject
      isActive: true,
      bannerImage: 'https://upload.wikimedia.org/wikipedia/commons/7/7a/Mahatma-Gandhi%2C_studio%2C_1931.jpg',
      schedule: {
        type: 'flexible',
        startDate: new Date('2026-09-01'),
        endDate: new Date('2026-10-31')
      },
      validClasses: ['Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8'],
      questions: [
        {
          questionText: "When is Mahatma Gandhi's birthday celebrated?",
          options: ["August 15", "October 2", "January 26", "November 14"],
          correctOptionIndex: 1
        },
        {
          questionText: "What is Mahatma Gandhi's full name?",
          options: ["Mohandas Karamchand Gandhi", "Rajiv Gandhi", "Indira Gandhi", "Sonia Gandhi"],
          correctOptionIndex: 0
        },
        {
          questionText: "What title is given to Mahatma Gandhi in India?",
          options: ["Father of the Nation", "Iron Man of India", "Chacha", "Netaji"],
          correctOptionIndex: 0
        },
        {
          questionText: "Which non-violent movement was started by Gandhi in 1930?",
          options: ["Quit India Movement", "Salt March (Dandi March)", "Non-Cooperation Movement", "Khilafat Movement"],
          correctOptionIndex: 1
        },
        {
          questionText: "What was the name of Gandhi's wife?",
          options: ["Kamala Nehru", "Kasturba Gandhi", "Sarojini Naidu", "Putlibai"],
          correctOptionIndex: 1
        }
      ]
    });

    await newQuiz.save();
    console.log('Gandhi Jayanti quiz successfully added!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding quiz:', err);
    process.exit(1);
  }
}

seedGandhiQuiz();
