require('dotenv').config();
const mongoose = require('mongoose');

/**
 * Isolated Test Environment Teardown Tool
 * Safely removes test accounts and attempts from the test database.
 */
async function teardownLoadTestUsers() {
  const testUri = process.env.TEST_MONGODB_URI;

  if (!testUri) {
    console.error('❌ FATAL: TEST_MONGODB_URI is not set in .env.');
    process.exit(1);
  }

  const dbName = testUri.split('?')[0].split('/').pop();
  if (!dbName.toLowerCase().includes('test')) {
    console.error(`❌ FATAL: Database "${dbName}" does not contain "test". Refusing to run to protect production!`);
    process.exit(1);
  }

  console.log(`Connecting to TEST Database: ${dbName}...`);
  await mongoose.connect(testUri);

  const Student = require('../models/Student');
  const Attempt = require('../models/Attempt');

  const studentRes = await Student.deleteMany({ email: { $regex: '@edulinequiz\\.test$' } });
  const attemptRes = await Attempt.deleteMany({ studentIdentifier: { $regex: '^EDU-TEST-' } });

  console.log(`✅ Cleaned ${studentRes.deletedCount} load test students.`);
  console.log(`✅ Cleaned ${attemptRes.deletedCount} load test attempts.`);

  await mongoose.disconnect();
  console.log('Teardown complete.');
  process.exit(0);
}

teardownLoadTestUsers().catch((err) => {
  console.error('Teardown error:', err);
  process.exit(1);
});
