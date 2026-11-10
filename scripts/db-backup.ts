/**
 * Tạo file backup full database.
 *
 *   npm run db:backup                 ghi file .json.gz vào thư mục backups/
 *   npm run db:backup -- --mail       đồng thời gửi qua mail tới BACKUP_EMAIL_TO
 */
import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import { backupFileName, createBackup, encodeBackup, summarize } from "../src/lib/backup";
import { runBackup } from "../src/lib/backupJob";
import { db } from "../src/lib/db";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("Thiếu DATABASE_URL (đặt trong .env)");
  const dir = path.join(process.cwd(), "backups");
  mkdirSync(dir, { recursive: true });

  if (process.argv.includes("--mail")) {
    const { filename, file } = await runBackup("chạy bằng npm run db:backup");
    writeFileSync(path.join(dir, filename), file);
    console.log(`Đã gửi mail tới ${process.env.BACKUP_EMAIL_TO} và lưu backups/${filename}`);
    return;
  }

  const backup = await createBackup();
  const filename = backupFileName(backup);
  writeFileSync(path.join(dir, filename), encodeBackup(backup));
  console.log(`Đã lưu backups/${filename}`);
  console.table(summarize(backup).tables);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db().end());
