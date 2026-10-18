require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

/**
 * Isolated Test Environment Seeder for 800 Load Test Accounts
 * STRICT SAFEGUARD: Never executes against production database.
 */
async function seedLoadTestUsers() {
  const testUri = process.env.TEST_MONGODB_URI;

  if (!testUri) {
    console.error('❌ FATAL: TEST_MONGODB_URI is not set in .env.');
    console.error('To protect production, seeding requires a dedicated TEST_MONGODB_URI pointing to a separate test database.');
    console.error('Example: TEST_MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/quiz_test_db');
    process.exit(1);
  }

  function extractClusterHost(uri) {
    if (!uri) return '';
    const match = uri.match(/@([^/?:]+)/);
    return match ? match[1].toLowerCase() : '';
  }

  const prodHost = extractClusterHost(process.env.MONGODB_URI);
  const testHost = extractClusterHost(testUri);

  if (!testHost) {
    console.error('❌ FATAL: Could not parse MongoDB cluster host from TEST_MONGODB_URI.');
    process.exit(1);
  }

  // Safety check 1: Refuse if pointing to the exact same Atlas cluster/project as production
  if (prodHost && testHost === prodHost) {
    console.error('❌ STRICT PRODUCTION SAFEGUARD TRIGGERED:');
    console.error(`TEST_MONGODB_URI cluster host (${testHost}) matches production MongoDB cluster host (${prodHost})!`);
    console.error('Seeding is strictly prohibited on the same Atlas cluster/project, even if the DB name is different.');
    console.error('You must use an entirely separate MongoDB Atlas project / cluster or a local MongoDB instance.');
    process.exit(1);
  }

  // Safety check 2: Ensure test URI has "test" in database name or URI
  const dbName = testUri.split('?')[0].split('/').pop();
  if (!dbName.toLowerCase().includes('test')) {
    console.error(`❌ FATAL: Database "${dbName}" in TEST_MONGODB_URI does not contain "test". Refusing to run to protect production!`);
    process.exit(1);
  }

  console.log(`Connecting to ISOLATED TEST Cluster: ${testHost} (DB: ${dbName})...`);
  await mongoose.connect(testUri);
  console.log(`✅ Connected to isolated test database successfully.`);

  const Student = require('../models/Student');

  console.log('\n[1/3] Pre-computing single bcrypt hash for PIN "1234"...');
  const hashStart = Date.now();
  const sharedPinHash = await bcrypt.hash('1234', 10);
  console.log(`✅ Shared PIN hash computed in ${Date.now() - hashStart}ms.`);

  console.log('\n[2/3] Generating 800 student document payloads in memory...');
  const students = [];
  for (let i = 1; i <= 800; i++) {
    const classNum = (i % 6) + 3; // Classes 3 to 8
    students.push({
      studentIdentifier: `EDU-TEST-${String(i).padStart(4, '0')}`,
      firstName: `LoadTest${i}`,
      lastName: 'Student',
      name: `LoadTest${i} Student`,
      email: `loadtest_student_${i}@edulinequiz.test`,
      emailVerified: true,
      schoolName: 'Load Testing Academy',
      class: `Class ${classNum}`,
      className: `Class ${classNum}`,
      dateOfBirth: '01/01/2012',
      dob: '01/01/2012',
      gender: i % 2 === 0 ? 'Female' : 'Male',
      state: 'Delhi',
      address: 'Test Environment Lab',
      pinCode: '110001',
      previousQuizParticipation: 'No',
      participatedEarlier: 'No',
      pinHash: sharedPinHash,
      passwordHash: sharedPinHash,
      isBlocked: false,
    });
  }

  console.log('\n[3/3] Inserting 800 students via single bulk insertMany()...');
  const insertStart = Date.now();
  const res = await Student.insertMany(students, { ordered: false });
  console.log(`✅ Successfully seeded ${res.length} test accounts into "${dbName}" in ${Date.now() - insertStart}ms!`);

  await mongoose.disconnect();
  console.log('Test database disconnected safely.');
  process.exit(0);
}

seedLoadTestUsers().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
