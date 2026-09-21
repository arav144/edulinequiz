const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const Student = require('../models/Student');
const Attempt = require('../models/Attempt');
const Quiz = require('../models/Quiz');

const JWT_SECRET = process.env.JWT_SECRET || 'quiz_system_super_secure_jwt_secret_2026_x99y';

// Helper to sync admin credentials from env → MongoDB
async function syncAdminFromEnv() {
  const envUsername = (process.env.ADMIN_USERNAME || 'eduline').trim();
  const envPassword = (process.env.ADMIN_PASSWORD || 'Onisha@11022025').trim();

  let admin = await Admin.findOne({ username: envUsername });
  if (admin) {
    if (admin.password !== envPassword && !admin.password.startsWith('$2a$') && !admin.password.startsWith('$2b$')) {
      admin.password = envPassword;
      await admin.save();
    }
    return admin;
  }

  await Admin.deleteMany({});
  admin = await Admin.create({
    username: envUsername,
    password: envPassword,
    role: 'admin',
  });
  return admin;
}

// ─── ADMIN AUTHENTICATION ───────────────────────────────────────────────────

const loginAdmin = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    const trimmedUser = username.trim();
    const trimmedPass = password.trim();
    const admin = await syncAdminFromEnv();

    let isMatch = false;
    if (admin && admin.username.toLowerCase() === trimmedUser.toLowerCase()) {
      if (admin.password === trimmedPass) {
        isMatch = true;
      } else if (admin.password.startsWith('$2a$') || admin.password.startsWith('$2b$')) {
        isMatch = await bcrypt.compare(trimmedPass, admin.password);
      }
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid administrative credentials.' });
    }

    const token = jwt.sign(
      { username: admin.username, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Admin authentication successful',
      token,
      admin: { username: admin.username, role: 'admin' },
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.trim().length < 4) {
      return res.status(400).json({ success: false, message: 'New password must be at least 4 characters.' });
    }

    const admin = (await Admin.findOne({ username: req.admin.username })) || (await Admin.findOne({}));
    if (admin) {
      admin.password = newPassword.trim();
      await admin.save();
      return res.status(200).json({ success: true, message: 'Password successfully updated in MongoDB!' });
    }
    res.status(404).json({ success: false, message: 'Admin not found.' });
  } catch (err) {
    next(err);
  }
};

const getAdminProfile = async (req, res) => {
  res.status(200).json({ success: true, admin: req.admin });
};

// ─── STUDENT EMAIL + PIN AUTHENTICATION SYSTEM (NO OTP) ──────────────────────

