import multer from "multer";
import path from "path";
import fs from "fs";

// Directory where uploaded company files will be stored
const uploadDir = "uploads/companies";

// Automatically create the folder structure if it doesn't exist
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * Configure Multer disk storage options:
 * - destination: Specifies the path to save files.
 * - filename: Generates a unique filename using timestamp, random number, and original file extension.
 */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        // Generate a 6-digit random number to prevent collision if files are uploaded simultaneously
        const randomNumber = Math.floor(100000 + Math.random() * 900000);
        const fileExt = path.extname(file.originalname).toLowerCase();
        
        // Output format: e.g., 1722948293-483920.png
        cb(null, `${timestamp}-${randomNumber}${fileExt}`);
    }
});

/**
 * File filter to reject non-image file uploads.
 * Only accepts: jpg, jpeg, png, webp.
 */
const fileFilter = (req, file, cb) => {
    // Allowed extensions
    const filetypes = /jpeg|jpg|png|webp/;
    
    // Check extension
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    // Check mime type
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        return cb(new Error("Only images of type jpeg, jpg, png, and webp are allowed!"), false);
    }
};

/**
 * Configure Multer limits:
 * - Max file size: 5MB (5 * 1024 * 1024 bytes)
 */
const limits = {
    fileSize: 5 * 1024 * 1024
};

// Create the reusable multer instance
const upload = multer({
    storage,
    fileFilter,
    limits
});

export default upload;
