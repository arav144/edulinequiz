const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'ulk2jofl',
  api_key: process.env.CLOUDINARY_API_KEY || '284442367654776',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'lFeMLiQ4Vp5Xo-utWM3EwFvuPmg',
  secure: true,
});

module.exports = cloudinary;