// @desc    Check whether an email address has a registered student account
// @route   POST /api/auth/check-email
const checkStudentEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'A valid email address is required.' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const student = await Student.findOne({ email: cleanEmail });
    return res.status(200).json({
      success: true,
      exists: !!student,
      isRegistered: !!student,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Register a new student with Email + PIN (direct registration, no OTP)
// @route   POST /api/auth/register
const registerStudent = async (req, res, next) => {
  try {
    const {
      email,
      pin,
      confirmPin,
      createPin,
      password,
      firstName,
      lastName,
      mobileNumber,
      schoolName,
      class: classNameInput,
      dateOfBirth,
      gender,
      state,
      address,
      pinCode,
      previousQuizParticipation,
    } = req.body;

    // 1. Email validation & duplicate check
    if (!email || typeof email !== 'string' || !email.includes('@') || !email.includes('.')) {
      return res.status(400).json({ success: false, message: 'A valid email address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingStudent = await Student.findOne({ email: cleanEmail });
    if (existingStudent) {
      return res.status(409).json({
        success: false,
        message: 'This email is already registered. Please sign in.',
      });
    }

    // 2. PIN validation
    const userPin = String(pin || createPin || password || '').trim();
    const userConfirmPin = String(confirmPin || '').trim();

    if (!userPin || userPin.length < 4) {
      return res.status(400).json({
        success: false,
        message: 'Please create a secure PIN (minimum 4 characters/digits).',
      });
    }

    if (userConfirmPin && userPin !== userConfirmPin) {
      return res.status(400).json({
        success: false,
        message: 'Confirm PIN does not match. Please ensure both PIN entries are identical.',
      });
    }

    // 3. Field Validations
    if (!firstName || !firstName.trim() || firstName.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Valid First Name is required (minimum 2 characters).' });
    }
    if (!lastName || !lastName.trim() || lastName.trim().length < 1) {
      return res.status(400).json({ success: false, message: 'Last Name is required.' });
    }

    const cleanMobile = String(mobileNumber || '').trim().replace(/\D/g, '');
    const effectiveMobile = cleanMobile.length === 10 ? cleanMobile : '';

    if (!schoolName || !schoolName.trim() || schoolName.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Name of School is required.' });
    }

    let chosenClass = String(classNameInput || req.body.className || '').trim();
    if (/^[3-8]$/.test(chosenClass)) {
      chosenClass = `Class ${chosenClass}`;
    }

    const validClasses = ['Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8'];
    if (!chosenClass || !validClasses.includes(chosenClass)) {
      return res.status(400).json({
        success: false,
        message: `Class must be one of: ${validClasses.join(', ')}.`,
      });
    }

    let cleanDob = (dateOfBirth || req.body.dob || '').trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDob)) {
      const [y, m, d] = cleanDob.split('-');
      cleanDob = `${d}/${m}/${y}`;
    }
    if (!cleanDob || !/^\d{2}\/\d{2}\/\d{4}$/.test(cleanDob)) {
      return res.status(400).json({ success: false, message: 'Date of Birth is required in DD/MM/YYYY format.' });
    }

    const validGenders = ['Male', 'Female', 'Other'];
    if (!gender || !validGenders.includes(gender)) {
      return res.status(400).json({ success: false, message: 'Gender must be Male, Female, or Other.' });
    }

    if (!state || !state.trim()) {
      return res.status(400).json({ success: false, message: 'State selection is required.' });
    }

    const cleanAddr = String(address || req.body.address || '').trim();
    if (!cleanAddr) {
      return res.status(400).json({ success: false, message: 'Address is required.' });
    }

    const cleanPin = String(pinCode || '').trim().replace(/\D/g, '');
    if (!cleanPin || cleanPin.length !== 6) {
      return res.status(400).json({ success: false, message: 'Valid 6-digit Pin Code is required.' });
    }

    const rawPart = previousQuizParticipation !== undefined ? previousQuizParticipation : req.body.participatedEarlier;
    const isYes = rawPart === true || String(rawPart).toLowerCase() === 'yes';
    const isNo = rawPart === false || String(rawPart).toLowerCase() === 'no';
    if (!isYes && !isNo) {
      return res.status(400).json({
        success: false,
        message: "Please indicate whether you participated in Eduline Publishers' previous quiz (Yes/No).",
      });
    }

    // 4. Secure PIN Hashing with bcrypt
    const pinHash = await bcrypt.hash(userPin, 10);

    // 5. Create Student record
    const studentIdentifier = `EDU-${cleanEmail.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    const student = await Student.create({
      studentIdentifier,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      name: fullName,
      email: cleanEmail,
      emailVerified: true,
      mobileNumber: effectiveMobile,
      schoolName: schoolName.trim(),
      class: chosenClass,
      className: chosenClass,
      dateOfBirth: cleanDob,
      dob: cleanDob,
      gender,
      state: state.trim(),
      address: cleanAddr,
      pinCode: cleanPin,
      previousQuizParticipation: isYes ? 'Yes' : 'No',
      participatedEarlier: isYes ? 'Yes' : 'No',
      pinHash,
      passwordHash: pinHash,
    });

    // 6. Sign JWT token for automatic login
    const token = jwt.sign(
      { studentId: student._id, email: student.email, class: student.class },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Strip sensitive hashes before returning
    const studentObj = student.toObject();
    delete studentObj.pinHash;
    delete studentObj.passwordHash;

    res.status(201).json({
      success: true,
      message: 'Account Created Successfully',
      token,
      student: studentObj,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Sign in student using Email + PIN (No OTP)
// @route   POST /api/auth/student-login
const loginStudent = async (req, res, next) => {
  try {
    const { email, pin, password } = req.body;
    const cleanEmail = String(email || '').trim().toLowerCase();
    const userPin = String(pin || password || '').trim();

    if (!cleanEmail || !userPin) {
      return res.status(400).json({
        success: false,
        message: 'Email ID and PIN are required.',
      });
    }

    // Check if account exists
    const student = await Student.findOne({ email: cleanEmail });
    if (!student) {
      return res.status(404).json({
        success: false,
        errorCode: 'ACCOUNT_NOT_FOUND',
        message: 'Account Not Found. Please register first to continue.',
      });
    }

    // Validate PIN
    const storedHash = student.pinHash || student.passwordHash;
    if (!storedHash) {
      return res.status(401).json({
        success: false,
        errorCode: 'INCORRECT_PIN',
        message: 'Incorrect PIN. Please try again.',
      });
    }

    const isMatch = await bcrypt.compare(userPin, storedHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        errorCode: 'INCORRECT_PIN',
        message: 'Incorrect PIN. Please try again.',
      });
    }

    // Authentication successful — generate session token
    const token = jwt.sign(
      { studentId: student._id, email: student.email, class: student.class },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const studentObj = student.toObject();
    delete studentObj.pinHash;
    delete studentObj.passwordHash;

    return res.status(200).json({
      success: true,
      message: 'Sign in successful!',
      token,
      student: studentObj,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get authenticated student profile
// @route   GET /api/auth/me
const getStudentProfile = async (req, res) => {
  res.status(200).json({
    success: true,
    student: req.student,
  });
};

// @desc    Get all quiz attempts for the authenticated student
// @route   GET /api/auth/my-attempts
const getMyAttempts = async (req, res, next) => {
  try {
    const studentId = req.student?._id;
    if (!studentId) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const attempts = await Attempt.find({ studentId })
      .populate('quizId', 'name subject bannerUrl targetClass')
      .sort({ submittedAt: -1 })
      .lean();

    const formatted = attempts.map((a) => ({
      attemptId: a._id,
      quizId: a.quizId?._id || a.quizId,
      quizName: a.quizId?.name || 'Quiz',
      quizBannerUrl: a.quizId?.bannerUrl || null,
      targetClass: a.quizId?.targetClass || '',
      score: a.score,
      totalQuestions: a.totalQuestions,
      percentage: a.percentage,
      result: a.result,
      certificateId: a.certificateId,
      submittedAt: a.submittedAt,
    }));

    res.status(200).json({ success: true, attempts: formatted, total: formatted.length });
  } catch (err) {
    next(err);
  }
};

// @desc    Update student profile
// @route   PUT /api/auth/profile
const updateStudentProfile = async (req, res, next) => {
  try {
    const studentId = req.student?._id;
    if (!studentId) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const {
      firstName,
      lastName,
      mobileNumber,
      schoolName,
      className,
      class: studentClass,
      dateOfBirth,
      dob,
      gender,
      state,
      address,
      pinCode,
      previousQuizParticipation,
      participatedEarlier,
    } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    // Update fields (except email and studentIdentifier which remain unchanged)
    if (firstName) student.firstName = firstName.trim();
    if (lastName) student.lastName = lastName.trim();
    student.name = `${student.firstName || ''} ${student.lastName || ''}`.trim();

    if (mobileNumber !== undefined) student.mobileNumber = mobileNumber;
    if (schoolName) student.schoolName = schoolName.trim();
    if (className || studentClass) student.class = (className || studentClass).trim();
    if (dateOfBirth || dob) student.dateOfBirth = (dateOfBirth || dob).trim();
    if (gender) student.gender = gender;
    if (state) student.state = state;
    if (address !== undefined) student.address = address.trim();
    if (pinCode) student.pinCode = pinCode.trim();
    if (previousQuizParticipation || participatedEarlier) {
      student.previousQuizParticipation = previousQuizParticipation || participatedEarlier;
    }

    await student.save();

    // Also update existing attempts with the new name and school/class if changed
    try {
      await Attempt.updateMany(
        { studentId: student._id },
        {
          $set: {
            studentName: student.name,
            className: student.class,
            schoolName: student.schoolName,
          },
        }
      );
    } catch (e) {
      console.warn('Attempt records name update notice:', e.message);
    }

    const studentObj = student.toObject();
    delete studentObj.pinHash;
    delete studentObj.passwordHash;

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      student: studentObj,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  loginAdmin,
  changePassword,
  getAdminProfile,
  registerStudent,
  checkStudentEmail,
  loginStudent,
  getStudentProfile,
  getMyAttempts,
  updateStudentProfile,
};
