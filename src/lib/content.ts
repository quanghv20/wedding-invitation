import { wedding, type WeddingContent } from "@/config/wedding";
import { listAlbum } from "./albums";
import { getValue, hasDatabase, setValue } from "./db";
import { isAlbumImage } from "./images";
import { clean } from "./store";

/** Sau khoảng này thì nội dung được làm mới ngầm; khách vẫn nhận ngay bản đang giữ, không phải chờ database */
const CACHE_MS = 30_000;
const globalCache = globalThis as unknown as {
  __weddingContent?: { content: WeddingContent; at: number };
  __weddingRefresh?: Promise<WeddingContent>;
};

/** Đọc nội dung trong database; phần nào hỏng thì thay bằng phần tương ứng trong code */
export async function readStoredContent(): Promise<WeddingContent> {
  const [stored, album] = await Promise.all([getValue<unknown>("content"), listAlbum()]);
  return repairContent(stored, album);
}

/** Ảnh không có trong album (link cũ, file đã xóa) thì dùng ảnh mặc định cùng vị trí */
function withAlbumImages(input: Record<string, unknown>, album: Set<string>): Record<string, unknown> {
  const ok = (src: unknown) => typeof src === "string" && album.has(src);
  const fix = (src: unknown, fallback: string) => (ok(src) ? src : fallback);
  const obj = (value: unknown) => (value && typeof value === "object" ? (value as Record<string, unknown>) : {});
  // khớp theo tên trước (thứ tự trong database có thể khác code), không có thì theo vị trí
  const items = <T extends { image: string; title: string }>(value: unknown, defaults: T[]) =>
    Array.isArray(value)
      ? value.map((item, i) => {
          const fallback = defaults.find((d) => d.title === obj(item).title) ?? defaults[i % defaults.length];
          return { ...obj(item), image: fix(obj(item).image, fallback.image) };
        })
      : value;

  const gallery = Array.isArray(input.gallery) ? input.gallery.filter(ok) : [];
  return {
    ...input,
    hero: { image: fix(obj(input.hero).image, wedding.hero.image) },
    groom: { ...obj(input.groom), photo: fix(obj(input.groom).photo, wedding.groom.photo) },
    bride: { ...obj(input.bride), photo: fix(obj(input.bride).photo, wedding.bride.photo) },
    events: items(input.events, wedding.events),
    story: items(input.story, wedding.story),
    footerImage: fix(input.footerImage, wedding.footerImage),
    // album trống thì thiệp trông như lỗi: dùng album mặc định
    ...(gallery.length ? {} : { gallery: wedding.gallery, galleryOrder: wedding.galleryOrder }),
  };
}

/**
 * Nội dung đọc được luôn hợp lệ: kiểm tra như lúc admin lưu, phần nào không hợp lệ
 * (thiếu, sai kiểu, ảnh không còn) thì lấy phần đó trong src/config/wedding.ts.
 */
export function repairContent(stored: unknown, albumFiles: string[]): WeddingContent {
  if (!stored || typeof stored !== "object" || Array.isArray(stored)) {
    console.warn("[content] no valid content in database, using defaults");
    return wedding;
  }
  const album = new Set(albumFiles);
  const input = withAlbumImages({ ...wedding, ...stored }, album);
  try {
    return parseContent(input, albumFiles);
  } catch (error) {
    if (!(error instanceof ContentError)) throw error;
  }

  // kiểm tra từng phần, mỗi lần chỉ lấy một phần từ database còn lại là mặc định
  const result = { ...wedding } as Record<string, unknown>;
  const broken: string[] = [];
  for (const key of Object.keys(wedding) as (keyof WeddingContent)[]) {
    try {
      result[key] = parseContent({ ...wedding, [key]: input[key] }, albumFiles)[key];
    } catch {
      broken.push(key);
    }
  }
  console.warn(`[content] invalid data in database, using defaults for: ${broken.join(", ")}`);
  return result as WeddingContent;
}

