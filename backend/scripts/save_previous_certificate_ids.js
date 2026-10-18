require('dotenv').config();
const connectDB = require('../config/db');
const Attempt = require('../models/Attempt');

async function main() {
  const isExecute = process.argv.includes('--execute');
  const isDryRun = !isExecute;

  console.log(`=======================================================`);
  console.log(`MODE: ${isDryRun ? 'DRY-RUN (READ-ONLY PREVIEW)' : 'LIVE EXECUTION (WRITING TO DB)'}`);
  console.log(`=======================================================\n`);

  await connectDB();

  // Find all records where certificateId has suffix '-N' (the 99 changed duplicates)
  const modifiedRecords = await Attempt.find({
    certificateId: { $regex: /^EDU-\d+-\d+-\d+$/ }
  }).sort({ certificateId: 1 }).lean();

  console.log(`Found ${modifiedRecords.length} records with modified duplicate certificate IDs.\n`);

  if (modifiedRecords.length === 0) {
    console.log('No records found matching criteria.');
    process.exit(0);
  }

  console.log(`Preview of changes to be applied:`);
  console.log(`----------------------------------------------------------------------------------------------------------------`);
  console.log(`Attempt ID               | Student Name           | Current Cert ID      | Previous Cert ID to Save`);
  console.log(`----------------------------------------------------------------------------------------------------------------`);

  let countToUpdate = 0;
  for (const rec of modifiedRecords) {
    const oldId = rec.certificateId.replace(/-\d+$/, '');
    const needsUpdate = rec.previousCertificateId !== oldId;
    if (needsUpdate) countToUpdate++;

    console.log(
      `${rec._id.toString().padEnd(24)} | ` +
      `${(rec.studentName || '').slice(0, 22).padEnd(22)} | ` +
      `${rec.certificateId.padEnd(20)} | ` +
      `${oldId} ${rec.previousCertificateId ? `(already: ${rec.previousCertificateId})` : ''}`
    );
  }

  console.log(`----------------------------------------------------------------------------------------------------------------`);
  console.log(`Total candidate records      : ${modifiedRecords.length}`);
  console.log(`Records needing update       : ${countToUpdate}`);

  if (isDryRun) {
    console.log(`\n[DRY-RUN COMPLETE] No database changes were made.`);
    console.log(`To apply these changes to the live database, run:`);
    console.log(`  node backend/scripts/save_previous_certificate_ids.js --execute\n`);
    process.exit(0);
  }

  // Live execution
  console.log(`\nApplying updates to MongoDB...`);
  let updatedCount = 0;
  for (const rec of modifiedRecords) {
    const oldId = rec.certificateId.replace(/-\d+$/, '');
    await Attempt.updateOne(
      { _id: rec._id },
      { $set: { previousCertificateId: oldId } }
    );
    updatedCount++;
  }

  console.log(`Successfully updated ${updatedCount} records with 'previousCertificateId'.`);
  process.exit(0);
}

main().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});
