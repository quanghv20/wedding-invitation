import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Cormorant_Garamond, Great_Vibes } from "next/font/google";
import { wedding } from "@/config/wedding";
import "./globals.css";

const greatVibes = Great_Vibes({
  weight: "400",
  subsets: ["latin", "vietnamese"],
  variable: "--font-great-vibes",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-cormorant",
  display: "swap",
});

const beVietnam = Be_Vietnam_Pro({
  weight: ["300", "400", "500", "600"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-be-vietnam",
  display: "swap",
});

const title = `${wedding.groom.name} & ${wedding.bride.name} — Thiệp mời cưới`;
const description = `Trân trọng kính mời bạn đến chung vui trong ngày trọng đại của ${wedding.groom.name} & ${wedding.bride.name}.`;

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    images: [{ url: wedding.hero.image, width: 1200, height: 630 }],
  },
};

export const viewport: Viewport = {
  themeColor: "#fdf9f3",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="vi"
      className={`${greatVibes.variable} ${cormorant.variable} ${beVietnam.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
