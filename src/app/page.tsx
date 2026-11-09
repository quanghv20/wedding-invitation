import type { Metadata } from "next";
import { connection } from "next/server";
import { Invitation } from "@/components/Invitation";
import { WeddingProvider } from "@/components/WeddingProvider";
import { getWeddingContent } from "@/lib/content";

/** Đọc lúc có khách truy cập (lúc build không có database); riêng bản tĩnh thì đọc lúc build */
async function loadContent() {
  if (process.env.STATIC_EXPORT !== "1") await connection();
  return getWeddingContent();
}

export async function generateMetadata(): Promise<Metadata> {
  const { groom, bride, hero } = await loadContent();
  const title = `${groom.name} & ${bride.name} — Thiệp mời cưới`;
  const description = `Trân trọng kính mời bạn đến chung vui trong ngày trọng đại của ${groom.name} & ${bride.name}.`;
  return {
    title,
    description,
    openGraph: { title, description, type: "website", images: [{ url: hero.image, width: 1200, height: 630 }] },
  };
}

export default async function Home() {
  return (
    <WeddingProvider content={await loadContent()}>
      <Invitation />
    </WeddingProvider>
  );
}
