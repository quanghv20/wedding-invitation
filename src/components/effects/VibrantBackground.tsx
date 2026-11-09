import type { CSSProperties } from "react";

const blobs = [
  { color: "#ff8fb1", className: "-top-[10%] -left-[20%] size-[85vw] md:size-[45vw]", x: [60, -20], y: [40, 80] },
  { color: "#ffc46b", className: "top-[5%] -right-[25%] size-[80vw] md:size-[40vw]", x: [-50, 20], y: [60, -20] },
  { color: "#c3a6ff", className: "top-[45%] -left-[25%] size-[75vw] md:size-[38vw]", x: [40, 70], y: [-50, 20] },
  { color: "#ff9e7a", className: "-bottom-[10%] -right-[15%] size-[80vw] md:size-[42vw]", x: [-60, -10], y: [-30, -70] },
  { color: "#ffd6e7", className: "top-[30%] left-[25%] size-[60vw] md:size-[30vw]", x: [30, -40], y: [-40, 30] },
];

const sparkles = Array.from({ length: 18 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  top: `${(i * 53) % 100}%`,
  delay: (i % 6) * 0.6,
  size: 6 + (i % 4) * 3,
}));

/**
 * Nền gradient tươi sáng với các mảng màu trôi chậm và đốm lấp lánh.
 * Chuyển động dùng CSS để chạy trên GPU, không chiếm luồng chính khi cuộn.
 */
export function VibrantBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden bg-[linear-gradient(160deg,#fff0f5_0%,#fff6e9_40%,#ffeef6_70%,#f3edff_100%)]">
      {blobs.map((b, i) => (
        <div
          key={i}
          className={`soft-blob-touch absolute animate-blob-drift rounded-full bg-(--blob) opacity-60 blur-[70px] will-change-transform md:blur-[90px] ${b.className}`}
          style={
            {
              "--blob": b.color,
              "--x1": `${b.x[0]}px`,
              "--y1": `${b.y[0]}px`,
              "--x2": `${b.x[1]}px`,
              "--y2": `${b.y[1]}px`,
              animationDuration: `${16 + i * 3}s`,
            } as CSSProperties
          }
        />
      ))}

      {/* lớp sáng ở giữa để chữ luôn dễ đọc */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.55),transparent_70%)]" />

      {sparkles.map((s, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className="absolute animate-sparkle text-white"
          style={{ left: s.left, top: s.top, width: s.size, height: s.size, animationDelay: `${s.delay}s` }}
        >
          <path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z" fill="currentColor" />
        </svg>
      ))}
    </div>
  );
}
