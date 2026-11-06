"use client";

import { motion } from "motion/react";

const blobs = [
  { color: "#ff8fb1", className: "-top-[10%] -left-[20%] size-[85vw] md:size-[45vw]", x: [0, 60, -20, 0], y: [0, 40, 80, 0] },
  { color: "#ffc46b", className: "top-[5%] -right-[25%] size-[80vw] md:size-[40vw]", x: [0, -50, 20, 0], y: [0, 60, -20, 0] },
  { color: "#c3a6ff", className: "top-[45%] -left-[25%] size-[75vw] md:size-[38vw]", x: [0, 40, 70, 0], y: [0, -50, 20, 0] },
  { color: "#ff9e7a", className: "-bottom-[10%] -right-[15%] size-[80vw] md:size-[42vw]", x: [0, -60, -10, 0], y: [0, -30, -70, 0] },
  { color: "#ffd6e7", className: "top-[30%] left-[25%] size-[60vw] md:size-[30vw]", x: [0, 30, -40, 0], y: [0, -40, 30, 0] },
];

const sparkles = Array.from({ length: 18 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  top: `${(i * 53) % 100}%`,
  delay: (i % 6) * 0.6,
  size: 6 + (i % 4) * 3,
}));

/** Nền gradient tươi sáng với các mảng màu trôi chậm và đốm lấp lánh */
export function VibrantBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden bg-[linear-gradient(160deg,#fff0f5_0%,#fff6e9_40%,#ffeef6_70%,#f3edff_100%)]">
      {blobs.map((b, i) => (
        <motion.div
          key={i}
          animate={{ x: b.x, y: b.y, scale: [1, 1.15, 0.95, 1] }}
          transition={{ duration: 16 + i * 3, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute rounded-full opacity-60 blur-[70px] md:blur-[90px] ${b.className}`}
          style={{ backgroundColor: b.color }}
        />
      ))}

      {/* lớp sáng ở giữa để chữ luôn dễ đọc */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.55),transparent_70%)]" />

      {sparkles.map((s, i) => (
        <motion.svg
          key={i}
          viewBox="0 0 24 24"
          className="absolute text-white"
          style={{ left: s.left, top: s.top, width: s.size, height: s.size }}
          animate={{ opacity: [0, 1, 0], scale: [0.4, 1, 0.4], rotate: [0, 90] }}
          transition={{ duration: 3, delay: s.delay, repeat: Infinity }}
        >
          <path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z" fill="currentColor" />
        </motion.svg>
      ))}
    </div>
  );
}
