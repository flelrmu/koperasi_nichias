const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads/profiles directory exists
const uploadDir = path.join(__dirname, '../uploads/profiles');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Setup storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `profile-${uniqueSuffix}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Format file tidak didukung. Harap upload gambar (JPEG, PNG, WebP).'), false);
  }
};

// Config multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2 MB limit
  },
  fileFilter: fileFilter
});

module.exports = upload;
