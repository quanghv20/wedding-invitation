import { promises as fs } from "fs";
import path from "path";
import { getValue, hasDatabase, prependValue, setValue } from "./db";

/**
 * Lưu trữ RSVP & lời chúc.
 * - Có DATABASE_URL: dùng bảng wedding_data trong PostgreSQL.
 * - Khi chạy trên Netlify: dùng Netlify Blobs (tự có sẵn, không cần cấu hình).
 * - Khi chạy trên máy / VPS: dùng file JSON trong thư mục /data.
 */
const DATA_DIR = path.join(process.cwd(), "data");

/** Trả về kho Netlify Blobs, hoặc null nếu không chạy trên Netlify */
async function blobStore() {
  try {
    const { getStore } = await import("@netlify/blobs");
    return getStore({ name: "wedding", consistency: "strong" });
  } catch {
    return null;
  }
}

export async function readCollection<T>(name: string, fallback: T[] = []): Promise<T[]> {
  if (hasDatabase()) return (await getValue<T[]>(name)) ?? fallback;

  const store = await blobStore();
  try {
    if (store) return ((await store.get(name, { type: "json" })) as T[] | null) ?? fallback;
    const raw = await fs.readFile(path.join(DATA_DIR, `${name}.json`), "utf8");
    return JSON.parse(raw) as T[];
  } catch {
    return fallback;
  }
}

/** Ghi đè cả danh sách (dùng cho sửa / xóa) */
export async function writeCollection<T>(name: string, items: T[]) {
  if (hasDatabase()) return setValue(name, items);

  const store = await blobStore();
  if (store) {
    await store.setJSON(name, items);
  } else {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(path.join(DATA_DIR, `${name}.json`), JSON.stringify(items, null, 2), "utf8");
  }
}

export async function appendToCollection<T>(name: string, item: T, fallback: T[] = []) {
  if (hasDatabase()) return prependValue(name, item, fallback);

  const items = await readCollection<T>(name, fallback);
  items.unshift(item);
  await writeCollection(name, items);
  return items;
}

export const clean = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";
