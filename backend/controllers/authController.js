const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

// Helper to sync admin credentials from env → MongoDB (always runs on login)
async function syncAdminFromEnv() {
  const envUsername = (process.env.ADMIN_USERNAME || 'eduline').trim();
  const envPassword = (process.env.ADMIN_PASSWORD || 'Onisha@11022025').trim();

  // Find admin by current env username
  let admin = await Admin.findOne({ username: envUsername });

  if (admin) {
    // Username matches — check if password needs syncing
    if (admin.password !== envPassword &&
        !admin.password.startsWith('$2a$') &&
        !admin.password.startsWith('$2b$')) {
      admin.password = envPassword;
      await admin.save();
      console.log(`🔄 Admin password synced from env for: '${envUsername}'`);
    }
    return admin;
  }

  // No admin with env username found — delete all old admins and create fresh
  const oldAdmins = await Admin.find({});
  if (oldAdmins.length > 0) {
    await Admin.deleteMany({});
    console.log(`🗑️  Deleted ${oldAdmins.length} old admin record(s) to apply new credentials.`);
  }

  admin = await Admin.create({
    username: envUsername,
    password: envPassword,
    role: 'admin',
  });
  console.log(`✅ Admin created in MongoDB: '${envUsername}'`);
  return admin;
}

// @desc    Admin login (always syncs credentials from env → MongoDB first)
// @route   POST /api/auth/login
const loginAdmin = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required.',
      });
    }

    const trimmedUser = username.trim();
    const trimmedPass = password.trim();

    // Always sync env credentials to MongoDB first (this replaces old admin records)
    const admin = await syncAdminFromEnv();

    // Now check if the provided credentials match the synced admin
    let isMatch = false;

    if (admin && admin.username.toLowerCase() === trimmedUser.toLowerCase()) {
      // 1. Direct plain-text match
      if (admin.password === trimmedPass) {
        isMatch = true;
      }
      // 2. bcrypt hash match (if password was hashed)
      else if (admin.password.startsWith('$2a$') || admin.password.startsWith('$2b$')) {
        isMatch = await bcrypt.compare(trimmedPass, admin.password);
      }
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrative credentials.',
      });
    }

    const secret = process.env.JWT_SECRET || 'quiz_system_super_secure_jwt_secret_2026_x99y';
    const token = jwt.sign(
      { username: admin.username, role: 'admin' },
      secret,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Admin authentication successful',
      token,
      admin: {
        username: admin.username,
        role: 'admin',
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change admin password in MongoDB
// @route   POST /api/auth/change-password
const changePassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.trim().length < 4) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 4 characters.',
      });
    }

    const admin = (await Admin.findOne({ username: req.admin.username })) || (await Admin.findOne({}));
    if (admin) {
      admin.password = newPassword.trim();
      await admin.save();
      return res.status(200).json({
        success: true,
        message: 'Password successfully updated in MongoDB!',
      });
    }

    res.status(404).json({ success: false, message: 'Admin not found.' });
  } catch (err) {
    next(err);
  }
};

// @desc    Verify admin token
// @route   GET /api/auth/me
const getAdminProfile = async (req, res) => {
  res.status(200).json({
    success: true,
    admin: req.admin,
  });
};

module.exports = {
  loginAdmin,
  changePassword,
  getAdminProfile,
};
