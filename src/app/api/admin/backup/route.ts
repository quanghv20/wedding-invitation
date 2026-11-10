import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/auth";
import { BackupError, backupFileName, createBackup, decodeBackup, encodeBackup, restoreBackup, summarize } from "@/lib/backup";
import { backupStatus, runBackup } from "@/lib/backupJob";
import { clearContentCache } from "@/lib/content";
import { hasDatabase } from "@/lib/db";

const unauthorized = () => NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
const authorized = async (request: NextRequest) => hasDatabase() && (await isAdmin(request));
const errorText = (error: unknown) => (error instanceof Error ? error.message : String(error));

/** Trạng thái backup tự động; ?download=1 thì tải ngay một file backup (không gửi mail) */
export async function GET(request: NextRequest) {
  if (!(await authorized(request))) return unauthorized();
  if (!request.nextUrl.searchParams.has("download")) return NextResponse.json(backupStatus());

  const backup = await createBackup();
  return new NextResponse(new Uint8Array(encodeBackup(backup)), {
    headers: {
      "Content-Type": "application/gzip",
      "Content-Disposition": `attachment; filename="${backupFileName(backup)}"`,
      "Cache-Control": "no-store",
    },
  });
}

/** Gửi backup qua mail ngay */
export async function POST(request: NextRequest) {
  if (!(await authorized(request))) return unauthorized();
  try {
    const { filename } = await runBackup("gửi thủ công từ trang admin");
    return NextResponse.json({ ok: true, filename, status: backupStatus() });
  } catch (error) {
    return NextResponse.json({ error: `Không gửi được backup: ${errorText(error)}`, status: backupStatus() }, { status: 500 });
  }
}

/**
 * Khôi phục từ file (multipart, trường "file").
 * Không có confirm=1: chỉ đọc file và trả về tóm tắt để admin xem trước.
 * confirm=1: backup trạng thái hiện tại qua mail trước, rồi thay toàn bộ dữ liệu bằng dữ liệu trong file.
 */
export async function PUT(request: NextRequest) {
  if (!(await authorized(request))) return unauthorized();

  let backup;
  let confirm = false;
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") throw new BackupError("Hãy chọn file backup");
    confirm = form.get("confirm") === "1";
    backup = decodeBackup(Buffer.from(await file.arrayBuffer()));
  } catch (error) {
    const message = error instanceof BackupError ? error.message : "Không đọc được file tải lên";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (!confirm) return NextResponse.json({ summary: summarize(backup) });

  // lưới an toàn: gửi bản hiện tại qua mail trước khi ghi đè (lỗi mail thì vẫn khôi phục, nhưng báo lại)
  let safetyBackup: string | null = null;
  let safetyError: string | null = null;
  try {
    safetyBackup = (await runBackup("tự động trước khi khôi phục")).filename;
  } catch (error) {
    safetyError = errorText(error);
  }

  try {
    const result = await restoreBackup(backup);
    clearContentCache();
    return NextResponse.json({ ok: true, ...result, safetyBackup, safetyError });
  } catch (error) {
    console.error("[backup] restore failed", error);
    return NextResponse.json({ error: `Khôi phục thất bại, dữ liệu giữ nguyên: ${errorText(error)}`, safetyBackup, safetyError }, { status: 500 });
  }
}
