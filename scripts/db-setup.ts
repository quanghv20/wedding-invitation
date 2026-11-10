/**
 * Tạo bảng `wedding_data` và dữ liệu ban đầu. Chạy lại nhiều lần không mất dữ liệu.
 *
 *   npm run db:setup                        tạo bảng, nội dung và tài khoản admin (nếu chưa có)
 *   npm run db:setup -- <tài-khoản> <mật-khẩu>   đặt lại tài khoản và mật khẩu admin
 */
import { randomBytes } from "crypto";
import { wedding } from "../src/config/wedding";
import { hashPassword, type AdminAccount } from "../src/lib/auth";
import { db, getValue, setValue } from "../src/lib/db";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("Thiếu DATABASE_URL (đặt trong .env)");

  await db().query(`
    CREATE TABLE IF NOT EXISTS wedding_data (
      key text PRIMARY KEY,
      value jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  await db().query(
    `INSERT INTO wedding_data (key, value) VALUES ('content', $1::jsonb) ON CONFLICT (key) DO NOTHING`,
    [JSON.stringify(wedding)],
  );

  const [username, password] = process.argv.slice(2);
  if (username && password) {
    await setValue("admin", { username, passwordHash: await hashPassword(password) } satisfies AdminAccount);
    console.log(`Đã đặt tài khoản admin: ${username}`);
  } else if (await getValue("admin")) {
    console.log("Tài khoản admin đã có, giữ nguyên.");
  } else {
    const generated = randomBytes(12).toString("base64url");
    await setValue("admin", { username: "admin", passwordHash: await hashPassword(generated) } satisfies AdminAccount);
    console.log(`Đã tạo tài khoản admin\n  tài khoản: admin\n  mật khẩu:  ${generated}\n(chỉ hiện một lần)`);
  }

  await db().end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
