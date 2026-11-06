import { promises as fs } from "fs";
import path from "path";

/**
 * Lưu trữ RSVP & lời chúc.
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
  const store = await blobStore();
  try {
    if (store) return ((await store.get(name, { type: "json" })) as T[] | null) ?? fallback;
    const raw = await fs.readFile(path.join(DATA_DIR, `${name}.json`), "utf8");
    return JSON.parse(raw) as T[];
  } catch {
    return fallback;
  }
}

export async function appendToCollection<T>(name: string, item: T, fallback: T[] = []) {
  const items = await readCollection<T>(name, fallback);
  items.unshift(item);
  const store = await blobStore();
  if (store) {
    await store.setJSON(name, items);
  } else {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(path.join(DATA_DIR, `${name}.json`), JSON.stringify(items, null, 2), "utf8");
  }
  return items;
}

export const clean = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";
