"use client";

import { useEffect, useRef } from "react";
import {
  animate,
  motion,
  useAnimationControls,
  useMotionValue,
  useTransform,
  type MotionValue,
} from "motion/react";
import { goToGiftQr } from "./SmoothScroll";

/** Khoảng chừa cho nút nhạc ở góc phải trên */
const MUSIC_GAP = 72;
/** Bán kính vòng bay hình elip (px) — đủ rộng để hai bé tách nhau, chỉ chồng lên lúc bay ngang qua */
const RX = 46;
const RY = 13;

const loop = (duration: number) => ({ duration, repeat: Infinity, ease: "easeInOut" as const });
const TAU = Math.PI * 2;

/** Vị trí của một bé rồng trên vòng elip; bé ở phía trước (dưới) to hơn và nằm trên */
function useOrbit(t: MotionValue<number>, phase: number) {
  const angle = (v: number) => (v + phase) * TAU;
  return {
    x: useTransform(t, (v) => Math.cos(angle(v)) * RX),
    y: useTransform(t, (v) => Math.sin(angle(v)) * RY + Math.sin(angle(v) * 3) * 3),
    scale: useTransform(t, (v) => 0.86 + 0.14 * Math.sin(angle(v))),
    zIndex: useTransform(t, (v) => (Math.sin(angle(v)) > 0 ? 2 : 1)),
    // hướng mặt theo chiều bay (đạo hàm của cos là -sin)
    scaleX: useTransform(t, (v) => (-Math.sin(angle(v)) >= 0 ? 1 : -1)),
  };
}

/**
 * Đôi rồng (cô dâu & chú rể tuổi Thìn) bay vờn nhau ở mép trên trang.
 * Chạm vào để tới QR mừng cưới.
 */
export function GiftMascot() {
  const move = useAnimationControls();
  const boxRef = useRef<HTMLDivElement>(null);
  const t = useMotionValue(0);
  const groom = useOrbit(t, 0);
  const bride = useOrbit(t, 0.5);

  // hai bé đuổi nhau vòng quanh
  useEffect(() => {
    const controls = animate(t, [0, 1], { duration: 3.6, repeat: Infinity, ease: "linear" });
    return () => controls.stop();
  }, [t]);

  // cả cặp trôi qua lại dọc mép trên, ngang qua giữa màn hình
  useEffect(() => {
    let alive = true;
    (async () => {
      while (alive) {
        const w = boxRef.current?.offsetWidth ?? 180;
        const r = Math.max(0, window.innerWidth - w - MUSIC_GAP);
        await move.start({ x: r, transition: { duration: Math.max(3, r / 40), ease: "easeInOut" } });
        if (!alive) break;
        await move.start({ x: 0, transition: { duration: Math.max(3, r / 40), ease: "easeInOut" } });
      }
    })();
    return () => {
      alive = false;
      move.stop();
    };
  }, [move]);

  return (
    <motion.div ref={boxRef} animate={move} className="fixed top-1 left-1 z-50 md:top-3 md:left-3">
      <motion.button
        type="button"
        onClick={goToGiftQr}
        aria-label="Gửi quà mừng cưới online"
        initial={{ opacity: 0, scale: 0, y: -40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 12 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className="flex cursor-pointer items-center"
      >
        {/* khu vực vòng bay */}
        <span className="relative block h-[80px] w-[146px] md:h-[96px] md:w-[176px]">
          {/* tim bay lên giữa hai bé */}
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0], y: [0, -30], x: [(i - 1) * 4, (i - 1) * 14], scale: [0.5, 1.1] }}
              transition={{ duration: 1.8, delay: i * 0.6, repeat: Infinity, ease: "easeOut" }}
              className="absolute top-1/2 left-1/2 -ml-1.5 text-xs text-[#e63946]"
            >
              ♥
            </motion.span>
          ))}

          {[
            { pos: groom, kind: "groom" as const },
            { pos: bride, kind: "bride" as const },
          ].map(({ pos, kind }) => (
            <motion.span
              key={kind}
              style={{ x: pos.x, y: pos.y, scale: pos.scale, zIndex: pos.zIndex }}
              className="absolute top-1/2 left-1/2 -mt-[28px] -ml-[33px] block md:-mt-[34px] md:-ml-[40px]"
            >
              <motion.span style={{ scaleX: pos.scaleX }} className="block">
                <Dragon kind={kind} />
              </motion.span>
            </motion.span>
          ))}
        </span>

        {/* bong bóng lời nhắc — tạm ẩn (bỏ class "hidden" để hiện lại) */}
        <span className="relative ml-1 hidden rounded-2xl border-2 border-wine/70 bg-white px-3 py-1.5 text-left shadow-[0_8px_20px_rgba(110,40,56,0.22)]">
          <span className="block text-[9px] font-bold tracking-[0.15em] text-rose uppercase md:text-[10px]">
            Mừng cưới online
          </span>
          <span className="block text-xs font-bold whitespace-nowrap text-wine md:text-sm">Gửi lời chúc phúc 💐</span>
        </span>
      </motion.button>
    </motion.div>
  );
}

