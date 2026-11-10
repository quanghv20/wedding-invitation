/**
 * Khôi phục database từ file backup (.json.gz hoặc .json) — thay toàn bộ dữ liệu các bảng có trong file.
 *
 *   npm run db:restore -- <đường-dẫn-file>           chỉ xem tóm tắt, chưa ghi gì
 *   npm run db:restore -- <đường-dẫn-file> --yes     khôi phục thật (tự lưu bản hiện tại vào backups/ trước)
 */
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { backupFileName, createBackup, decodeBackup, encodeBackup, restoreBackup, summarize } from "../src/lib/backup";
import { db } from "../src/lib/db";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("Thiếu DATABASE_URL (đặt trong .env)");
  const file = process.argv.slice(2).find((arg) => !arg.startsWith("--"));
  if (!file) throw new Error("Cách dùng: npm run db:restore -- <file-backup> [--yes]");

  const backup = decodeBackup(readFileSync(file));
  const summary = summarize(backup);
  console.log(`File backup lúc ${new Date(summary.createdAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}`);
  console.table(summary.tables);
  if (summary.wedding) console.log("Thiệp cưới:", summary.wedding);

  if (!process.argv.includes("--yes")) {
    console.log("\nChưa ghi gì. Thêm --yes để khôi phục thật.");
    return;
  }

  // lưới an toàn: lưu bản hiện tại trước khi ghi đè
  const dir = path.join(process.cwd(), "backups");
  mkdirSync(dir, { recursive: true });
  const current = await createBackup();
  const safety = `truoc-khi-khoi-phuc_${backupFileName(current)}`;
  writeFileSync(path.join(dir, safety), encodeBackup(current));
  console.log(`Đã lưu bản hiện tại vào backups/${safety}`);

  const result = await restoreBackup(backup);
  console.log("Đã khôi phục:");
  console.table(result.restored);
  if (result.skipped.length) console.log("Bỏ qua (database không có bảng này):", result.skipped.join(", "));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => db().end());
