const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine upload path based on route
    let uploadPath = uploadsDir;
    const routePath = req.originalUrl || req.path || '';
    
    if (routePath.includes('/students/') && routePath.includes('/photo')) {
      uploadPath = path.join(uploadsDir, 'students');
    } else if (routePath.includes('/teachers/') && routePath.includes('/photo')) {
      uploadPath = path.join(uploadsDir, 'teachers');
    } else if (req.body.type) {
      uploadPath = path.join(uploadsDir, req.body.type);
    }
    
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

module.exports = upload;

