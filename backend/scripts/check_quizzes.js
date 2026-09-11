const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const Quiz = require('../models/Quiz');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const q = await Quiz.find({}).lean();
  console.log(q.map(x => ({
    name: x.name,
    targetClass: x.targetClass,
    isFeaturedOnPortal: x.isFeaturedOnPortal,
    startDate: x.startDate,
    scheduleStatus: x.scheduleStatus
  })));
  process.exit(0);
}
check();
