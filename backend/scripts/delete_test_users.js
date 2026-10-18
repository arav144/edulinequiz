require('dotenv').config();
const connectDB = require('../config/db');
const Student = require('../models/Student');
const Attempt = require('../models/Attempt');

async function main() {
  await connectDB();

  const query = {
    $or: [
      { email: { $regex: 'loadtest', $options: 'i' } },
      { email: { $regex: 'blocktest', $options: 'i' } },
      { email: { $regex: 'test_bench', $options: 'i' } },
      { email: { $regex: 'bench_', $options: 'i' } },
      { email: { $regex: '@test\\.com$', $options: 'i' } },
      { firstName: { $regex: '^test|^bench|^block', $options: 'i' } },
      { schoolName: { $regex: 'Test School', $options: 'i' } },
    ],
  };

  const users = await Student.find(query)
    .select('_id email studentIdentifier firstName lastName schoolName class createdAt')
    .sort({ createdAt: -1 })
    .lean();

  console.log(`\n===============================================================`);
  console.log(`📋 STEP 1: TEST USERS IDENTIFIED FOR DELETION (${users.length} users)`);
  console.log(`===============================================================`);
  console.log(JSON.stringify(users, null, 2));

  if (users.length === 0) {
    console.log('\nNo test users found. Database is clean.');
    process.exit(0);
  }

  const userIds = users.map((u) => u._id);
  const userIdentifiers = users.map((u) => u.studentIdentifier);

  const attempts = await Attempt.find({
    $or: [
      { studentId: { $in: userIds } },
      { studentIdentifier: { $in: userIdentifiers } },
    ],
  }).lean();

  console.log(`\nAssociated Test Attempts Found: ${attempts.length}`);

  // Delete attempts if any
  if (attempts.length > 0) {
    const attemptDeleteResult = await Attempt.deleteMany({
      $or: [
        { studentId: { $in: userIds } },
        { studentIdentifier: { $in: userIdentifiers } },
      ],
    });
    console.log(`Deleted ${attemptDeleteResult.deletedCount} associated test attempts.`);
  }

  // Delete students
  const studentDeleteResult = await Student.deleteMany({ _id: { $in: userIds } });
  console.log(`\n===============================================================`);
  console.log(`🗑️ STEP 2: DELETION EXECUTED`);
  console.log(`===============================================================`);
  console.log(`Successfully deleted ${studentDeleteResult.deletedCount} test students from MongoDB Atlas.`);
  console.log(`Database is now free of test accounts.\n`);

  process.exit(0);
}

main().catch((err) => {
  console.error('Error during test user deletion:', err);
  process.exit(1);
});
