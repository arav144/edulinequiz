const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const Subject = require('../models/Subject');
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');

const hindiQuestions = [
  {
    question: 'हिंदी की लिपि कौन-सी है?',
    options: {
      A: 'रोमन',
      B: 'गुरुमुखी',
      C: 'देवनागरी',
      D: 'उर्दू',
    },
    correctAnswer: 'C',
    explanation: 'हिंदी भाषा देवनागरी लिपि में लिखी जाती है।',
  },
  {
    question: 'हिंदी भारत की_______________भाषा है|',
    options: {
      A: 'राजभाषा',
      B: 'विदेशी भाषा',
      C: 'क्षेत्रीय भाषा',
      D: 'सांकेतिक भाषा',
    },
    correctAnswer: 'A',
    explanation: 'भारतीय संविधान के अनुच्छेद 343(1) के अनुसार संघ की राजभाषा हिंदी है।',
  },
  {
    question: '‘जल’ का पर्यायवाची क्या है?',
    options: {
      A: 'अग्नि',
      B: 'नीर',
      C: 'वायु',
      D: 'धरती',
    },
    correctAnswer: 'B',
    explanation: '‘नीर’ जल का प्रमुख पर्यायवाची शब्द है।',
  },
  {
    question: 'हिंदी दिवस पहली बार किस वर्ष मनाया गया था?',
    options: {
      A: '1947',
      B: '1950',
      C: '1953',
      D: '1960',
    },
    correctAnswer: 'C',
    explanation: 'पहला आधिकारिक हिंदी दिवस 14 सितंबर 1953 को मनाया गया था।',
  },
  {
    question: 'भारतीय संविधान के किस अनुच्छेद में संघ की राजभाषा का उल्लेख है?',
    options: {
      A: 'अनुच्छेद 343',
      B: 'अनुच्छेद 345',
      C: 'अनुच्छेद 351',
      D: 'अनुच्छेद 356',
    },
    correctAnswer: 'A',
    explanation: 'भारतीय संविधान के अनुच्छेद 343 में संघ की राजभाषा हिंदी का उल्लेख है।',
  },
  {
    question: '‘हिंदी साहित्य का इतिहास’ के लेखक कौन हैं?',
    options: {
      A: 'प्रेमचंद',
      B: 'रामचंद्र शुक्ल',
      C: 'महादेवी वर्मा',
      D: 'जयशंकर प्रसाद',
    },
    correctAnswer: 'B',
    explanation: '‘हिंदी साहित्य का इतिहास’ के लेखक आचार्य रामचंद्र शुक्ल हैं।',
  },
  {
    question: '‘राष्ट्रकवि’ के नाम से किस प्रसिद्ध हिंदी कवि को जाना जाता है?',
    options: {
      A: 'मैथिलीशरण गुप्त',
      B: 'सुमित्रानंदन पंत',
      C: 'रामधारी सिंह ‘दिनकर’',
      D: 'निराला',
    },
    correctAnswer: 'C',
    explanation: 'रामधारी सिंह ‘दिनकर’ को राष्ट्रकवि के नाम से जाना जाता है।',
  },
  {
    question: 'हिंदी वर्णमाला में ‘अ’ क्या है?',
    options: {
      A: 'स्वर',
      B: 'व्यंजन',
      C: 'मात्रा',
      D: 'शब्द',
    },
    correctAnswer: 'A',
    explanation: '‘अ’ हिंदी वर्णमाला का प्रथम स्वर वर्ण है।',
  },
  {
    question: '‘फूल’ का बहुवचन क्या है?',
    options: {
      A: 'फूला',
      B: 'फूलों',
      C: 'फूल',
      D: 'फूली',
    },
    correctAnswer: 'C',
    explanation: '‘फूल’ शब्द का एकवचन और बहुवचन रूप सामान्यतः समान (फूल) रहता है।',
  },
  {
    question: '‘सुंदर’ शब्द किस प्रकार का विशेषण है?',
    options: {
      A: 'संख्यावाचक विशेषण',
      B: 'परिमाणवाचक विशेषण',
      C: 'गुणवाचक विशेषण',
      D: 'सार्वनामिक विशेषण',
    },
    correctAnswer: 'C',
    explanation: '‘सुंदर’ संज्ञा या सर्वनाम के गुण को प्रकट करता है, अतः यह गुणवाचक विशेषण है।',
  },
];

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    // 1. Ensure Subject exists (Hindi)
    let subject = await Subject.findOne({ name: { $regex: /^hindi$/i } });
    if (!subject) {
      subject = await Subject.create({ name: 'Hindi' });
      console.log('Created Subject:', subject.name);
    } else {
      console.log('Found Subject:', subject.name);
    }

    // 2. Clear previous questions/quizzes for this clean setup
    await Question.deleteMany({ subjectId: subject._id });
    await Quiz.deleteMany({ subjectId: subject._id });
    console.log('Cleaned old quizzes and questions for subject Hindi.');

    // 3. Create Hindi Quiz
    const quiz = await Quiz.create({
      name: 'Hindi Assessment',
      subjectId: subject._id,
      numberOfQuestions: hindiQuestions.length,
      timePerQuestion: 30,
      description: 'इस प्रश्नोत्तरी में हिंदी के राजभाषा बनने के इतिहास, हिंदी साहित्य तथा हिंदी व्याकरण से जुड़े रोचक और ज्ञानवर्धक प्रश्न शामिल हैं।',
      instructions: 'प्रत्येक प्रश्न को ध्यानपूर्वक पढ़ें और दिए गए विकल्पों में से सही उत्तर चुनें।\nसभी प्रश्नों के उत्तर देना अनिवार्य है।\nउत्तर चुनने के बाद ‘आगे बढ़ें’ बटन दबाकर आगे बढ़ें।\nसभी प्रश्न पूरे करने के बाद ‘जमा करें’ बटन पर क्लिक करें।\nक्विज़ पूरा होने के बाद अपना स्कोर/परिणाम देखें।',
      contactInfo: '+91 92174 78822',
      language: 'hi',
      status: 'Published',
      passingPercentage: 50,
    });
    console.log('Created Quiz:', quiz.name, 'with ID:', quiz._id);

    // 4. Create Questions
    const docs = hindiQuestions.map((q) => ({
      quizId: quiz._id,
      subjectId: subject._id,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
    }));

    const inserted = await Question.insertMany(docs);
    console.log(`Successfully inserted ${inserted.length} questions.`);

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
