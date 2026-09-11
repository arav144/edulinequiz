const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const Subject = require('../models/Subject');

async function syncQuizzes() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    let subject = await Subject.findOne({ name: { $regex: /^hindi$/i } });
    if (!subject) {
      subject = await Subject.create({ name: 'Hindi' });
    }

    // 1. Update all existing Hindi quizzes to have standard dates, timing and totalScore
    const existingQuizzes = await Quiz.find({});
    console.log(`Found ${existingQuizzes.length} existing quizzes. Updating timing and schedule...`);

    for (const q of existingQuizzes) {
      q.startDate = new Date('2026-08-15T00:00:00.000Z');
      q.endDate = new Date('2026-09-30T23:59:59.000Z');
      q.totalScore = q.numberOfQuestions ? q.numberOfQuestions * 2 : 20;
      q.timing = '00:10 Hours';
      q.durationMinutes = 10;
      q.bannerUrl = '/img/hindidiwas.png';
      q.scheduleStatus = 'Ongoing';
      await q.save();
    }
    console.log('Updated existing quizzes to Ongoing with timing: 00:10 Hours, Expiry: 30 Sep, 2026.');

    // 2. Ensure an Upcoming Quiz exists
    let upcomingQuiz = await Quiz.findOne({ name: /राष्ट्रीय हिंदी ज्ञान प्रतियोगिता|Upcoming Hindi/i });
    if (!upcomingQuiz) {
      upcomingQuiz = await Quiz.create({
        name: 'राष्ट्रीय हिंदी ज्ञान प्रतियोगिता 2026',
        subjectId: subject._id,
        numberOfQuestions: 20,
        passingPercentage: 50,
        timePerQuestion: 45,
        description: 'राष्ट्रीय स्तर पर आयोजित आगामी हिंदी भाषा एवं साहित्य ज्ञान प्रतियोगिता।',
        instructions: 'यह प्रतियोगिता 1 अक्टूबर 2026 से प्रारंभ होगी। सभी छात्र समय पर भाग लें।',
        contactInfo: '+91 92174 78822',
        language: 'hi',
        targetClass: 'All',
        status: 'Published',
        startDate: new Date('2026-10-01T00:00:00.000Z'),
        endDate: new Date('2026-10-31T23:59:59.000Z'),
        totalScore: 20,
        timing: '00:15 Hours',
        durationMinutes: 15,
        bannerUrl: '/img/hindidiwas.png',
        scheduleStatus: 'Upcoming',
      });
      console.log('Created Upcoming Quiz:', upcomingQuiz.name);
    } else {
      upcomingQuiz.scheduleStatus = 'Upcoming';
      upcomingQuiz.startDate = new Date('2026-10-01T00:00:00.000Z');
      upcomingQuiz.endDate = new Date('2026-10-31T23:59:59.000Z');
      upcomingQuiz.timing = '00:15 Hours';
      upcomingQuiz.totalScore = 20;
      upcomingQuiz.bannerUrl = '/img/hindidiwas.png';
      await upcomingQuiz.save();
      console.log('Updated Upcoming Quiz:', upcomingQuiz.name);
    }

    // 3. Ensure a Past Quiz exists
    let pastQuiz = await Quiz.findOne({ name: /स्वतंत्रता दिवस विशेष प्रतियोगिता|Independence Day/i });
    if (!pastQuiz) {
      pastQuiz = await Quiz.create({
        name: 'स्वतंत्रता दिवस विशेष प्रतियोगिता 2026',
        subjectId: subject._id,
        numberOfQuestions: 15,
        passingPercentage: 50,
        timePerQuestion: 30,
        description: 'स्वतंत्रता दिवस के उपलक्ष्य में आयोजित देशभक्ति व इतिहास आधारित प्रतियोगिता।',
        instructions: 'यह प्रतियोगिता 15 अगस्त 2026 को सफलतापूर्वक संपन्न हो चुकी है।',
        contactInfo: '+91 92174 78822',
        language: 'hi',
        targetClass: 'All',
        status: 'Closed',
        startDate: new Date('2026-08-01T00:00:00.000Z'),
        endDate: new Date('2026-08-15T23:59:59.000Z'),
        totalScore: 15,
        timing: '00:10 Hours',
        durationMinutes: 10,
        bannerUrl: '/img/hindidiwas.png',
        scheduleStatus: 'Past',
      });
      console.log('Created Past Quiz:', pastQuiz.name);
    } else {
      pastQuiz.scheduleStatus = 'Past';
      pastQuiz.startDate = new Date('2026-08-01T00:00:00.000Z');
      pastQuiz.endDate = new Date('2026-08-15T23:59:59.000Z');
      pastQuiz.timing = '00:10 Hours';
      pastQuiz.totalScore = 15;
      pastQuiz.bannerUrl = '/img/hindidiwas.png';
      await pastQuiz.save();
      console.log('Updated Past Quiz:', pastQuiz.name);
    }

    console.log('Sync completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Sync error:', err);
    process.exit(1);
  }
}

syncQuizzes();