const palettes = {
  groom: { light: "#3fd99b", dark: "#139065", fin: "#0d6b4a", jaw: "#7ee8bd", line: "#163a2f" },
  bride: { light: "#d7c2ff", dark: "#9a74e8", fin: "#7a55cf", jaw: "#ece2ff", line: "#3b2a5c" },
};

/**
 * Bé rồng vẽ bằng SVG (khung 140×120): chú rể đeo kính râm + nơ, cô dâu đội voan cài hoa.
 * Cánh xoay quanh gốc cánh ở vai.
 */
function Dragon({ kind }: { kind: "groom" | "bride" }) {
  const c = palettes[kind];
  const id = `dg-${kind}`;
  const stroke = { stroke: c.line, strokeWidth: 3, strokeLinejoin: "round" as const };
  // hai bé vỗ cánh lệch nhịp cho tự nhiên
  const beat = kind === "groom" ? 0.32 : 0.36;

  return (
    <svg
      viewBox="0 0 140 120"
      className="h-[56px] w-[66px] overflow-visible [filter:drop-shadow(0_0_1.2px_#fff)_drop-shadow(0_4px_5px_rgba(40,30,60,0.3))] pointer-coarse:[filter:none] md:h-[68px] md:w-[80px]"
      aria-hidden
    >
      <defs>
        <radialGradient id={`${id}-skin`} cx="0.4" cy="0.3" r="0.8">
          <stop offset="0" stopColor={c.light} />
          <stop offset="1" stopColor={c.dark} />
        </radialGradient>
        <linearGradient id={`${id}-wing`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd23f" />
          <stop offset="1" stopColor="#ff8a00" />
        </linearGradient>
      </defs>

      <motion.g animate={{ y: [0, -4, 0] }} transition={loop(beat)}>
        {/* khăn voan cô dâu (sau lưng) */}
        {kind === "bride" && (
          <motion.path
            d="M52 26 C 30 40, 26 80, 36 104 C 50 96, 60 100, 70 92 C 80 100, 90 96, 104 104 C 114 80, 110 40, 88 26 Z"
            fill="#ffffff"
            opacity="0.85"
            stroke="#e5dcf5"
            strokeWidth="2"
            animate={{ skewX: [-3, 3, -3] }}
            transition={loop(1.2)}
          />
        )}

        {/* cánh */}
        <motion.g animate={{ rotate: [-20, 35, -20] }} transition={loop(beat)} style={{ originX: 1, originY: 0.85 }}>
          <path
            d="M56 76 C 44 50, 20 36, 4 42 C 12 48, 13 55, 9 62 C 18 60, 23 65, 22 72 C 30 68, 36 72, 37 79 C 43 75, 49 75, 56 81 Z"
            fill={`url(#${id}-wing)`}
            {...stroke}
          />
        </motion.g>
        <motion.g animate={{ rotate: [20, -35, 20] }} transition={loop(beat)} style={{ originX: 0, originY: 0.85 }}>
          <path
            d="M84 76 C 96 50, 120 36, 136 42 C 128 48, 127 55, 131 62 C 122 60, 117 65, 118 72 C 110 68, 104 72, 103 79 C 97 75, 91 75, 84 81 Z"
            fill={`url(#${id}-wing)`}
            {...stroke}
          />
        </motion.g>

        {/* đuôi chóp tim */}
        <motion.g animate={{ rotate: [-14, 14, -14] }} transition={loop(0.7)} style={{ originX: 0, originY: 0 }}>
          <path d="M80 102 C 98 110, 112 104, 116 92" fill="none" stroke={c.line} strokeWidth="12" strokeLinecap="round" />
          <path d="M80 102 C 98 110, 112 104, 116 92" fill="none" stroke={c.dark} strokeWidth="7" strokeLinecap="round" />
          <path
            d="M116 95 C 108 89, 110 80, 115 81 C 117 81, 118 83, 118 84 C 119 82, 121 80, 123 82 C 127 85, 122 92, 116 95 Z"
            fill="#e63946"
            stroke={c.line}
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </motion.g>

        {/* chân + thân */}
        <ellipse cx="61" cy="109" rx="8" ry="7" fill={`url(#${id}-skin)`} {...stroke} />
        <ellipse cx="79" cy="109" rx="8" ry="7" fill={`url(#${id}-skin)`} {...stroke} />
        <ellipse cx="70" cy="90" rx="21" ry="19" fill={`url(#${id}-skin)`} {...stroke} />
        <path d="M60 80 Q70 76 80 80 L78 104 Q70 108 62 104 Z" fill="#ffe08a" />
        <rect x="49" y="80" width="10" height="17" rx="5" transform="rotate(30 54 80)" fill={`url(#${id}-skin)`} {...stroke} />
        <rect x="81" y="80" width="10" height="17" rx="5" transform="rotate(-30 86 80)" fill={`url(#${id}-skin)`} {...stroke} />

        {/* nơ chú rể */}
        {kind === "groom" && (
          <g>
            <path d="M70 79 L60 74 L60 85 Z M70 79 L80 74 L80 85 Z" fill="#1d1d26" stroke={c.line} strokeWidth="1.5" strokeLinejoin="round" />
            <circle cx="70" cy="79.5" r="3" fill="#1d1d26" />
          </g>
        )}

        {/* đầu */}
        <g>
          <path d="M55 30 C 46 24, 40 14, 37 5 C 46 9, 57 17, 62 27 Z" fill="#fff3d6" {...stroke} />
          <path d="M85 30 C 94 24, 100 14, 103 5 C 94 9, 83 17, 78 27 Z" fill="#fff3d6" {...stroke} />
          <path d="M41 45 L24 36 L30 49 L22 56 L41 54 Z" fill={c.fin} {...stroke} />
          <path d="M99 45 L116 36 L110 49 L118 56 L99 54 Z" fill={c.fin} {...stroke} />
          <path d="M61 25 L65 14 L69 23 L73 12 L77 23 L80 16 L82 26" fill="#ff8a1f" {...stroke} strokeWidth={2} />

          <ellipse cx="70" cy="48" rx="31" ry="25" fill={`url(#${id}-skin)`} {...stroke} />
          <ellipse cx="70" cy="61" rx="17" ry="9.5" fill={c.jaw} />
          <ellipse cx="64.5" cy="57.5" rx="1.6" ry="1.2" fill={c.line} />
          <ellipse cx="75.5" cy="57.5" rx="1.6" ry="1.2" fill={c.line} />
          <ellipse cx="46" cy="56" rx="5" ry="3" fill="#ff8fab" opacity="0.7" />
          <ellipse cx="94" cy="56" rx="5" ry="3" fill="#ff8fab" opacity="0.7" />

          {kind === "groom" ? (
            <>
              {/* kính râm + nhếch mép */}
              <path
                d="M46 40 H66 Q66 53 56.5 53 Q46 53 46 44 Z M74 40 H94 V44 Q94 53 83.5 53 Q74 53 74 40 Z"
                fill="#15151d"
                stroke={c.line}
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path d="M66 42 H74" stroke="#15151d" strokeWidth="3" strokeLinecap="round" />
              <path d="M50 43 L54 43 M78 43 L82 43" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
              <path d="M62 64 Q70 67.5 79 61" fill="none" stroke={c.line} strokeWidth="2.4" strokeLinecap="round" />
              <path d="M74.5 64.3 L76 68 L77.5 63.2" fill="#fff" stroke={c.line} strokeWidth="1.2" strokeLinejoin="round" />
            </>
          ) : (
            <>
              {/* mắt long lanh + mi cong + cười */}
              <motion.g
                animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
                transition={{ duration: 3, repeat: Infinity, times: [0, 0.9, 0.93, 0.96, 1] }}
                style={{ originX: 0.5, originY: 0.5 }}
              >
                <ellipse cx="57" cy="46" rx="6" ry="7" fill="#24183a" />
                <circle cx="59.2" cy="43.2" r="2.4" fill="#fff" />
                <circle cx="55.2" cy="49.2" r="1.2" fill="#fff" />
                <ellipse cx="83" cy="46" rx="6" ry="7" fill="#24183a" />
                <circle cx="85.2" cy="43.2" r="2.4" fill="#fff" />
                <circle cx="81.2" cy="49.2" r="1.2" fill="#fff" />
              </motion.g>
              <path
                d="M51 41 L47 37 M53 39.5 L50.5 35 M89 41 L93 37 M87 39.5 L89.5 35"
                stroke={c.line}
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path d="M64 63 Q70 70 76 63" fill="#e0567f" stroke={c.line} strokeWidth="2" strokeLinejoin="round" />
              {/* hoa cài voan */}
              <g transform="translate(92 22)">
                {[0, 72, 144, 216, 288].map((a) => (
                  <ellipse key={a} cx="0" cy="-5" rx="3.6" ry="5" fill="#fff" stroke="#f2a7bf" strokeWidth="1.2" transform={`rotate(${a})`} />
                ))}
                <circle r="3" fill="#ffcf4d" />
              </g>
            </>
          )}
        </g>
      </motion.g>
    </svg>
  );
}
