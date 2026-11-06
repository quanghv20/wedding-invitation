"use client";

import { useEffect } from "react";
import Lenis from "lenis";

let lenis: Lenis | null = null;

export function scrollToId(id: string, offset = 0) {
  const el = document.getElementById(id);
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { duration: 1.6, offset });
  else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset, behavior: "smooth" });
}

/** Cuộn tới khu QR mừng cưới và báo cho các thẻ QR nháy sáng */
export function goToGiftQr() {
  scrollToId("gift-qr", -110);
  setTimeout(() => window.dispatchEvent(new Event("gift:highlight")), 1300);
}

/** Cuộn mượt toàn trang */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    lenis = new Lenis({ autoRaf: true, lerp: 0.09 });
    return () => {
      lenis?.destroy();
      lenis = null;
    };
  }, []);

  return null;
}
