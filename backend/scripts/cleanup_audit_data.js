const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const Student = require('../models/Student');
const Attempt = require('../models/Attempt');
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');

async function cleanup() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');

  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB Atlas');

  // 1. Identify Test Quizzes
  const testQuizFilter = {
    $or: [
      { name: /\[Audit Load Test\]/i },
      { name: /Mathematics Quiz \(\d+\)/i },
      { name: /Future Science Quiz/i },
    ],
  };

  const testQuizzes = await Quiz.find(testQuizFilter).select('_id name');
  const testQuizIds = testQuizzes.map((q) => q._id);
  console.log(`\nFound ${testQuizzes.length} test quizzes to remove:`, testQuizzes.map((q) => q.name));

  // 2. Identify Test Questions
  let deletedQuestions = 0;
  if (testQuizIds.length > 0) {
    const qRes = await Question.deleteMany({ quizId: { $in: testQuizIds } });
    deletedQuestions = qRes.deletedCount;
    console.log(`✅ Deleted ${deletedQuestions} test questions.`);
  }

  // 3. Delete Test Quizzes
  if (testQuizIds.length > 0) {
    const quizDelRes = await Quiz.deleteMany({ _id: { $in: testQuizIds } });
    console.log(`✅ Deleted ${quizDelRes.deletedCount} test quizzes.`);
  }

  // 4. Identify Test Students
  const testStudentFilter = {
    $or: [
      { email: /loadtest|edulinequiz\.test|eduline\.test|audit/i },
      { studentIdentifier: /^AUDIT-|^STU\d+|^EDU-SCHOLAR/i },
      { schoolName: /Audit Test School/i },
    ],
  };

  const testStudents = await Student.find(testStudentFilter).select('_id studentIdentifier email');
  const testStudentIds = testStudents.map((s) => s._id);
  console.log(`\nFound ${testStudents.length} audit test students to remove.`);

  // 5. Delete Test Attempts
  const testAttemptFilter = {
    $or: [
      { studentId: { $in: testStudentIds } },
      { studentIdentifier: /^AUDIT-|^STU\d+|^EDU-SCHOLAR/i },
      { schoolName: /Audit Test School/i },
      { quizId: { $in: testQuizIds } },
    ],
  };

  const attemptDelRes = await Attempt.deleteMany(testAttemptFilter);
  console.log(`✅ Deleted ${attemptDelRes.deletedCount} audit test attempts.`);

  // 6. Delete Test Students
  const studentDelRes = await Student.deleteMany(testStudentFilter);
  console.log(`✅ Deleted ${studentDelRes.deletedCount} audit test students.`);

  // 7. Verify remaining clean state in DB
  const remainingStudents = await Student.countDocuments({});
  const remainingQuizzes = await Quiz.countDocuments({});
  const remainingAttempts = await Attempt.countDocuments({});

  console.log('\n================================================================');
  console.log('CLEAN DATABASE STATE VERIFIED:');
  console.log(`   Real Students : ${remainingStudents}`);
  console.log(`   Quizzes       : ${remainingQuizzes}`);
  console.log(`   Real Attempts : ${remainingAttempts}`);
  console.log('================================================================');

  process.exit(0);
}

cleanup().catch((err) => {
  console.error('❌ Error during audit cleanup:', err);
  process.exit(1);
});
