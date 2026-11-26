import { readdir } from "node:fs/promises";
import path from "node:path";
import { ALBUM_DIR, isAlbumFileName } from "./images";

/** Danh sách ảnh trong public/albums (/albums/ten-anh.jpg), sắp theo tên */
export async function listAlbum(): Promise<string[]> {
  const files = await readdir(path.join(process.cwd(), "public", "albums")).catch(() => []);
  return files
    .filter(isAlbumFileName)
    .sort((a, b) => a.localeCompare(b, "en", { numeric: true }))
    .map((name) => ALBUM_DIR + name);
}
