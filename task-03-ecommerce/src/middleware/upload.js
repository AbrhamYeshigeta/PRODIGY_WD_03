// src/middleware/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_ROOT = path.join(__dirname, '../../public/uploads');

['documents', 'offers', 'avatars'].forEach((sub) => {
  const dir = path.join(UPLOAD_ROOT, sub);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    const sub = file.fieldname === 'photo' || file.fieldname === 'photos'
      ? 'offers'
      : file.fieldname === 'avatar'
        ? 'avatars'
        : 'documents';
    cb(null, path.join(UPLOAD_ROOT, sub));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = /jpeg|jpg|png|pdf/;
  const ok = allowed.test(path.extname(file.originalname).toLowerCase())
    && allowed.test(file.mimetype);
  ok ? cb(null, true) : cb(new Error('Only JPG, PNG or PDF allowed'));
};

const limits = { fileSize: 5 * 1024 * 1024 };

const upload = multer({ storage, fileFilter, limits });

upload.documents = upload.fields([
  { name: 'license', maxCount: 1 },
  { name: 'nationalId', maxCount: 1 },
]);
upload.offerPhotos = upload.array('photos', 4);
upload.avatar = upload.single('avatar');

module.exports = upload;