/** Các lượt gọi cùng lúc dùng chung một truy vấn */
function refreshContent() {
  const startedAt = Date.now();
  globalCache.__weddingRefresh ??= readStoredContent()
    .then((content) => {
      // admin vừa lưu trong lúc đang đọc thì giữ bản mới của admin
      const current = globalCache.__weddingContent;
      if (current && current.at > startedAt) return current.content;
      globalCache.__weddingContent = { content, at: Date.now() };
      return content;
    })
    .finally(() => {
      globalCache.__weddingRefresh = undefined;
    });
  return globalCache.__weddingRefresh;
}

export async function getWeddingContent(): Promise<WeddingContent> {
  if (!hasDatabase()) return wedding;

  const cached = globalCache.__weddingContent;
  if (!cached) {
    try {
      return await refreshContent();
    } catch (error) {
      // database lỗi: dùng nội dung trong code, giữ lại để khách sau không phải chờ database nữa,
      // hết CACHE_MS thì thử đọc lại database ở nền
      console.error("[content] database error, serving default content", error);
      globalCache.__weddingContent ??= { content: wedding, at: Date.now() };
      return globalCache.__weddingContent.content;
    }
  }

  if (Date.now() - cached.at >= CACHE_MS) {
    refreshContent().catch((error) => console.error("[content] database error, serving cached content", error));
  }
  return cached.content;
}

/** Sau khi khôi phục backup: bỏ bản đang giữ để lần sau đọc lại từ database */
export function clearContentCache() {
  globalCache.__weddingContent = undefined;
}

export async function saveWeddingContent(content: WeddingContent) {
  await setValue("content", content);
  globalCache.__weddingContent = { content, at: Date.now() };
}

/** Lỗi nhập liệu, nội dung lỗi được hiển thị thẳng cho admin */
export class ContentError extends Error {}

function required(value: unknown, label: string, max = 300) {
  const text = clean(value, max);
  if (!text) throw new ContentError(`${label}: chưa nhập`);
  return text;
}

/** Chỉ giữ ảnh có trong album, mỗi ảnh một lần */
function albumList(value: unknown, album: Set<string>) {
  const items = Array.isArray(value) ? value : [];
  return [...new Set(items.map((src) => clean(src, 300)).filter((src) => album.has(src)))];
}

function dateTime(value: unknown, label: string) {
  const date = required(value, label, 40);
  if (Number.isNaN(Date.parse(date))) throw new ContentError(`${label}: ngày giờ không hợp lệ`);
  return date;
}

function code(value: unknown, label: string) {
  const text = required(value, label, 40);
  if (!/^[A-Za-z0-9]+$/.test(text)) throw new ContentError(`${label}: chỉ gồm chữ và số, không có khoảng trắng`);
  return text;
}

function list(value: unknown, label: string, min: number, max: number) {
  const items = Array.isArray(value) ? value : [];
  if (items.length < min) throw new ContentError(`${label}: cần ít nhất ${min} mục`);
  if (items.length > max) throw new ContentError(`${label}: tối đa ${max} mục`);
  return items;
}

function place(value: Partial<WeddingContent["places"]["groom"]> | undefined, label: string) {
  return {
    venue: required(value?.venue, `${label} — địa điểm`, 150),
    address: required(value?.address, `${label} — địa chỉ`, 300),
  };
}

type ImageCheck =(value: unknown, label: string) => string;

function person(value: Partial<WeddingContent["groom"]> | undefined, label: string, image: ImageCheck): WeddingContent["groom"] {
  return {
    name: required(value?.name, `${label} — tên`, 60),
    fullName: required(value?.fullName, `${label} — họ tên đầy đủ`, 100),
    role: required(value?.role, `${label} — vai trò`, 40),
    birthday: clean(value?.birthday, 40),
    bio: clean(value?.bio, 500),
    photo: image(value?.photo, `${label} — ảnh`),
    parents: { father: clean(value?.parents?.father, 100), mother: clean(value?.parents?.mother, 100) },
  };
}

