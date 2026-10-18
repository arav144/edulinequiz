require('dotenv').config();
const Student = require('../models/Student');
const connectDB = require('../config/db');

async function listTestUsers() {
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

  const userIds = users.map((u) => u._id);
  const userIdentifiers = users.map((u) => u.studentIdentifier);
  const Attempt = require('../models/Attempt');

  const attempts = await Attempt.find({
    $or: [
      { studentId: { $in: userIds } },
      { studentIdentifier: { $in: userIdentifiers } },
    ],
  }).lean();

  console.log(`FOUND_${users.length}_TEST_USERS:`);
  console.log(JSON.stringify(users, null, 2));
  console.log(`\nASSOCIATED_ATTEMPTS: ${attempts.length}`);
  process.exit(0);

}

listTestUsers().catch((err) => {
  console.error('Error listing test users:', err);
  process.exit(1);
});
