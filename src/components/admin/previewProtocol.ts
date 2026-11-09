import type { WeddingContent } from "@/config/wedding";

/** Các tab chỉnh sửa, mỗi tab ứng với một phần trên web thật */
export const PREVIEW_SECTIONS = [
  { id: "home", label: "Trang chủ" },
  { id: "countdown", label: "Đếm ngược" },
  { id: "couple", label: "Cô dâu & Chú rể" },
  { id: "story", label: "Chuyện tình" },
  { id: "events", label: "Sự kiện" },
  { id: "gallery", label: "Album" },
  { id: "rsvp", label: "Xác nhận" },
  { id: "gift", label: "Mừng cưới" },
  { id: "footer", label: "Cuối trang & nhạc" },
] as const;

export type PreviewSection = (typeof PREVIEW_SECTIONS)[number]["id"];

export const PREVIEW_READY = "wedding-preview-ready";
export const PREVIEW_UPDATE = "wedding-preview-update";

export type PreviewMessage = { type: typeof PREVIEW_UPDATE; content: WeddingContent; section: PreviewSection };
