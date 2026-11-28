import type { AdminAccount } from "./auth";
import { db } from "./db";

/**
 * DB mới tinh (vd. Postgres vừa tạo trong Docker) chưa có tài khoản admin: tạo từ
 * ADMIN_USERNAME + ADMIN_PASSWORD_HASH trong .env. Đã có tài khoản thì giữ nguyên.
 * Mã băm tạo bằng hashPassword() trong src/lib/auth.ts (dạng scrypt:<salt>:<hash>).
 */
export async function ensureAdminAccount() {
  const username = process.env.ADMIN_USERNAME?.trim();
  const passwordHash = process.env.ADMIN_PASSWORD_HASH?.trim();
  if (!username || !passwordHash?.startsWith("scrypt:")) return;

  const { rowCount } = await db().query(
    `INSERT INTO wedding_data (key, value) VALUES ('admin', $1::jsonb) ON CONFLICT (key) DO NOTHING`,
    [JSON.stringify({ username, passwordHash } satisfies AdminAccount)],
  );
  if (rowCount) console.log(`[admin] đã tạo tài khoản admin: ${username}`);
}
