import type { Metadata } from "next";
import { connection } from "next/server";
import { Invitation } from "@/components/Invitation";
import { WeddingProvider } from "@/components/WeddingProvider";
import { mainEventOf } from "@/config/wedding";
import { getWeddingContent } from "@/lib/content";
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

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const [content, guest] = await Promise.all([loadContent(), loadGuest(searchParams)]);
  const { groom, bride, hero } = content;
  const event = mainEventOf(content);
  const title = `Thiệp cưới ${groom.name} & ${bride.name}`;
  // link gửi qua Zalo / Messenger hiện luôn tên người được mời trong phần xem trước
  const description =
    `Trân trọng kính mời ${guest ? inviteeOf(guest) : "bạn"} đến dự ${event.title.toLowerCase()} của chú rể ${groom.fullName} và cô dâu ${bride.fullName}, ` +
    `${formatTime(event.start)} ${formatDate(event.start)}, tại ${event.venue}, ${event.address}.`;
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
  const [content, guest] = await Promise.all([loadContent(), loadGuest(searchParams)]);
  return (
    <WeddingProvider content={content} guest={guest}>
      <Invitation />
    </WeddingProvider>
  );
}
