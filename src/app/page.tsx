import type { Metadata } from "next";
import { connection } from "next/server";
import { Invitation } from "@/components/Invitation";
import { WeddingProvider } from "@/components/WeddingProvider";
import { mainEventOf } from "@/config/wedding";
import { getWeddingContent } from "@/lib/content";
import { formatDate, formatTime } from "@/lib/format";

/** Đọc lúc có khách truy cập (lúc build không có database); riêng bản tĩnh thì đọc lúc build */
async function loadContent() {
  if (process.env.STATIC_EXPORT !== "1") await connection();
  return getWeddingContent();
}

export async function generateMetadata(): Promise<Metadata> {
  const content = await loadContent();
  const { groom, bride, hero } = content;
  const event = mainEventOf(content);
  const title = `Thiệp cưới ${groom.name} & ${bride.name}`;
  const description =
    `Trân trọng kính mời bạn đến dự ${event.title.toLowerCase()} của chú rể ${groom.fullName} và cô dâu ${bride.fullName}, ` +
    `${formatTime(event.start)} ${formatDate(event.start)}, tại ${event.venue}, ${event.address}.`;
  return {
    title,
    description,
    alternates: { canonical: "/" },
    openGraph: {
      title,
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

export default async function Home() {
  return (
    <WeddingProvider content={await loadContent()}>
      <Invitation />
    </WeddingProvider>
  );
}
