import { backupFileName, createBackup, encodeBackup, summarize } from "./backup";
import { sendMail } from "./mail";

/** Người nhận backup (BACKUP_EMAIL_TO trong .env); để trống thì tắt backup tự động */
export const backupRecipient = () => process.env.BACKUP_EMAIL_TO?.trim() || "";

type Run = { at: string; ok: boolean; reason: string; file?: string; bytes?: number; error?: string };
const state = globalThis as unknown as { __weddingBackup?: { scheduled: boolean; nextAt?: string; runs: Run[] } };
const status = () => (state.__weddingBackup ??= { scheduled: false, runs: [] });

export const backupStatus = () => {
  const s = status();
  return { recipient: backupRecipient(), scheduled: s.scheduled, nextAt: s.nextAt ?? null, runs: s.runs.slice(0, 10) };
};

const vnTime = (iso: string) => new Date(iso).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

/** Tạo backup full rồi gửi mail; trả về file để tải nếu cần */
export async function runBackup(reason: string) {
  const at = new Date().toISOString();
  try {
    const backup = await createBackup();
    const file = encodeBackup(backup);
    const filename = backupFileName(backup);
    const info = summarize(backup);
    const to = backupRecipient();
    if (!to) throw new Error("Chưa đặt BACKUP_EMAIL_TO trong .env");

    const lines = [
      `Backup database thiệp cưới (${reason}) lúc ${vnTime(backup.createdAt)}.`,
      "",
      ...(info.wedding
        ? [
            `Lời mời: ${info.wedding.guests} · Xác nhận tham dự: ${info.wedding.rsvp} · Lời chúc: ${info.wedding.wishes}`,
            `Nội dung thiệp: ${info.wedding.hasContent ? "có" : "chưa có"} · Tài khoản admin: ${info.wedding.hasAdmin ? "có" : "chưa có"}`,
            "",
          ]
        : []),
      "Các bảng:",
      ...info.tables.map((t) => `  - ${t.name}: ${t.rows} dòng`),
      "",
      "Khôi phục: vào trang admin > Sao lưu > Khôi phục từ file, hoặc chạy",
      `  npm run db:restore -- ${filename}`,
    ];
    await sendMail({
      to,
      subject: `[Thiệp cưới] Backup database ${vnTime(backup.createdAt)}`,
      text: lines.join("\n"),
      attachments: [{ filename, content: file, contentType: "application/gzip" }],
    });

    status().runs.unshift({ at, ok: true, reason, file: filename, bytes: file.length });
    return { filename, file };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[backup] ${reason} failed:`, message);
    status().runs.unshift({ at, ok: false, reason, error: message });
    throw error;
  } finally {
    status().runs.length = Math.min(status().runs.length, 50);
  }
}

const HOUR = 3600_000;

/** Chạy vào đầu mỗi giờ (14:00, 15:00...) suốt lúc server còn sống */
export function startBackupSchedule() {
  const s = status();
  if (s.scheduled || !backupRecipient()) return;
  s.scheduled = true;

  const scheduleNext = () => {
    const next = Math.ceil((Date.now() + 1000) / HOUR) * HOUR;
    s.nextAt = new Date(next).toISOString();
    setTimeout(() => {
      runBackup("tự động mỗi giờ")
        .catch(() => {})
        .finally(scheduleNext);
    }, next - Date.now()).unref?.();
  };
  scheduleNext();
  console.log(`[backup] hourly backup to ${backupRecipient()}, next at ${s.nextAt}`);
}
