/** Mọi ảnh của thiệp được chọn trong thư mục public/albums */
export const ALBUM_DIR = "/albums/";

const ALBUM_FILE = /^[\w.\- ]+\.(jpe?g|png|webp|avif|gif)$/i;

export const isAlbumFileName = (name: string) => ALBUM_FILE.test(name);

/** Đường dẫn dạng /albums/ten-anh.jpg */
export const isAlbumImage = (src: string) => src.startsWith(ALBUM_DIR) && isAlbumFileName(src.slice(ALBUM_DIR.length));

/** next/image làm sập trang nếu gặp ảnh ngoài các host khai báo trong next.config.ts */
const LEGACY_HOSTS = ["images.unsplash.com", "res.cloudinary.com"];

/** Ảnh hiển thị được: ảnh trong site, hoặc link cũ (lưu trước khi chuyển sang album) chưa được thay */
export function isAllowedImage(src: string) {
  if (/^\/[^/?]/.test(src)) return true;
  try {
    const url = new URL(src);
    return url.protocol === "https:" && LEGACY_HOSTS.includes(url.hostname);
  } catch {
    return false;
  }
}

/** Toàn bộ ảnh trong album theo thứ tự đã lưu ở admin; ảnh mới thêm vào thư mục xếp cuối */
export function orderedAlbum(album: string[], order: string[], gallery: string[]) {
  const inAlbum = new Set(album);
  const known = (order.length ? order : gallery).filter((src) => inAlbum.has(src));
  const seen = new Set(known);
  return [...known, ...album.filter((src) => !seen.has(src))];
}

/** Album đầy đủ cho khách: bộ ảnh đã chọn trước, sau đó là các ảnh còn lại */
export function fullAlbum(album: string[], order: string[], gallery: string[]) {
  const shown = new Set(gallery);
  return [...gallery, ...orderedAlbum(album, order, gallery).filter((src) => !shown.has(src))];
}

export const albumFileName =(src: string) => src.split("/").pop() ?? src;
