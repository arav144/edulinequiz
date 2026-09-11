const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const Quiz = require('../models/Quiz');

async function fixAll() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // 1. Hindi Diwas quizzes (Upcoming on 13 Sep 2026, 30 Min, 10 Score, 10 Questions)
  await Quiz.updateMany(
    { name: /हिंदी दिवस/i },
    {
      $set: {
        startDate: new Date('2026-09-13T06:30:00.000Z'),
        endDate: new Date('2026-09-30T18:29:59.000Z'),
        numberOfQuestions: 10,
        totalScore: 10,
        durationMinutes: 30,
        timing: '00:30 Hours',
        bannerUrl: '/img/hindidiwas.png',
        scheduleStatus: 'Upcoming',
        status: 'Published',
      }
    }
  );
  // Ensure Class 3 representative has isFeaturedOnPortal: true
  await Quiz.updateOne(
    { name: /हिंदी दिवस प्रतियोगिता - कक्षा 3/i },
    { $set: { isFeaturedOnPortal: true } }
  );

  // 2. Gandhi Jayanti Quiz (Upcoming on 02 Oct 2026, 30 Min, 10 Score, 10 Questions, Featured)
  await Quiz.updateMany(
    { name: /Gandhi|गांधी/i },
    {
      $set: {
        name: 'Quiz on Gandhi Jayanti',
        startDate: new Date('2026-10-02T06:30:00.000Z'),
        endDate: new Date('2026-10-15T18:29:59.000Z'),
        numberOfQuestions: 10,
        totalScore: 10,
        durationMinutes: 30,
        timing: '00:30 Hours',
        bannerUrl: '/img/gandhijayanti.png',
        scheduleStatus: 'Upcoming',
        targetClass: 'All',
        status: 'Published',
        isFeaturedOnPortal: true,
      }
    }
  );

  // 3. Independence Day Quiz (Past on 15 Aug 2026)
  await Quiz.updateMany(
    { name: /स्वतंत्रता दिवस/i },
    {
      $set: {
        startDate: new Date('2026-08-01T06:30:00.000Z'),
        endDate: new Date('2026-08-15T18:29:59.000Z'),
        numberOfQuestions: 15,
        totalScore: 15,
        durationMinutes: 30,
        timing: '00:30 Hours',
        bannerUrl: '/img/hindidiwas.png',
        scheduleStatus: 'Past',
        targetClass: 'All',
        status: 'Closed',
        isFeaturedOnPortal: true,
      }
    }
  );

  console.log('All quizzes aligned successfully in MongoDB!');
  process.exit(0);
}

fixAll();