/**
 * Kiểm tra và làm sạch dữ liệu gửi từ trang admin, chỉ giữ các trường đã biết.
 * `albumFiles`: ảnh đang có trong public/albums, mọi ảnh phải chọn trong số này.
 */
export function parseContent(body: unknown, albumFiles: string[]): WeddingContent {
  const input = (body ?? {}) as Partial<WeddingContent>;
  const album = new Set(albumFiles);

  const image: ImageCheck = (value, label) => {
    const src = clean(value, 300);
    if (!src) throw new ContentError(`${label}: chưa chọn ảnh`);
    if (!isAlbumImage(src)) throw new ContentError(`${label}: hãy chọn lại ảnh trong album (không dùng link ngoài nữa)`);
    if (!album.has(src)) throw new ContentError(`${label}: ảnh ${src} không còn trong thư mục public/albums`);
    return src;
  };

  // thứ tự toàn bộ ảnh trong album; gallery là các ảnh được tick hiển thị, theo đúng thứ tự đó
  const galleryOrder = albumList(input.galleryOrder, album);
  const visible = new Set(albumList(input.gallery, album));

  const music = clean(input.music, 1000);
  if (music && !/^(\/[^/]|https:\/\/)/.test(music)) throw new ContentError("Nhạc nền: đường dẫn không hợp lệ");

  return {
    groom: person(input.groom, "Chú rể", image),
    bride: person(input.bride, "Cô dâu", image),
    date: dateTime(input.date, "Thời điểm đếm ngược"),
    displayDate: clean(input.displayDate, 100),
    lunarDate: clean(input.lunarDate, 200),
    rsvpDeadline: clean(input.rsvpDeadline, 40),
    quote: clean(input.quote, 500),
    quoteAuthor: clean(input.quoteAuthor, 100),
    hero: { image: image(input.hero?.image, "Ảnh chính") },
    events: list(input.events, "Sự kiện", 1, 10).map((e, i) => {
      const label = `Sự kiện ${i + 1}`;
      return {
        title: required(e?.title, `${label} — tên`, 100),
        side: clean(e?.side, 60),
        start: dateTime(e?.start, `${label} — bắt đầu`),
        end: dateTime(e?.end, `${label} — kết thúc`),
        image: image(e?.image, `${label} — ảnh`),
        main: Boolean(e?.main),
      };
    }),
    places: {
      groom: place(input.places?.groom, "Nhà trai"),
      bride: place(input.places?.bride, "Nhà gái"),
    },
    story: list(input.story, "Chuyện tình", 0, 20).map((s, i) => {
      const label = `Chuyện tình ${i + 1}`;
      return {
        date: clean(s?.date, 100),
        title: required(s?.title, `${label} — tiêu đề`, 150),
        text: clean(s?.text, 1000),
        image: image(s?.image, `${label} — ảnh`),
      };
    }),
    gallery: [...galleryOrder.filter((src) => visible.has(src)), ...[...visible].filter((src) => !galleryOrder.includes(src))],
    galleryOrder,
    gifts: list(input.gifts, "Mừng cưới", 0, 6).map((g, i) => {
      const label = `Mừng cưới ${i + 1}`;
      return {
        label: required(g?.label, `${label} — tiêu đề`, 100),
        bankId: code(g?.bankId, `${label} — mã ngân hàng`),
        bankName: required(g?.bankName, `${label} — tên ngân hàng`, 100),
        accountNo: code(g?.accountNo, `${label} — số tài khoản`),
        accountName: required(g?.accountName, `${label} — chủ tài khoản`, 100),
      };
    }),
    music,
    footerImage: image(input.footerImage, "Ảnh cuối trang"),
  };
}
