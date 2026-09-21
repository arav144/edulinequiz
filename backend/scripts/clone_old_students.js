require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

async function cloneOldStudents() {
  console.log('🔄 Connecting to MongoDB Atlas...');
  await mongoose.connect(process.env.MONGODB_URI);
  const client = mongoose.connection.client;
  const currentDb = mongoose.connection.db;
  console.log(`✅ Connected to current database: ${currentDb.databaseName}`);

  // 1. Fetch old students (students without email registered in the old portal)
  const oldStudentsQuery = {
    $or: [{ email: { $exists: false } }, { email: null }, { email: '' }]
  };
  const oldStudents = await currentDb.collection('students').find(oldStudentsQuery).toArray();
  const allStudents = await currentDb.collection('students').find({}).toArray();
  const allAttempts = await currentDb.collection('attempts').find({}).toArray();

  console.log(`📊 Found ${oldStudents.length} old students (out of ${allStudents.length} total students).`);
  console.log(`📊 Found ${allAttempts.length} total quiz attempts.`);

  // 2. Identify attempts belonging to old students
  const oldStudentIds = new Set(oldStudents.map(s => String(s._id)));
  const oldIdentifiers = new Set(oldStudents.map(s => s.studentIdentifier ? s.studentIdentifier.toUpperCase() : null).filter(Boolean));

  const oldAttempts = allAttempts.filter(att => {
    const sId = att.studentId ? String(att.studentId) : null;
    const sIdent = att.studentIdentifier ? att.studentIdentifier.toUpperCase() : null;
    return (sId && oldStudentIds.has(sId)) || (sIdent && oldIdentifiers.has(sIdent));
  });

  console.log(`📊 Found ${oldAttempts.length} attempts belonging specifically to old students.`);

  // 3. Backup to Local JSON files
  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const oldStudentsJsonPath = path.join(backupDir, 'old_students_968.json');
  const oldAttemptsJsonPath = path.join(backupDir, 'old_attempts_1098.json');
  const allStudentsSnapshotPath = path.join(backupDir, 'all_students_snapshot_985.json');

  fs.writeFileSync(oldStudentsJsonPath, JSON.stringify(oldStudents, null, 2), 'utf8');
  fs.writeFileSync(oldAttemptsJsonPath, JSON.stringify(oldAttempts, null, 2), 'utf8');
  fs.writeFileSync(allStudentsSnapshotPath, JSON.stringify(allStudents, null, 2), 'utf8');
  console.log(`💾 Saved local JSON backups in ${backupDir}`);

  // 4. Clone to separate database: 'old_database'
  const oldDb = client.db('old_database');
  console.log(`🔄 Cloning into MongoDB database: '${oldDb.databaseName}'...`);
  
  // Clean old target collections if re-running
  await oldDb.collection('students').deleteMany({});
  await oldDb.collection('attempts').deleteMany({});
  await oldDb.collection('all_students_snapshot').deleteMany({});

  if (oldStudents.length > 0) {
    await oldDb.collection('students').insertMany(oldStudents);
    console.log(`  ✓ Inserted ${oldStudents.length} old students into '${oldDb.databaseName}.students'`);
  }
  if (oldAttempts.length > 0) {
    await oldDb.collection('attempts').insertMany(oldAttempts);
    console.log(`  ✓ Inserted ${oldAttempts.length} attempts into '${oldDb.databaseName}.attempts'`);
  }
  if (allStudents.length > 0) {
    await oldDb.collection('all_students_snapshot').insertMany(allStudents);
    console.log(`  ✓ Inserted ${allStudents.length} all students into '${oldDb.databaseName}.all_students_snapshot'`);
  }

  // 5. Also clone into 'quizDB' (the existing second database in Atlas) as archive
  const quizDb = client.db('quizDB');
  console.log(`🔄 Cloning into MongoDB database: '${quizDb.databaseName}'...`);
  await quizDb.collection('old_students').deleteMany({});
  await quizDb.collection('old_attempts').deleteMany({});
  if (oldStudents.length > 0) {
    await quizDb.collection('old_students').insertMany(oldStudents);
    console.log(`  ✓ Inserted ${oldStudents.length} old students into '${quizDb.databaseName}.old_students'`);
  }
  if (oldAttempts.length > 0) {
    await quizDb.collection('old_attempts').insertMany(oldAttempts);
    console.log(`  ✓ Inserted ${oldAttempts.length} old attempts into '${quizDb.databaseName}.old_attempts'`);
  }

  // 6. Also clone into current database ('test') in separate collections 'old_students' and 'old_attempts'
  console.log(`🔄 Creating clone collections in current database: '${currentDb.databaseName}'...`);
  await currentDb.collection('old_students').deleteMany({});
  await currentDb.collection('old_attempts').deleteMany({});
  if (oldStudents.length > 0) {
    await currentDb.collection('old_students').insertMany(oldStudents);
    console.log(`  ✓ Inserted ${oldStudents.length} old students into '${currentDb.databaseName}.old_students'`);
  }
  if (oldAttempts.length > 0) {
    await currentDb.collection('old_attempts').insertMany(oldAttempts);
    console.log(`  ✓ Inserted ${oldAttempts.length} old attempts into '${currentDb.databaseName}.old_attempts'`);
  }

  console.log('\n======================================================');
  console.log('🎉 CLONING PROCESS COMPLETED SUCCESSFULLY!');
  console.log('======================================================');
  console.log(`1. Atlas Database 'old_database':`);
  console.log(`   - students: ${await oldDb.collection('students').countDocuments()}`);
  console.log(`   - attempts: ${await oldDb.collection('attempts').countDocuments()}`);
  console.log(`2. Atlas Database 'quizDB':`);
  console.log(`   - old_students: ${await quizDb.collection('old_students').countDocuments()}`);
  console.log(`   - old_attempts: ${await quizDb.collection('old_attempts').countDocuments()}`);
  console.log(`3. Atlas Database '${currentDb.databaseName}' (Current DB):`);
  console.log(`   - old_students: ${await currentDb.collection('old_students').countDocuments()}`);
  console.log(`   - old_attempts: ${await currentDb.collection('old_attempts').countDocuments()}`);
  console.log(`4. Local JSON Backup Files:`);
  console.log(`   - ${oldStudentsJsonPath}`);
  console.log(`   - ${oldAttemptsJsonPath}`);
  console.log('======================================================\n');

  await mongoose.disconnect();
}

cloneOldStudents().catch(err => {
  console.error('❌ Error during cloning:', err);
  process.exit(1);
});
