import { Pool } from "pg";

/**
 * Toàn bộ dữ liệu của thiệp nằm trong bảng `wedding_data` (key → jsonb):
 * - content: nội dung thiệp
 * - admin:   tài khoản quản trị (mật khẩu đã băm)
 * - rsvp, wishes: phản hồi và lời chúc của khách
 *
 * Bảng được tạo bởi `npm run db:setup`.
 */

// Next.js nạp lại module khi dev nên pool được giữ trên globalThis để không mở thêm kết nối
const globalDb = globalThis as unknown as { __weddingPool?: Pool };

/** Đặt trong file .env */
const databaseUrl = () => process.env.DATABASE_URL;

export const hasDatabase = () => !!databaseUrl();

export function db() {
  if (!globalDb.__weddingPool) {
    const pool = new Pool({
      connectionString: databaseUrl(),
      max: 3,
      idleTimeoutMillis: 20_000,
      connectionTimeoutMillis: 15_000,
    });
    // Neon đóng các kết nối rảnh: thiếu listener này thì lỗi đó làm sập cả tiến trình
    pool.on("error", (error) => console.error("[db] idle client error", error));
    globalDb.__weddingPool = pool;
  }
  return globalDb.__weddingPool;
}

export async function getValue<T>(key: string): Promise<T | null> {
  const { rows } = await db().query("SELECT value FROM wedding_data WHERE key = $1", [key]);
  return rows.length ? (rows[0].value as T) : null;
}

export async function setValue(key: string, value: unknown) {
  await db().query(
    `INSERT INTO wedding_data (key, value) VALUES ($1, $2::jsonb)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [key, JSON.stringify(value)],
  );
}

/**
 * Đọc - sửa - ghi một key trong cùng transaction, khóa dòng (FOR UPDATE) để hai lượt gửi
 * cùng lúc chạy lần lượt, không ghi đè nhau.
 */
export async function updateValue<T>(key: string, initial: T, update: (current: T) => T): Promise<T> {
  const client = await db().connect();
  try {
    await client.query("BEGIN");
    await client.query("INSERT INTO wedding_data (key, value) VALUES ($1, $2::jsonb) ON CONFLICT (key) DO NOTHING", [
      key,
      JSON.stringify(initial),
    ]);
    const { rows } = await client.query("SELECT value FROM wedding_data WHERE key = $1 FOR UPDATE", [key]);
    const next = update(rows[0].value as T);
    await client.query("UPDATE wedding_data SET value = $2::jsonb, updated_at = now() WHERE key = $1", [key, JSON.stringify(next)]);
    await client.query("COMMIT");
    return next;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

/** Thêm vào đầu danh sách trong một câu lệnh, để hai khách gửi cùng lúc không ghi đè nhau */
export async function prependValue<T>(key: string, item: T, initial: T[] = []): Promise<T[]> {
  const { rows } = await db().query(
    `INSERT INTO wedding_data (key, value) VALUES ($1, $2::jsonb)
     ON CONFLICT (key) DO UPDATE SET value = $3::jsonb || wedding_data.value, updated_at = now()
     RETURNING value`,
    [key, JSON.stringify([item, ...initial]), JSON.stringify([item])],
  );
  return rows[0].value as T[];
}
