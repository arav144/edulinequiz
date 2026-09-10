const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const ClassLevel = require('../models/ClassLevel');
const Quiz = require('../models/Quiz');

async function seedClasses() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    const defaultClasses = [
      { name: 'Class 3', displayHindi: 'कक्षा 3', order: 3 },
      { name: 'Class 4', displayHindi: 'कक्षा 4', order: 4 },
      { name: 'Class 5', displayHindi: 'कक्षा 5', order: 5 },
      { name: 'Class 6', displayHindi: 'कक्षा 6', order: 6 },
      { name: 'Class 7', displayHindi: 'कक्षा 7', order: 7 },
      { name: 'Class 8', displayHindi: 'कक्षा 8', order: 8 },
    ];

    for (const c of defaultClasses) {
      // Find the quiz for this class
      const matchingQuiz = await Quiz.findOne({
        targetClass: c.name,
        status: 'Published',
      });

      let doc = await ClassLevel.findOne({ name: c.name });
      if (!doc) {
        doc = await ClassLevel.create({
          name: c.name,
          displayHindi: c.displayHindi,
          order: c.order,
          isActive: true,
          assignedQuizId: matchingQuiz ? matchingQuiz._id : null,
        });
        console.log(`Created Class ${c.name} assigned to quiz:`, matchingQuiz?.name || 'None');
      } else {
        doc.displayHindi = c.displayHindi;
        doc.order = c.order;
        doc.isActive = true;
        if (matchingQuiz) doc.assignedQuizId = matchingQuiz._id;
        await doc.save();
        console.log(`Updated Class ${c.name} assigned to quiz:`, matchingQuiz?.name || 'None');
      }
    }

    console.log('Class levels initialized successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding classes:', err);
    process.exit(1);
  }
}

seedClasses();
