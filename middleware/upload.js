// middleware/upload.js
// Multer config for file uploads — separate configs for images vs documents

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Make sure the uploads folder exists
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueName = `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        cb(null, uniqueName);
    }
});

// =============== IMAGE UPLOAD (reports + news photos) ===============
const imageFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|gif/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mime = allowedTypes.test(file.mimetype);

    if (ext && mime) cb(null, true);
    else cb(new Error('Only images are allowed (JPG, PNG, WEBP, GIF)'));
};

const uploadImage = multer({
    storage,
    fileFilter: imageFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
});

// =============== DOCUMENT UPLOAD (admin service responses — ANY file) ===============
const uploadDocument = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10 MB for documents (PDFs can be larger)
});

// Default export = image upload (used by reports + news photos).
// `.document` named export is for service-request response files.
module.exports = uploadImage;
module.exports.document = uploadDocument;