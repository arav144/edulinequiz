require('dotenv').config();
const connectDB = require('../config/db');
const Student = require('../models/Student');

async function check() {
  await connectDB();
  const all = await Student.find({
    $or: [
      { email: /test/i },
      { email: /dummy/i },
      { email: /sample/i },
      { email: /fake/i },
      { firstName: /test/i },
      { lastName: /test/i }
    ]
  }).select('email firstName lastName studentIdentifier createdAt').lean();

  console.log('AUDIT MATCHES COUNT:', all.length);
  console.log(JSON.stringify(all, null, 2));
  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
