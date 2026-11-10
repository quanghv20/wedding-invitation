import { createHash } from "crypto";

/**
 * Upload ảnh lên Cloudinary qua REST API có ký (không cần SDK), giống cách làm bên OwlZen.
 * https://cloudinary.com/documentation/authentication_signatures
 *
 * Đọc CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_FOLDER trong file .env.
 */
const config = () => ({
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_API_KEY,
  apiSecret: process.env.CLOUDINARY_API_SECRET,
  folder: process.env.CLOUDINARY_FOLDER || "wedding-invitation",
});

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export class UploadError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}

/** Kiểm tra ảnh rồi đưa lên Cloudinary, trả về link https */
export async function uploadImage(file: FormDataEntryValue | null) {
  if (!file || typeof file === "string") throw new UploadError("Hãy chọn một ảnh");
  if (!IMAGE_TYPES.has(file.type)) throw new UploadError("Chỉ nhận ảnh JPG, PNG, WebP hoặc GIF");
  if (file.size > MAX_IMAGE_BYTES) throw new UploadError("Ảnh phải nhỏ hơn 10 MB");

  const { cloudName, apiKey, apiSecret, folder } = config();
  if (!cloudName || !apiKey || !apiSecret) throw new UploadError("Server chưa cấu hình Cloudinary (thiếu biến CLOUDINARY_* trong .env)", 503);
  // Các tham số được ký: sắp theo tên, nối dạng a=1&b=2 rồi băm SHA-1 cùng API secret
  const params: Record<string, string> = { folder, timestamp: String(Math.floor(Date.now() / 1000)) };
  const toSign = Object.keys(params)
    .sort()
    .map((name) => `${name}=${params[name]}`)
    .join("&");

  const form = new FormData();
  for (const [name, value] of Object.entries(params)) form.append(name, value);
  form.append("api_key", apiKey);
  form.append("signature", createHash("sha1").update(toSign + apiSecret).digest("hex"));
  form.append("file", file);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: form });
  const body = (await response.json().catch(() => ({}))) as { secure_url?: string; error?: { message?: string } };
  if (!response.ok || !body.secure_url) {
    console.error("[cloudinary] upload failed:", response.status, body.error?.message);
    throw new UploadError("Không tải ảnh lên được, thử lại sau", 502);
  }
  return body.secure_url;
}
