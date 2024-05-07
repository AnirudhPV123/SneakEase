import multer from 'multer';

// Configure Multer storage settings
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/temp'); // Destination directory where files will be saved
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Use the original file name as the file name
  },
});

// Create Multer instance with configured storage
export const upload = multer({ storage });
