/**
 * Tạo ảnh cho web từ ảnh gốc: albums-original/*.jpg → public/albums/*.jpg (giữ nguyên tên file).
 * Ảnh gốc từ máy ảnh 13–24MB mỗi tấm, thiệp chỉ cần tối đa ~2000px; bản web cạnh dài 2560px.
 * Chạy: node scripts/optimize-albums.cjs
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const SRC = path.join(__dirname, "..", "albums-original");
const OUT = path.join(__dirname, "..", "public", "albums");
const MAX = 2560;

(async () => {
  const files = fs.readdirSync(SRC).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
  let before = 0;
  let after = 0;
  for (const file of files) {
    const src = path.join(SRC, file);
    const out = path.join(OUT, file.replace(/\.(png|webp)$/i, ".jpg"));
    await sharp(src)
      .rotate() // xoay theo EXIF rồi bỏ metadata
      .resize(MAX, MAX, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true, progressive: true })
      .toFile(out + ".tmp");
    fs.renameSync(out + ".tmp", out);
    before += fs.statSync(src).size;
    after += fs.statSync(out).size;
  }
  const mb = (n) => (n / 1024 / 1024).toFixed(1) + "MB";
  console.log(`${files.length} ảnh: ${mb(before)} → ${mb(after)}`);
})();
