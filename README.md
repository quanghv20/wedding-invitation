# 💍 Thiệp mời cưới online

Next.js 16 · Tailwind CSS 4 · Motion · Lenis

## Chạy

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## Tùy chỉnh

Toàn bộ nội dung (tên, ngày giờ, địa điểm, ảnh, câu chuyện, tài khoản ngân hàng) nằm trong database và được sửa ở trang **`/admin`**. `src/config/wedding.ts` chỉ là nội dung mặc định.

- **Ảnh**: bỏ ảnh vào `public/images/` rồi dùng đường dẫn `"/images/ten-anh.jpg"`.
- **Nhạc nền**: bỏ file vào `public/music/wedding.mp3` (hoặc sửa `music`). Không có file thì nút nhạc tự ẩn.
- **Thiệp riêng cho từng khách**: thêm `?to=` vào link, ví dụ `/?to=Anh Nam & Chị Lan`.
- **Mã QR mừng cưới**: tự sinh qua VietQR từ `bankId` + `accountNo`.

## Database & trang admin

Nội dung, tài khoản admin, RSVP và lời chúc nằm trong bảng `wedding_data` (PostgreSQL, `key` → `value` jsonb).

- Biến môi trường (`DATABASE_URL`, `CLOUDINARY_*`) nằm trong file `.env` đã commit sẵn trong repo; chạy trên máy hay Docker đều đọc file này.
- Ảnh tải lên từ trang admin được lưu trên Cloudinary (thư mục `CLOUDINARY_FOLDER`).
- `npm run db:setup`: tạo bảng, nội dung ban đầu và tài khoản admin (mật khẩu in ra một lần).
- `npm run db:setup -- <tài-khoản> <mật-khẩu>`: đổi tài khoản và mật khẩu admin.

### Sao lưu & khôi phục

- Server production tự backup **full database** (mọi bảng: cấu trúc cột + toàn bộ dữ liệu) vào đầu mỗi giờ và gửi file `.json.gz` tới `BACKUP_EMAIL_TO` qua SMTP trong `.env`.
- Trang admin > biểu tượng database: tải backup ngay, gửi mail ngay, hoặc **khôi phục bằng cách upload file backup** (xem trước rồi mới ghi; bản hiện tại được gửi mail trước khi ghi đè).
- `npm run db:backup` lưu một file vào `backups/` (thêm `--mail` để gửi mail luôn).
- `npm run db:restore -- <file>` xem tóm tắt file; thêm `--yes` để khôi phục thật (bản hiện tại được lưu vào `backups/` trước). Khôi phục chạy trong một transaction: lỗi giữa chừng thì database giữ nguyên.
- File backup là JSON gzip: `{ format, version, createdAt, database, tables: [{ name, columns, primaryKey, rowCount, rows }] }`, bảng `wedding_data` chứa các key `content`, `admin`, `guests`, `rsvp`, `wishes`.

Không có `DATABASE_URL` thì thiệp dùng nội dung mặc định, còn RSVP và lời chúc lưu vào `data/*.json`.
