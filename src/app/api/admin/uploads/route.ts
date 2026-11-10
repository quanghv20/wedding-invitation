import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/auth";
import { UploadError, uploadImage } from "@/lib/cloudinary";
import { hasDatabase } from "@/lib/db";

/** Upload ảnh (multipart, trường "file") lên Cloudinary, trả về { url } */
export async function POST(request: NextRequest) {
  if (!hasDatabase() || !(await isAdmin(request))) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  try {
    const form = await request.formData();
    return NextResponse.json({ url: await uploadImage(form.get("file")) });
  } catch (error) {
    if (error instanceof UploadError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Dữ liệu tải lên không hợp lệ" }, { status: 400 });
  }
}
