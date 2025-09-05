import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directories exist
const ensureuploadslraDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const customerPhotosDir = path.join(__dirname, '../uploadslra/customer-photos');
const aadharPhotosDir = path.join(__dirname, '../uploadslra/aadhar-photos');
const tempDir = path.join(__dirname, '../uploadslra/temp');

ensureuploadslraDir(customerPhotosDir);
ensureuploadslraDir(aadharPhotosDir);
ensureuploadslraDir(tempDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

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

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 3
  },
  fileFilter: fileFilter
});

export const uploadMiddleware = upload.fields([
  { name: 'aadharFront', maxCount: 1 },
  { name: 'aadharBack', maxCount: 1 },
  { name: 'customerPhoto', maxCount: 1 }
]);

export const deleteFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

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
    finalUrl = `/uploadslra/customer-photos/${newFilename}`;
  } else if (fieldName === 'aadharFront' || fieldName === 'aadharBack') {
    finalDir = aadharPhotosDir;
    finalPath = path.join(finalDir, newFilename);
    finalUrl = `/uploadslra/aadhar-photos/${newFilename}`;
  } else {
    return null;
  }

  fs.renameSync(tempFilePath, finalPath);
  return finalUrl;
};

export const getFilePathFromUrl = (url) => {
  if (!url) return null;

  if (url.includes('/uploadslra/')) {
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

export const getFileUrl = (customerId, fieldName) => {
  if (!customerId || !fieldName) return null;

  const extensions = ['.jpg', '.jpeg', '.png', '.webp'];

  for (const ext of extensions) {
    const filename = `${customerId}-${fieldName}${ext}`;

    if (fieldName === 'customerPhoto') {
      const filePath = path.join(customerPhotosDir, filename);
      if (fs.existsSync(filePath)) {
        return `/uploadslra/customer-photos/${filename}`;
      }
    } else if (fieldName === 'aadharFront' || fieldName === 'aadharBack') {
      const filePath = path.join(aadharPhotosDir, filename);
      if (fs.existsSync(filePath)) {
        return `/uploadslra/aadhar-photos/${filename}`;
      }
    }
  }

  return null;
};

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