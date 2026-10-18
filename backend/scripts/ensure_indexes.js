const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectDB = require('../config/db');
const Student = require('../models/Student');
const Attempt = require('../models/Attempt');
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const ClassLevel = require('../models/ClassLevel');
const Subject = require('../models/Subject');
const Theme = require('../models/Theme');
const Admin = require('../models/Admin');

async function run() {
  try {
    console.log('Connecting to MongoDB Atlas to build indexes...');
    await connectDB();

    const models = [
      { name: 'Student', model: Student },
      { name: 'Attempt', model: Attempt },
      { name: 'Quiz', model: Quiz },
      { name: 'Question', model: Question },
      { name: 'ClassLevel', model: ClassLevel },
      { name: 'Subject', model: Subject },
      { name: 'Theme', model: Theme },
      { name: 'Admin', model: Admin },
    ];

    for (const { name, model } of models) {
      console.log(`Building indexes for ${name}...`);
      await model.syncIndexes();
      const indexes = await model.collection.getIndexes();
      console.log(`✅ ${name} indexes:`, Object.keys(indexes).join(', '));
    }

    console.log('\n🎉 All indexes successfully created and synchronized with Atlas!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error synchronizing indexes:', err);
    process.exit(1);
  }
}

run();
