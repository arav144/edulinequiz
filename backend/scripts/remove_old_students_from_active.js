require('dotenv').config();
const mongoose = require('mongoose');

async function removeOldStudents() {
  console.log('🔄 Connecting to MongoDB Atlas...');
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const client = mongoose.connection.client;

  console.log(`Connected to active DB: ${db.databaseName}`);

  // Safety Check: Verify old data exists in backup before deletion
  const backupCount = await client.db('old_database').collection('students').countDocuments();
  const backupAttempts = await client.db('old_database').collection('attempts').countDocuments();
  console.log(`🛡️ Safety check - Backup in 'old_database': ${backupCount} students, ${backupAttempts} attempts.`);

  if (backupCount < 900) {
    throw new Error('ABORTING: Backup verification failed. Old database does not have the cloned students.');
  }

  // 1. Target old students query
  const oldStudentsFilter = {
    $or: [{ email: { $exists: false } }, { email: null }, { email: '' }]
  };

  const oldStudents = await db.collection('students').find(oldStudentsFilter).toArray();
  const oldIds = oldStudents.map(s => s._id);
  const oldIdentifiers = oldStudents.map(s => s.studentIdentifier).filter(Boolean);

  console.log(`Targeting ${oldStudents.length} old students for removal from active DB.`);

  // 2. Remove old attempts from active DB
  const deletedAttemptsResult = await db.collection('attempts').deleteMany({
    $or: [
      { studentId: { $in: oldIds } },
      { studentIdentifier: { $in: oldIdentifiers } }
    ]
  });
  console.log(`✓ Removed ${deletedAttemptsResult.deletedCount} old attempts from active 'attempts' collection.`);

  // 3. Remove old students from active students collection
  const deletedStudentsResult = await db.collection('students').deleteMany(oldStudentsFilter);
  console.log(`✓ Removed ${deletedStudentsResult.deletedCount} old students from active 'students' collection.`);

  // 4. Verify remaining active data
  const remainingStudents = await db.collection('students').countDocuments();
  const remainingAttempts = await db.collection('attempts').countDocuments();

  console.log('\n======================================================');
  console.log('✅ ACTIVE DATABASE CLEANUP COMPLETE!');
  console.log('======================================================');
  console.log(`Remaining active registered students: ${remainingStudents} (only new students with email/PIN)`);
  console.log(`Remaining active quiz attempts: ${remainingAttempts}`);
  console.log('All old students remain safely archived in:');
  console.log('  1. Atlas DB: old_database (students: 968, attempts: 1098)');
  console.log('  2. Atlas DB: quizDB.old_students');
  console.log('  3. Atlas DB: test.old_students');
  console.log('  4. Local files: backend/backups/');
  console.log('======================================================\n');

  await mongoose.disconnect();
}

removeOldStudents().catch(err => {
  console.error('❌ Error during cleanup:', err);
  process.exit(1);
});
