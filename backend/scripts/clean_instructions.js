const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const quizzes = await mongoose.connection.collection('quizzes').find({}).toArray();
  for (const q of quizzes) {
    if (q.instructions && (/seconds/i.test(q.instructions) || /सेकंड/i.test(q.instructions))) {
      const cleanInst = q.instructions
        .replace(/You have \d+\s*(seconds|sec|s)\s*per question\.?/gi, '')
        .replace(/Each question has a countdown timer[^.]*\.?/gi, '')
        .replace(/Each question has a time limit[^.]*\.?/gi, '')
        .replace(/प्रत्येक प्रश्न के लिए निर्धारित समय[^.]*\.?/gi, '')
        .replace(/\(\s*\d+\s*(सेकंड|seconds|sec|s)\s*\)/gi, '')
        .replace(/\d+\s*(seconds|sec|s)\s*per question\.?/gi, '')
        .trim();

      await mongoose.connection.collection('quizzes').updateOne(
        { _id: q._id },
        { $set: { instructions: cleanInst } }
      );
      console.log(`Updated instructions for ${q.name}: "${cleanInst}"`);
    }
  }

  console.log('Done updating quiz instructions.');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
