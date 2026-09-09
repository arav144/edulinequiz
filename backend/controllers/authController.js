const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

// Helper to get or create admin in MongoDB
async function getOrCreateAdmin() {
  const envUsername = (process.env.ADMIN_USERNAME || 'admin').trim();
  const envPassword = (process.env.ADMIN_PASSWORD || 'admin123').trim();

  let admin = await Admin.findOne({ username: envUsername });
  if (!admin) {
    admin = await Admin.findOne({});
    if (!admin) {
      admin = await Admin.create({
        username: envUsername,
        password: envPassword,
        role: 'admin',
      });
      console.log(`👤 Initial Admin created in MongoDB: '${admin.username}'`);
    }
  }
  return admin;
}

// @desc    Admin login (reads from MongoDB first, allowing direct DB password edits)
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

    // Check MongoDB for admin
    let admin = await Admin.findOne({ username: trimmedUser });
    if (!admin) {
      admin = await getOrCreateAdmin();
    }

    let isMatch = false;

    if (admin && admin.username.toLowerCase() === trimmedUser.toLowerCase()) {
      // 1. Direct plain-text match (allows user to easily change password in MongoDB Atlas GUI)
      if (admin.password === trimmedPass) {
        isMatch = true;
      }
      // 2. Or bcrypt hash match (if hashed in MongoDB)
      else if (admin.password.startsWith('$2a$') || admin.password.startsWith('$2b$')) {
        isMatch = await bcrypt.compare(trimmedPass, admin.password);
      }
    }

    // Fallback: If DB didn't match, check .env
    if (!isMatch) {
      const expectedUser = (process.env.ADMIN_USERNAME || 'admin').trim();
      const expectedPass = (process.env.ADMIN_PASSWORD || 'admin123').trim();
      if (trimmedUser === expectedUser && trimmedPass === expectedPass) {
        isMatch = true;
        // Sync to MongoDB if not present
        if (!admin) {
          await Admin.create({ username: expectedUser, password: expectedPass, role: 'admin' });
        }
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
      { username: admin ? admin.username : trimmedUser, role: 'admin' },
      secret,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Admin authentication successful',
      token,
      admin: {
        username: admin ? admin.username : trimmedUser,
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
