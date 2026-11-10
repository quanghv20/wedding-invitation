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

Không có `DATABASE_URL` thì thiệp dùng nội dung mặc định, còn RSVP và lời chúc lưu vào `data/*.json`.
