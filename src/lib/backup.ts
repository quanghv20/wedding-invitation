import { gunzipSync, gzipSync } from "zlib";
import type { PoolClient } from "pg";
import { db } from "./db";

/**
 * Backup full database: mọi bảng trong schema public, mỗi bảng gồm cấu trúc cột, khóa chính và toàn bộ dòng.
 * File là JSON nén gzip (.json.gz), đọc được bằng `gunzip` hoặc bất kỳ công cụ JSON nào.
 *
 * Khôi phục: xóa sạch dữ liệu các bảng có trong file rồi nạp lại, tất cả trong một transaction
 * (lỗi giữa chừng thì database giữ nguyên như cũ).
 */
export const BACKUP_FORMAT = "wedding-invitation-db-backup";

export type BackupColumn = { name: string; type: string; nullable: boolean; default: string | null; generated: boolean };
export type BackupTable = { name: string; columns: BackupColumn[]; primaryKey: string[]; rowCount: number; rows: Record<string, unknown>[] };
export type Backup = {
  format: typeof BACKUP_FORMAT;
  version: 1;
  createdAt: string;
  database: { name: string; serverVersion: string };
  tables: BackupTable[];
};

const ident = (name: string) => `"${name.replace(/"/g, '""')}"`;

async function listTables(client: PoolClient | ReturnType<typeof db>) {
  const { rows } = await client.query<{ table_name: string }>(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY 1`,
  );
  return rows.map((r) => r.table_name);
}

async function columnsOf(client: PoolClient | ReturnType<typeof db>, table: string): Promise<BackupColumn[]> {
  const { rows } = await client.query(
    `SELECT column_name, format_type(a.atttypid, a.atttypmod) AS type, c.is_nullable, c.column_default, c.is_generated
     FROM information_schema.columns c
     JOIN pg_attribute a ON a.attrelid = format('public.%I', c.table_name)::regclass AND a.attname = c.column_name
     WHERE c.table_schema = 'public' AND c.table_name = $1 ORDER BY c.ordinal_position`,
    [table],
  );
  return rows.map((r) => ({
    name: r.column_name,
    type: r.type,
    nullable: r.is_nullable === "YES",
    default: r.column_default,
    generated: r.is_generated === "ALWAYS",
  }));
}

export async function createBackup(): Promise<Backup> {
  const pool = db();
  const [{ rows: info }, tables] = await Promise.all([
    pool.query(`SELECT current_database() AS name, current_setting('server_version') AS version`),
    listTables(pool),
  ]);

  const result: BackupTable[] = [];
  for (const name of tables) {
    const [columns, pk, data] = await Promise.all([
      columnsOf(pool, name),
      pool.query(
        `SELECT a.attname FROM pg_index i JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
         WHERE i.indrelid = format('public.%I', $1::text)::regclass AND i.indisprimary`,
        [name],
      ),
      pool.query(`SELECT coalesce(json_agg(t), '[]'::json) AS rows FROM public.${ident(name)} t`),
    ]);
    const rows = data.rows[0].rows as Record<string, unknown>[];
    result.push({ name, columns, primaryKey: pk.rows.map((r) => r.attname), rowCount: rows.length, rows });
  }

  return {
    format: BACKUP_FORMAT,
    version: 1,
    createdAt: new Date().toISOString(),
    database: { name: info[0].name, serverVersion: info[0].version },
    tables: result,
  };
}

/** Tên file theo giờ Việt Nam: wedding-db-backup_2026-11-10_14h00.json.gz */
export function backupFileName(backup: Pick<Backup, "createdAt">) {
  const vn = new Date(new Date(backup.createdAt).getTime() + 7 * 3600_000).toISOString();
  return `wedding-db-backup_${vn.slice(0, 10)}_${vn.slice(11, 13)}h${vn.slice(14, 16)}.json.gz`;
}

export const encodeBackup = (backup: Backup) => gzipSync(JSON.stringify(backup, null, 1));

export class BackupError extends Error {}

/** Đọc file backup (.json.gz hoặc .json) và kiểm tra đúng định dạng */
export function decodeBackup(file: Buffer): Backup {
  let text: string;
  try {
    text = (file[0] === 0x1f && file[1] === 0x8b ? gunzipSync(file) : file).toString("utf8");
  } catch {
    throw new BackupError("File không giải nén được");
  }
  let backup: Backup;
  try {
    backup = JSON.parse(text);
  } catch {
    throw new BackupError("File không phải JSON hợp lệ");
  }
  if (backup?.format !== BACKUP_FORMAT || !Array.isArray(backup.tables)) {
    throw new BackupError("Đây không phải file backup của thiệp cưới");
  }
  for (const t of backup.tables) {
    if (typeof t?.name !== "string" || !Array.isArray(t.rows) || !Array.isArray(t.columns)) {
      throw new BackupError(`Bảng ${t?.name ?? "?"} trong file bị hỏng`);
    }
  }
  return backup;
}

/** Tóm tắt để hiện trong mail và màn hình khôi phục */
export function summarize(backup: Backup) {
  const wedding = backup.tables.find((t) => t.name === "wedding_data");
  const value = (key: string) => wedding?.rows.find((r) => r.key === key)?.value;
  const count = (key: string) => {
    const v = value(key);
    return Array.isArray(v) ? v.length : 0;
  };
  return {
    createdAt: backup.createdAt,
    tables: backup.tables.map((t) => ({ name: t.name, rows: t.rows.length })),
    wedding: wedding
      ? { hasContent: !!value("content"), hasAdmin: !!value("admin"), guests: count("guests"), rsvp: count("rsvp"), wishes: count("wishes") }
      : null,
  };
}

/** Bảng của thiệp: tạo lại nếu database mới tinh chưa có (giống npm run db:setup) */
const WEDDING_TABLE_SQL = `CREATE TABLE IF NOT EXISTS wedding_data (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
)`;

/** Sắp bảng cha trước bảng con theo khóa ngoại để nạp dữ liệu không vi phạm ràng buộc */
async function insertOrder(client: PoolClient, tables: string[]) {
  const { rows } = await client.query<{ child: string; parent: string }>(
    `SELECT c.relname AS child, p.relname AS parent FROM pg_constraint k
     JOIN pg_class c ON c.oid = k.conrelid JOIN pg_class p ON p.oid = k.confrelid
     WHERE k.contype = 'f' AND k.connamespace = 'public'::regnamespace AND c.relname <> p.relname`,
  );
  const ordered: string[] = [];
  const visit = (name: string, path: Set<string>) => {
    if (ordered.includes(name) || path.has(name)) return;
    path.add(name);
    for (const edge of rows) if (edge.child === name && tables.includes(edge.parent)) visit(edge.parent, path);
    ordered.push(name);
  };
  for (const t of tables) visit(t, new Set());
  return ordered;
}

export type RestoreResult = { restored: { name: string; rows: number }[]; skipped: string[] };

export async function restoreBackup(backup: Backup): Promise<RestoreResult> {
  const client = await db().connect();
  try {
    await client.query("BEGIN");
    if (backup.tables.some((t) => t.name === "wedding_data")) await client.query(WEDDING_TABLE_SQL);

    const existing = new Set(await listTables(client));
    const byName = new Map(backup.tables.map((t) => [t.name, t]));
    const targets = backup.tables.map((t) => t.name).filter((name) => existing.has(name));
    const skipped = backup.tables.map((t) => t.name).filter((name) => !existing.has(name));

    if (targets.length) await client.query(`TRUNCATE ${targets.map((t) => `public.${ident(t)}`).join(", ")}`);

    const restored: RestoreResult["restored"] = [];
    for (const name of await insertOrder(client, targets)) {
      const table = byName.get(name)!;
      // chỉ nạp các cột có ở cả file lẫn bảng hiện tại; cột mới thêm sau này lấy giá trị mặc định
      const current = (await columnsOf(client, name)).filter((c) => !c.generated).map((c) => c.name);
      const inFile = new Set(table.columns.map((c) => c.name));
      const cols = current.filter((c) => inFile.has(c)).map(ident).join(", ");
      if (table.rows.length && cols) {
        await client.query(
          `INSERT INTO public.${ident(name)} (${cols}) OVERRIDING SYSTEM VALUE
           SELECT ${cols} FROM json_populate_recordset(NULL::public.${ident(name)}, $1::json)`,
          [JSON.stringify(table.rows)],
        );
      }
      // đưa các sequence (cột id tự tăng) về sau giá trị lớn nhất vừa nạp
      for (const col of current) {
        const { rows } = await client.query(`SELECT pg_get_serial_sequence(format('public.%I', $1::text), $2) AS seq`, [name, col]);
        if (rows[0].seq) {
          await client.query(`SELECT setval($1, coalesce((SELECT max(${ident(col)}) FROM public.${ident(name)}), 0) + 1, false)`, [rows[0].seq]);
        }
      }
      restored.push({ name, rows: table.rows.length });
    }

    await client.query("COMMIT");
    return { restored, skipped };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}
