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

    // 1. Update all existing Hindi quizzes to have standard dates, timing (30 min) and totalScore (10)
    const existingQuizzes = await Quiz.find({});
    console.log(`Found ${existingQuizzes.length} existing quizzes. Updating timing and schedule...`);

    for (const q of existingQuizzes) {
      if (q.name.includes('Gandhi') || q.name.includes('गांधी')) {
        continue;
      }
      q.startDate = new Date('2026-08-15T00:00:00.000Z');
      q.endDate = new Date('2026-09-30T23:59:59.000Z');
      q.totalScore = 10;
      q.numberOfQuestions = 10;
      q.timing = '00:30 Hours';
      q.durationMinutes = 30;
      q.bannerUrl = '/img/hindidiwas.png';
      q.scheduleStatus = 'Ongoing';
      await q.save();
    }
    console.log('Updated existing quizzes to Ongoing with timing: 00:30 Hours (30 Minutes).');

    // 2. Ensure Gandhi Jayanti Upcoming Quiz exists (Opening 2 Oct, 2026 12:00 PM)
    let gandhiQuiz = await Quiz.findOne({ name: /गांधी जयंती|Gandhi Jayanti/i });
    if (!gandhiQuiz) {
      gandhiQuiz = await Quiz.create({
        name: 'Quiz on Gandhi Jayanti',
        subjectId: subject._id,
        numberOfQuestions: 10,
        totalScore: 10,
        passingPercentage: 50,
        timePerQuestion: 180,
        description: 'Get Ready for the Next - Quiz on Gandhi Jayanti - Join and Celebrate Learning! सत्य, अहिंसा और राष्ट्रपिता महात्मा गांधी के जीवन व आदर्शों पर आधारित विशेष प्रतियोगिता।',
        instructions: 'यह प्रतियोगिता 2 अक्टूबर 2026 को दोपहर 12:00 बजे से प्रारंभ होगी। सभी छात्र निर्धारित समय पर भाग लें।',
        contactInfo: '+91 92174 78822',
        language: 'hi',
        targetClass: 'All',
        status: 'Published',
        startDate: new Date('2026-10-02T12:00:00.000Z'),
        endDate: new Date('2026-10-15T23:59:59.000Z'),
        timing: '00:30 Hours',
        durationMinutes: 30,
        bannerUrl: '/img/gandhijayanti.png',
        scheduleStatus: 'Upcoming',
      });
      console.log('Created Gandhi Jayanti Upcoming Quiz (2 Oct):', gandhiQuiz.name);
    } else {
      gandhiQuiz.name = 'Quiz on Gandhi Jayanti';
      gandhiQuiz.scheduleStatus = 'Upcoming';
      gandhiQuiz.startDate = new Date('2026-10-02T12:00:00.000Z');
      gandhiQuiz.endDate = new Date('2026-10-15T23:59:59.000Z');
      gandhiQuiz.numberOfQuestions = 10;
      gandhiQuiz.totalScore = 10;
      gandhiQuiz.timing = '00:30 Hours';
      gandhiQuiz.durationMinutes = 30;
      gandhiQuiz.bannerUrl = '/img/gandhijayanti.png';
      gandhiQuiz.status = 'Published';
      gandhiQuiz.targetClass = 'All';
      await gandhiQuiz.save();
      console.log('Updated Gandhi Jayanti Upcoming Quiz:', gandhiQuiz.name);
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
