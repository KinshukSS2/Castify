import multer from "multer";
import path from "path";
import fs from "fs";

const tempDir = path.join(process.cwd(), "public", "temp");

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
  fileFilter: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();

    // ✅ Allowed video and image extensions
    const allowed = [".mp4", ".mov", ".mkv", ".avi", ".webm", ".jpg", ".jpeg", ".png", ".gif", ".webp"];
    if (!allowed.includes(ext)) {
      return cb(new Error("Only video and image files are allowed"));
    }

    cb(null, true);
  }
});

