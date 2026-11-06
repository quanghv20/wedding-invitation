"use client";

import { motion } from "motion/react";

/** Đường hoa văn vàng tự "vẽ" khi cuộn tới */
export function Ornament({ className = "" }: { className?: string }) {
  const draw = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: { pathLength: 1, opacity: 1, transition: { duration: 1.8, ease: "easeInOut" as const } },
  };

  return (
    <motion.svg
      viewBox="0 0 240 30"
      fill="none"
      className={`h-6 w-48 text-gold ${className}`}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      <motion.path
        variants={draw}
        d="M2 15 H86 M154 15 H238"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <motion.path
        variants={draw}
        d="M86 15 C 96 3, 108 3, 112 15 C 108 27, 96 27, 86 15 M154 15 C 144 3, 132 3, 128 15 C 132 27, 144 27, 154 15"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <motion.path
        variants={draw}
        d="M120 6 C 116 1, 109 4, 112 10 L120 20 L128 10 C 131 4, 124 1, 120 6 Z"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="currentColor"
        fillOpacity="0.25"
      />
    </motion.svg>
  );
}

/** Họa tiết hoa góc trang trí */
export function FloralCorner({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" className={className} aria-hidden>
      <g stroke="currentColor" strokeWidth="1" strokeLinecap="round">
        <path d="M4 196 C 40 150, 60 100, 120 70 S 190 20, 196 4" />
        <path d="M40 150 C 30 130, 40 112, 60 108 C 58 128, 52 140, 40 150 Z" fill="currentColor" fillOpacity=".12" />
        <path d="M70 110 C 66 88, 80 72, 100 72 C 94 92, 84 102, 70 110 Z" fill="currentColor" fillOpacity=".12" />
        <path d="M60 128 C 80 132, 96 124, 104 108 C 84 106, 70 114, 60 128 Z" fill="currentColor" fillOpacity=".12" />
        <path d="M110 76 C 130 80, 146 70, 150 54 C 132 52, 118 60, 110 76 Z" fill="currentColor" fillOpacity=".12" />
        <path d="M140 46 C 138 28, 150 14, 168 14 C 164 32, 154 40, 140 46 Z" fill="currentColor" fillOpacity=".12" />
        <circle cx="120" cy="70" r="7" fill="currentColor" fillOpacity=".2" />
        <circle cx="120" cy="70" r="3" fill="currentColor" fillOpacity=".4" />
        <circle cx="40" cy="150" r="5" fill="currentColor" fillOpacity=".2" />
        <circle cx="168" cy="30" r="4" fill="currentColor" fillOpacity=".25" />
      </g>
    </svg>
  );
}
