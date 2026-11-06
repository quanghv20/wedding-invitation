# 💍 Thiệp mời cưới online

Next.js 16 · Tailwind CSS 4 · Motion · Lenis

## Chạy

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## Tùy chỉnh

Toàn bộ nội dung (tên, ngày giờ, địa điểm, ảnh, câu chuyện, tài khoản ngân hàng) nằm trong **`src/config/wedding.ts`**.

- **Ảnh**: bỏ ảnh vào `public/images/` rồi dùng đường dẫn `"/images/ten-anh.jpg"`.
- **Nhạc nền**: bỏ file vào `public/music/wedding.mp3` (hoặc sửa `music`). Không có file thì nút nhạc tự ẩn.
- **Thiệp riêng cho từng khách**: thêm `?to=` vào link, ví dụ `/?to=Anh Nam & Chị Lan`.
- **Mã QR mừng cưới**: tự sinh qua VietQR từ `bankId` + `accountNo`.

## Dữ liệu RSVP & lời chúc

Được lưu vào `data/rsvp.json` và `data/wishes.json`. Cách này chạy tốt trên VPS. Nếu deploy lên Vercel
(filesystem chỉ đọc), hãy thay `src/lib/store.ts` bằng một database (Supabase, Firebase...).
