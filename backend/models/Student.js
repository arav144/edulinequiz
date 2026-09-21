const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    studentIdentifier: {
      type: String,
      required: [true, 'Student Identifier is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
      default: '',
    },
    name: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    emailVerified: {
      type: Boolean,
      default: true,
    },
    mobileNumber: {
      type: String,
      trim: true,
      default: '',
    },
    schoolName: {
      type: String,
      required: [true, 'School name is required'],
      trim: true,
    },
    class: {
      type: String,
      required: [true, 'Class is required'],
      trim: true,
      enum: ['Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8'],
      index: true,
    },
    // className compatibility alias
    className: {
      type: String,
      trim: true,
      default: '',
    },
    dateOfBirth: {
      type: String,
      required: [true, 'Date of birth (DD/MM/YYYY) is required'],
      trim: true,
    },
    // dob compatibility alias
    dob: {
      type: String,
      trim: true,
      default: '',
    },
    gender: {
      type: String,
      required: [true, 'Gender is required'],
      enum: ['Male', 'Female', 'Other'],
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    pinCode: {
      type: String,
      required: [true, 'PIN Code is required'],
      trim: true,
    },
    previousQuizParticipation: {
      type: String,
      required: [true, 'Previous quiz participation response is required'],
      enum: ['Yes', 'No'],
    },
    // participatedEarlier compatibility alias
    participatedEarlier: {
      type: String,
      enum: ['Yes', 'No', ''],
      default: '',
    },
    section: {
      type: String,
      trim: true,
      default: 'A',
    },
    // PIN hash for email+PIN sign-in (securely hashed with bcrypt)
    pinHash: {
      type: String,
      default: null,
    },
    // Password hash alias for compatibility
    passwordHash: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to synchronize aliases
studentSchema.pre('save', function (next) {
  const fullName = `${this.firstName || ''} ${this.lastName || ''}`.trim();
  if (fullName) {
    this.name = fullName;
  }
  if (!this.className && this.class) {
    this.className = this.class;
  }
  if (!this.class && this.className) {
    this.class = this.className;
  }
  if (!this.dob && this.dateOfBirth) {
    this.dob = this.dateOfBirth;
  }
  if (!this.dateOfBirth && this.dob) {
    this.dateOfBirth = this.dob;
  }
  if (!this.participatedEarlier && this.previousQuizParticipation) {
    this.participatedEarlier = this.previousQuizParticipation;
  }
  if (!this.previousQuizParticipation && this.participatedEarlier) {
    this.previousQuizParticipation = this.participatedEarlier;
  }
  if (this.pinHash && !this.passwordHash) {
    this.passwordHash = this.pinHash;
  }
  if (this.passwordHash && !this.pinHash) {
    this.pinHash = this.passwordHash;
  }
  next();
});

module.exports = mongoose.models.Student || mongoose.model('Student', studentSchema);
