import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directories exist
const ensureUploadsDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Create separate directories
const customerPhotosDir = path.join(__dirname, '../uploads/customer-photos');
const aadharPhotosDir = path.join(__dirname, '../uploads/aadhar-photos');
const tempDir = path.join(__dirname, '../uploads/temp');

ensureUploadsDir(customerPhotosDir);
ensureUploadsDir(aadharPhotosDir);
ensureUploadsDir(tempDir);

// Configure storage for temporary files first
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // First save to temp directory
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, JPG, PNG, WEBP) are allowed!'), false);
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 3 // Maximum 3 files
  },
  fileFilter: fileFilter
});

// Specific middleware for customer file uploads
export const uploadMiddleware = upload.fields([
  { name: 'aadharFront', maxCount: 1 },
  { name: 'aadharBack', maxCount: 1 },
  { name: 'customerPhoto', maxCount: 1 }
]);

// Helper function to delete files
export const deleteFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// Helper function to move file from temp to final location
export const moveFileToFinalLocation = (tempFilePath, customerId, fieldName) => {
  if (!tempFilePath || !fs.existsSync(tempFilePath)) return null;

  const filename = path.basename(tempFilePath);
  const extension = path.extname(filename);
  const newFilename = `${customerId}-${fieldName}${extension}`;

  let finalDir;
  let finalPath;
  let finalUrl;

  if (fieldName === 'customerPhoto') {
    finalDir = customerPhotosDir;
    finalPath = path.join(finalDir, newFilename);
    finalUrl = `/uploads/customer-photos/${newFilename}`;
  } else if (fieldName === 'aadharFront' || fieldName === 'aadharBack') {
    finalDir = aadharPhotosDir;
    finalPath = path.join(finalDir, newFilename);
    finalUrl = `/uploads/aadhar-photos/${newFilename}`;
  } else {
    return null;
  }

  // Move file from temp to final location
  fs.renameSync(tempFilePath, finalPath);

  return finalUrl;
};

// Helper function to get file path from URL
export const getFilePathFromUrl = (url) => {
  if (!url) return null;

  if (url.includes('/uploads/')) {
    const filename = path.basename(url);

    if (url.includes('customer-photos')) {
      return path.join(customerPhotosDir, filename);
    } else if (url.includes('aadhar-photos')) {
      return path.join(aadharPhotosDir, filename);
    } else if (url.includes('temp')) {
      return path.join(tempDir, filename);
    }
  }

  return null;
};

// Helper to get file URL from customerId and fieldName
export const getFileUrl = (customerId, fieldName) => {
  if (!customerId || !fieldName) return null;

  const extensions = ['.jpg', '.jpeg', '.png', '.webp'];

  for (const ext of extensions) {
    const filename = `${customerId}-${fieldName}${ext}`;

    if (fieldName === 'customerPhoto') {
      const filePath = path.join(customerPhotosDir, filename);
      if (fs.existsSync(filePath)) {
        return `/uploads/customer-photos/${filename}`;
      }
    } else if (fieldName === 'aadharFront' || fieldName === 'aadharBack') {
      const filePath = path.join(aadharPhotosDir, filename);
      if (fs.existsSync(filePath)) {
        return `/uploads/aadhar-photos/${filename}`;
      }
    }
  }

  return null;
};

// Clean up temp files older than 1 hour
export const cleanTempFiles = () => {
  const files = fs.readdirSync(tempDir);
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;

  files.forEach(file => {
    const filePath = path.join(tempDir, file);
    const stats = fs.statSync(filePath);

    if (now - stats.mtimeMs > oneHour) {
      fs.unlinkSync(filePath);
    }
  });
};