import type { WeddingContent } from "@/config/wedding";
import { ALBUM_DIR } from "@/lib/images";

/** Số ảnh hiển thị trong Album khi dùng bộ gợi ý */
export const SUGGESTED_GALLERY_SIZE = 12;

const file = (name: string) => `${ALBUM_DIR}${name}.jpg`;

/** Nhóm ảnh hợp với từng vị trí (xếp theo nội dung ảnh trong public/albums) */
const POOLS = {
  // cận cảnh hai người, hợp khung vòm nhỏ
  hero: ["VYK04324", "VYK04892", "VYK03839", "VYK04347", "VYK04479", "VYK04600"],
  // chú rể nổi bật trong khung (không có ảnh chụp riêng chú rể)
  groom: ["VYK04892", "VYK04630", "VYK04600", "VYK04324", "VYK04969"],
  bride: ["VYK04730", "VYK04975", "VYK04397"],
  event: ["VYK04465", "VYK04308", "VYK04150", "VYK04007", "VYK04216", "VYK04443", "VYK04832"],
  story: ["VYK04397", "VYK03839", "VYK04007", "VYK03684", "VYK04150", "VYK04347", "VYK04206"],
  // nền tối có chữ "Thank you" đè lên: tránh ảnh có sẵn chữ
  footer: ["VYK04419", "VYK04465", "VYK04347", "VYK03684"],
};

/** Gần trùng với ảnh khác, không đưa vào album */
const NEAR_DUPLICATES = new Set(["VYK04217", "VYK04594-", "VYK04563-"].map(file));

function shuffle<T>(items: T[]) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Bộ ảnh ngẫu nhiên: mỗi vị trí lấy trong nhóm phù hợp, không trùng nhau; album lấy ngẫu nhiên 12 ảnh */
export function withSuggestedImages(content: WeddingContent, album: string[]): WeddingContent {
  if (!album.length) return content;
  const inAlbum = new Set(album);
  const used = new Set<string>();

  const pick = (pool: string[]) => {
    const candidates = pool.map(file).filter((src) => inAlbum.has(src));
    const src =
      shuffle(candidates).find((s) => !used.has(s)) ??
      shuffle(album).find((s) => !used.has(s)) ??
      shuffle(candidates.length ? candidates : album)[0];
    used.add(src);
    return src;
  };

  const next: WeddingContent = {
    ...content,
    hero: { image: pick(POOLS.hero) },
    groom: { ...content.groom, photo: pick(POOLS.groom) },
    bride: { ...content.bride, photo: pick(POOLS.bride) },
    events: content.events.map((e) => ({ ...e, image: pick(POOLS.event) })),
    story: content.story.map((s) => ({ ...s, image: pick(POOLS.story) })),
    footerImage: pick(POOLS.footer),
  };

  // ưu tiên ảnh chưa dùng ở các phần trên để album đa dạng
  const choices = album.filter((src) => !NEAR_DUPLICATES.has(src));
  const fresh = shuffle(choices.filter((src) => !used.has(src)));
  const gallery = [...fresh, ...shuffle(choices.filter((src) => used.has(src)))].slice(0, SUGGESTED_GALLERY_SIZE);
  const shown = new Set(gallery);

  return { ...next, gallery, galleryOrder: [...gallery, ...album.filter((src) => !shown.has(src))] };
}
