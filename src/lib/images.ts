/** next/image làm sập trang nếu gặp ảnh ngoài các host khai báo trong next.config.ts */
export const IMAGE_HOSTS = ["images.unsplash.com"];

/** Ảnh trong site (/images/ten-anh.jpg) hoặc link https từ host được phép */
export function isAllowedImage(src: string) {
  if (/^\/[^/?]/.test(src)) return true;
  try {
    const url = new URL(src);
    return url.protocol === "https:" && IMAGE_HOSTS.includes(url.hostname);
  } catch {
    return false;
  }
}
