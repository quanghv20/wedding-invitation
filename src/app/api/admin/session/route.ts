import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_SECONDS,
  clearLoginFailures,
  createSessionToken,
  getAdminAccount,
  isLoginLocked,
  recordLoginFailure,
  verifyPassword,
} from "@/lib/auth";
import { hasDatabase } from "@/lib/db";
import { clean } from "@/lib/store";

const cookieOptions = (request: NextRequest) => ({
  httpOnly: true,
  sameSite: "strict" as const,
  path: "/api/admin",
  // server chạy sau reverse proxy: chỉ đặt Secure khi trình duyệt thật sự dùng HTTPS
  secure: request.headers.get("x-forwarded-proto") === "https" || request.nextUrl.protocol === "https:",
});

/** Đăng nhập */
export async function POST(request: NextRequest) {
  if (!hasDatabase()) return NextResponse.json({ error: "Server chưa cấu hình DATABASE_URL" }, { status: 503 });
  if (isLoginLocked()) {
    return NextResponse.json({ error: "Sai quá nhiều lần, vui lòng thử lại sau 15 phút" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const admin = await getAdminAccount();
  if (!admin) return NextResponse.json({ error: "Chưa có tài khoản admin, hãy chạy npm run db:setup" }, { status: 503 });

  const passwordOk = await verifyPassword(clean(body?.password, 200), admin.passwordHash);
  if (!passwordOk || clean(body?.username, 100) !== admin.username) {
    recordLoginFailure();
    return NextResponse.json({ error: "Sai tài khoản hoặc mật khẩu" }, { status: 401 });
  }

  clearLoginFailures();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, createSessionToken(admin), { ...cookieOptions(request), maxAge: SESSION_SECONDS });
  return response;
}

/** Đăng xuất */
export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { ...cookieOptions(request), maxAge: 0 });
  return response;
}
