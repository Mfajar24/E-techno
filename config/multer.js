const multer = require('multer');
const path = require('path');

// Menentukan direktori penyimpanan file
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/uploads')); // Simpan di folder uploads
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)); // Nama file unik
    }
});

// Membatasi jenis file dan ukuran file
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Maksimal 10MB
    fileFilter: function (req, file, cb) {
        const fileTypes = /pdf|doc|docx|jpg|jpeg|png|mp4|mov|avi/;
        const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = fileTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Tipe file tidak diizinkan.'));
        }
    }
});

module.exports = upload;
