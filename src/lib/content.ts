import { wedding, type WeddingContent } from "@/config/wedding";
import { getValue, hasDatabase, setValue } from "./db";
import { IMAGE_HOSTS, isAllowedImage } from "./images";
import { clean } from "./store";

/** Sau khoảng này thì nội dung được làm mới ngầm; khách vẫn nhận ngay bản đang giữ, không phải chờ database */
const CACHE_MS = 30_000;
const globalCache = globalThis as unknown as {
  __weddingContent?: { content: WeddingContent; at: number };
  __weddingRefresh?: Promise<WeddingContent>;
};

export async function readStoredContent(): Promise<WeddingContent> {
  // ghép với mặc định để trường mới thêm trong code vẫn có giá trị với dữ liệu cũ
  return { ...wedding, ...(await getValue<Partial<WeddingContent>>("content")) };
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
  // Chưa có bản nào thì phải chờ, không rơi về nội dung mặc định: trong đó có số tài khoản mẫu
  if (!cached) return refreshContent();

  if (Date.now() - cached.at >= CACHE_MS) {
    refreshContent().catch((error) => console.error("[content] database error, serving cached content", error));
  }
  return cached.content;
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

function image(value: unknown, label: string) {
  const src = required(value, label, 1000);
  if (isAllowedImage(src)) return src;
  throw new ContentError(`${label}: ảnh phải là đường dẫn trong site (/images/ten-anh.jpg) hoặc link từ ${IMAGE_HOSTS.join(", ")}`);
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

function person(value: Partial<WeddingContent["groom"]> | undefined, label: string): WeddingContent["groom"] {
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

/** Kiểm tra và làm sạch dữ liệu gửi từ trang admin, chỉ giữ các trường đã biết */
export function parseContent(body: unknown): WeddingContent {
  const input = (body ?? {}) as Partial<WeddingContent>;

  const music = clean(input.music, 1000);
  if (music && !/^(\/[^/]|https:\/\/)/.test(music)) throw new ContentError("Nhạc nền: đường dẫn không hợp lệ");

  return {
    groom: person(input.groom, "Chú rể"),
    bride: person(input.bride, "Cô dâu"),
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
        venue: required(e?.venue, `${label} — địa điểm`, 150),
        address: required(e?.address, `${label} — địa chỉ`, 300),
        image: image(e?.image, `${label} — ảnh`),
        main: Boolean(e?.main),
      };
    }),
    mapQuery: required(input.mapQuery, "Địa chỉ bản đồ", 300),
    story: list(input.story, "Chuyện tình", 0, 20).map((s, i) => {
      const label = `Chuyện tình ${i + 1}`;
      return {
        date: clean(s?.date, 100),
        title: required(s?.title, `${label} — tiêu đề`, 150),
        text: clean(s?.text, 1000),
        image: image(s?.image, `${label} — ảnh`),
      };
    }),
    gallery: list(input.gallery, "Album", 0, 1000)
      .filter((src) => clean(src, 1000))
      .slice(0, 100)
      .map((src, i) => image(src, `Album — ảnh ${i + 1}`)),
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
