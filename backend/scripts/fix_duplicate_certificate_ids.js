require('dotenv').config();
const connectDB = require('../config/db');
const Attempt = require('../models/Attempt');

async function fixDuplicates() {
  await connectDB();

  const dups = await Attempt.aggregate([
    {
      $group: {
        _id: '$certificateId',
        count: { $sum: 1 },
        ids: { $push: '$_id' }
      }
    },
    {
      $match: {
        count: { $gt: 1 },
        _id: { $ne: null, $ne: '' }
      }
    }
  ]);

  console.log(`Found ${dups.length} certificate IDs with duplicates:`);
  console.log(JSON.stringify(dups, null, 2));

  let fixedCount = 0;
  for (const group of dups) {
    const ids = group.ids;
    // Leave the first one intact, update the remaining duplicates
    for (let i = 1; i < ids.length; i++) {
      const newCertId = `${group._id}-${i}`;
      await Attempt.updateOne({ _id: ids[i] }, { $set: { certificateId: newCertId } });
      console.log(`Updated attempt ${ids[i]} certificateId: ${group._id} -> ${newCertId}`);
      fixedCount++;
    }
  }

  console.log(`\nFixed ${fixedCount} duplicate certificate IDs.`);
  process.exit(0);
}

fixDuplicates().catch(err => {
  console.error(err);
  process.exit(1);
});
