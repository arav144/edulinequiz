const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const Quiz = require('../models/Quiz');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const quizzes = await Quiz.find({});
  for (const q of quizzes) {
    let dur = q.durationMinutes;

    // 1. If timing specifies hours like "01:00 Hours" or "1 Hour"
    if (q.timing) {
      const matchHourMin = q.timing.match(/(\d+):(\d+)\s*Hours?/i);
      const matchHourOnly = q.timing.match(/(\d+)\s*(?:Hours?|Hr)/i);
      const matchMinOnly = q.timing.match(/(\d+)\s*(?:Minutes?|Min)/i);

      if (matchHourMin) {
        dur = parseInt(matchHourMin[1], 10) * 60 + parseInt(matchHourMin[2], 10);
      } else if (matchHourOnly) {
        dur = parseInt(matchHourOnly[1], 10) * 60;
      } else if (matchMinOnly) {
        dur = parseInt(matchMinOnly[1], 10);
      }
    }

    // 2. If startDate and endDate are same day with time difference <= 24 hours
    if (q.startDate && q.endDate) {
      const s = new Date(q.startDate).getTime();
      const e = new Date(q.endDate).getTime();
      const diffMins = Math.round((e - s) / (1000 * 60));
      if (diffMins > 0 && diffMins <= 1440) {
        dur = diffMins;
      }
    }

    if (dur && dur !== q.durationMinutes) {
      console.log(`Updating "${q.name}" duration: ${q.durationMinutes} -> ${dur} mins`);
      q.durationMinutes = dur;
      await q.save();
    }
  }

  console.log('Done updating quiz durations.');
  await mongoose.disconnect();
}

run().catch(console.error);
