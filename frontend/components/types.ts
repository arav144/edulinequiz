export type Language = 'en' | 'hi';

export interface IQuizSummary {
  _id: string;
  name: string;
  subject?: string;
  subjectId?: string;
  numberOfQuestions: number;
  status: string;
  passingPercentage?: number;
  timePerQuestion?: number;
  description?: string;
  instructions?: string;
  contactInfo?: string;
  language?: Language;
  isPlayable: boolean;
  isAttempted: boolean;
  attemptResult?: {
    attemptId?: string;
    score: number;
    totalQuestions: number;
    percentage: number;
    result?: string;
    certificateId?: string;
    submittedAt: string;
  } | null;
}

export interface IQuestionItem {
  _id: string;
  questionNumber: number;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  imageUrl?: string;
  audioUrl?: string;
}

export interface IReviewItem {
  questionId: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  studentChoice: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface ISubmissionResult {
  attemptId: string;
  studentName: string;
  studentIdentifier: string;
  className?: string;
  section?: string;
  schoolName?: string;
  quizName: string;
  subject?: string;
  score: number;
  correctAnswers?: number;
  wrongAnswers?: number;
  totalQuestions: number;
  percentage: number;
  result: 'Pass' | 'Fail';
  passingPercentage?: number;
  certificateId?: string;
  submittedAt: string;
  review?: IReviewItem[];
}

// Translations Dictionary
export const TRANSLATIONS = {
  en: {
    portalTitle: 'Eduline Publishers',
    portalSubtitle: 'QUIZ MANAGEMENT SYSTEM',
    navHome: 'Home',
    navAbout: 'About Quiz',
    navInstructions: 'Instructions',
    navContact: 'Contact',
    formTitle: 'Register for Assessment',
    formSubtitle: 'Enter your academic credentials and begin your quiz.',
    nameLabel: 'Student Full Name *',
    namePlaceholder: 'e.g. Rahul Sharma',
    classLabel: 'Class *',
    selectClass: 'Select Class',
    sectionLabel: 'Section *',
    selectSection: 'Select Section',
    rollLabel: 'Roll Number *',
    rollPlaceholder: 'e.g. 24',
    subjectLabel: 'Subject *',
    selectSubject: 'Select Subject',
    schoolLabel: 'School / Institution Name *',
    schoolPlaceholder: 'e.g. ABC Public School',
    startQuizBtn: 'Proceed ➔',
    formFooterTag: 'A celebration of knowledge, language and academic excellence',
    heroTagline: 'Language, Heritage & Excellence',
    heroSubTagline: 'Comprehensive assessment on grammar, literature, and general knowledge.',
    topic1Title: 'Literature',
    topic1Desc: 'Masterpieces & Authors',
    topic2Title: 'Grammar',
    topic2Desc: 'Strong Linguistic Foundation',
    topic3Title: 'Idioms & Phrases',
    topic3Desc: 'Wisdom in Words',
    topic4Title: 'Fact File',
    topic4Desc: 'Fascinating Insights',
    statLearn: 'Learn',
    statParticipate: 'Participate',
    statExcel: 'Excel',
    quote: '"Language connects us all"',
    modalClose: 'Close',
    examTitle: 'Active Examination',
    questionCounter: 'Question',
    of: 'of',
    answered: 'Answered',
    timeRemaining: 'Time Remaining for this Question',
    lockedWarning: '⚠️ Locked once advanced (No back option)',
    nextBtn: 'Next Question',
    reviewSubmitBtn: 'Review & Submit',
    confirmSubmitTitle: 'Confirm Final Submission?',
    confirmSubmitDesc: 'Once submitted, your responses will be permanently evaluated.',
    goBackReview: 'Continue Quiz',
    confirmSubmitAction: 'Submit Examination',
    resultTitle: 'Assessment Submitted',
    resultCongrat: 'Congratulations',
    score: 'Score',
    correct: 'Correct',
    wrong: 'Wrong',
    result: 'Result',
    pass: 'Pass',
    fail: 'Fail',
    downloadResult: 'Download Result Card',
    downloadCert: 'Download Certificate',
    backToDashboard: 'Return to Assessment Portal',
    qReviewTitle: 'Question-by-Question Review',
    yourChoice: 'Your Choice:',
    correctKey: 'Correct Key:',
    unanswered: 'Unanswered',
  },
  hi: {
    portalTitle: 'Eduline Publishers',
    portalSubtitle: 'QUIZ MANAGEMENT SYSTEM',
    navHome: 'होम',
    navAbout: 'क्विज के बारे में',
    navInstructions: 'निर्देश',
    navContact: 'संपर्क',
    formTitle: 'प्रतियोगिता के लिए पंजीकरण करें',
    formSubtitle: 'अपने विवरण भरें और प्रतियोगिता के लिए पंजीकरण करें।',
    nameLabel: 'छात्र का नाम *',
    namePlaceholder: 'जैसे - राहुल शर्मा',
    classLabel: 'कक्षा *',
    selectClass: 'कक्षा चुनें',
    sectionLabel: 'सेक्शन *',
    selectSection: 'सेक्शन चुनें',
    rollLabel: 'रोल नंबर *',
    rollPlaceholder: 'जैसे - 24',
    subjectLabel: 'विषय *',
    selectSubject: 'विषय चुनें',
    schoolLabel: 'विद्यालय का नाम *',
    schoolPlaceholder: 'जैसे - एबीसी पब्लिक स्कूल',
    startQuizBtn: 'आगे बढ़ें ➔',
    formFooterTag: 'ज्ञान, भाषा और संस्कृति का उत्सव',
    heroTagline: 'अपनी भाषा, अपनी पहचान',
    heroSubTagline: 'हिंदी भाषा, साहित्य, व्याकरण और संस्कृति पर रोचक प्रश्नोत्तरी।',
    topic1Title: 'साहित्य',
    topic1Desc: 'महान रचनाएँ और लेखक',
    topic2Title: 'व्याकरण',
    topic2Desc: 'भाषा की मजबूत नींव',
    topic3Title: 'मुहावरे',
    topic3Desc: 'शब्दों में छिपी समझ',
    topic4Title: 'रोचक तथ्य',
    topic4Desc: 'हिंदी से जुड़ी रोचक जानकारियाँ',
    statLearn: 'सीखें',
    statParticipate: 'भाग लें',
    statExcel: 'आगे बढ़ें',
    quote: '"हिंदी हम सबको जोड़ती है"',
    modalClose: 'बंद करें',
    examTitle: 'सक्रिय प्रश्नोत्तरी',
    questionCounter: 'प्रश्न संख्या',
    of: 'में से',
    answered: 'उत्तर दिए गए',
    timeRemaining: 'इस प्रश्न के लिए शेष समय',
    lockedWarning: '⚠️ आगे बढ़ने पर पिछला प्रश्न लॉक हो जाता है (पीछे नहीं जा सकते)',
    nextBtn: 'आगे बढ़ें',
    reviewSubmitBtn: 'जमा करें',
    confirmSubmitTitle: 'क्या आप क्विज़ सबमिट करना चाहते हैं?',
    confirmSubmitDesc: 'सबमिट करने के बाद आपकी परीक्षा का मूल्यांकन कर परिणाम घोषित किया जाएगा।',
    goBackReview: 'क्विज़ जारी रखें',
    confirmSubmitAction: 'पुष्टि करें एवं जमा करें',
    resultTitle: 'प्रश्नोत्तरी परिणाम',
    resultCongrat: 'बधाई हो',
    score: 'प्राप्तांक',
    correct: 'सही उत्तर',
    wrong: 'गलत उत्तर',
    result: 'परिणाम',
    pass: 'उत्तीर्ण (Pass)',
    fail: 'अनुत्तीर्ण (Fail)',
    downloadResult: 'परिणाम पत्रक (Result) डाउनलोड करें',
    downloadCert: 'प्रमाणपत्र (Certificate) डाउनलोड करें',
    backToDashboard: 'मुख्य पृष्ठ पर वापस जाएँ',
    qReviewTitle: 'प्रश्नों की समीक्षा (Answer Review)',
    yourChoice: 'आपका उत्तर:',
    correctKey: 'सही उत्तर:',
    unanswered: 'अनुत्तरित',
  },
};

// Map option keys (A, B, C, D) to (क, ख, ग, घ) for Hindi
export const getOptionLabel = (key: string, isHindi: boolean): string => {
  if (!key) return '';
  if (isHindi) {
    const hindiMap: Record<string, string> = {
      A: 'क',
      B: 'ख',
      C: 'ग',
      D: 'घ',
    };
    return hindiMap[key.toUpperCase()] || key;
  }
  return key;
};
