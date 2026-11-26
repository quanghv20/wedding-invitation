import type { Metadata } from "next";
import { connection } from "next/server";
import { Invitation } from "@/components/Invitation";
import { WeddingProvider } from "@/components/WeddingProvider";
import { eventPlaces, locationText, mainEventOf, type Side } from "@/config/wedding";
import { listAlbum } from "@/lib/albums";
import { getWeddingContent } from "@/lib/content";
import { fullAlbum } from "@/lib/images";
import { formatDate, formatTime } from "@/lib/format";
import { inviteeOf, type Guest } from "@/lib/guest";
import { findGuest } from "@/lib/guestStore";

const staticExport = process.env.STATIC_EXPORT === "1";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Đọc lúc có khách truy cập (lúc build không có database); riêng bản tĩnh thì đọc lúc build */
async function loadContent() {
  if (!staticExport) await connection();
  return getWeddingContent();
}

/** Khách của link mời riêng /?to=<id>; bản tĩnh không có database nên luôn là "Quý khách" */
async function loadGuest(searchParams: Props["searchParams"]): Promise<Guest | null> {
  if (staticExport) return null;
  const guest = await findGuest((await searchParams).to);
  // nhóm chỉ là nhãn nội bộ của admin, không gửi xuống trình duyệt của khách
  return guest && { ...guest, group: "" };
}

/**
 * Bên của khách (quyết định địa chỉ hiển thị); null là hiện cả hai.
 * - Link mời riêng mà khách đã ghi bên: theo bên đang lưu trong admin, để đổi bên sau khi
 *   đã gửi link thì link cũ (có &side= cũ) vẫn hiện đúng.
 * - Còn lại: ?side=groom / ?side=bride trên link (link cũ ?ben=trai / ?ben=gai vẫn nhận).
 */
async function loadSide(searchParams: Props["searchParams"], guest: Guest | null): Promise<Side | null> {
  if (staticExport) return null;
  if (guest?.side) return guest.side;
  const params = await searchParams;
  const raw = params.side ?? params.ben;
  const value = (Array.isArray(raw) ? raw[0] : raw)?.toLowerCase().replace(/[\s_-]/g, "");
  if (value && ["trai", "nhatrai", "groom"].includes(value)) return "groom";
  if (value && ["gai", "nhagai", "bride"].includes(value)) return "bride";
  return null;
}

async function load(searchParams: Props["searchParams"]) {
  const [content, guest] = await Promise.all([loadContent(), loadGuest(searchParams)]);
  return { content, guest, side: await loadSide(searchParams, guest) };
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { content, guest, side } = await load(searchParams);
  const { groom, bride, hero } = content;
  const event = mainEventOf(content);
  const title = `Thiệp cưới ${groom.name} & ${bride.name}`;
  const where = locationText(eventPlaces(content, event, side));
  // link gửi qua Zalo / Messenger hiện luôn tên người được mời trong phần xem trước
  const description =
    `Trân trọng kính mời ${guest ? inviteeOf(guest) : "bạn"} đến dự ${event.title.toLowerCase()} của chú rể ${groom.fullName} và cô dâu ${bride.fullName}, ` +
    `${formatTime(event.start)} ${formatDate(event.start)}, tại ${where}.`;
  return {
    title,
    description,
    alternates: { canonical: "/" },
    openGraph: {
      title: guest ? `${title} — kính mời ${inviteeOf(guest)}` : title,
      description,
      type: "website",
      url: "/",
      siteName: title,
      locale: "vi_VN",
      images: [{ url: hero.image, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [hero.image] },
  };
}

export default async function Home({ searchParams }: Props) {
  const [{ content, guest, side }, files] = await Promise.all([load(searchParams), listAlbum()]);
  const album = fullAlbum(files, content.galleryOrder ?? [], content.gallery);
  return (
    <WeddingProvider content={content} guest={guest} side={side} album={album}>
      <Invitation />
    </WeddingProvider>
  );
}
