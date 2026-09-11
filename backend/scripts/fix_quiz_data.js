const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const Quiz = require('../models/Quiz');

async function cleanAndAlign() {
  await mongoose.connect(process.env.MONGODB_URI);

  // 1. Hindi Diwas quizzes (13 Sep, 2026)
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
  await Quiz.updateOne(
    { name: /हिंदी दिवस प्रतियोगिता - कक्षा 3/i },
    { $set: { isFeaturedOnPortal: true } }
  );

  // 2. Remove any duplicate Gandhi quizzes and keep exactly one
  const gandhiQuizzes = await Quiz.find({ name: /Gandhi|गांधी/i });
  if (gandhiQuizzes.length > 1) {
    // Keep the first one and delete extra duplicates
    for (let i = 1; i < gandhiQuizzes.length; i++) {
      await Quiz.deleteOne({ _id: gandhiQuizzes[i]._id });
    }
  }

  // Update Gandhi Jayanti Quiz (02 Oct, 2026 12:00 PM IST)
  await Quiz.updateOne(
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
    },
    { upsert: true }
  );

  // 3. Independence Day Past Quiz (15 Aug 2026)
  let pastQuiz = await Quiz.findOne({ name: /स्वतंत्रता दिवस/i });
  if (!pastQuiz) {
    const subject = await (require('../models/Subject')).findOne();
    await Quiz.create({
      name: 'स्वतंत्रता दिवस विशेष प्रतियोगिता 2026',
      subjectId: subject ? subject._id : undefined,
      numberOfQuestions: 15,
      totalScore: 15,
      durationMinutes: 30,
      timing: '00:30 Hours',
      passingPercentage: 50,
      timePerQuestion: 30,
      description: 'स्वतंत्रता दिवस के उपलक्ष्य में आयोजित देशभक्ति व इतिहास आधारित प्रतियोगिता।',
      instructions: 'यह प्रतियोगिता 15 अगस्त 2026 को सफलतापूर्वक संपन्न हो चुकी है।',
      contactInfo: '+91 92174 78822',
      language: 'hi',
      targetClass: 'All',
      status: 'Closed',
      startDate: new Date('2026-08-01T06:30:00.000Z'),
      endDate: new Date('2026-08-15T18:29:59.000Z'),
      bannerUrl: '/img/hindidiwas.png',
      scheduleStatus: 'Past',
      isFeaturedOnPortal: true,
    });
  } else {
    pastQuiz.name = 'स्वतंत्रता दिवस विशेष प्रतियोगिता 2026';
    pastQuiz.startDate = new Date('2026-08-01T06:30:00.000Z');
    pastQuiz.endDate = new Date('2026-08-15T18:29:59.000Z');
    pastQuiz.scheduleStatus = 'Past';
    pastQuiz.status = 'Closed';
    pastQuiz.numberOfQuestions = 15;
    pastQuiz.totalScore = 15;
    pastQuiz.durationMinutes = 30;
    pastQuiz.timing = '00:30 Hours';
    pastQuiz.isFeaturedOnPortal = true;
    await pastQuiz.save();
  }

  console.log('Cleaned and synced MongoDB quizzes perfectly.');
  process.exit(0);
}

cleanAndAlign();
