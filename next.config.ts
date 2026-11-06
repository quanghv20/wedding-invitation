import type { NextConfig } from "next";

/** STATIC_EXPORT=1 → xuất web tĩnh ra /out (dùng cho Netlify Drop / hosting tĩnh, không có API) */
const staticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  output: staticExport ? "export" : undefined,
  // bản tĩnh chỉ lấy trang (.tsx), bỏ qua API route (route.ts) vốn cần server
  pageExtensions: staticExport ? ["tsx"] : ["tsx", "ts", "jsx", "js"],
  images: {
    unoptimized: staticExport,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "img.vietqr.io" },
    ],
  },
};

export default nextConfig;
