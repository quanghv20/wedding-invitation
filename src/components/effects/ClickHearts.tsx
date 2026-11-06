"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

type Burst = { id: number; x: number; y: number };

/** Chạm/click ở bất kỳ đâu sẽ bung ra những trái tim nhỏ */
export function ClickHearts() {
  const [bursts, setBursts] = useState<Burst[]>([]);

  useEffect(() => {
    // dùng "click" thay vì "pointerdown" để thao tác cuộn trên điện thoại không bắn tim
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, select, iframe")) return;
      const burst = { id: Date.now() + Math.random(), x: e.clientX, y: e.clientY };
      setBursts((prev) => [...prev.slice(-6), burst]);
      setTimeout(() => setBursts((prev) => prev.filter((b) => b.id !== burst.id)), 1200);
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[120]" aria-hidden>
      <AnimatePresence>
        {bursts.map((b) =>
          Array.from({ length: 6 }, (_, i) => {
            const angle = (i / 6) * Math.PI * 2 + Math.random() * 0.5;
            const distance = 30 + Math.random() * 30;
            return (
              <motion.span
                key={`${b.id}-${i}`}
                initial={{ x: b.x - 6, y: b.y - 6, scale: 0, opacity: 1 }}
                animate={{
                  x: b.x - 6 + Math.cos(angle) * distance,
                  y: b.y - 6 + Math.sin(angle) * distance - 20,
                  scale: [0, 1.2, 0.8],
                  opacity: [1, 1, 0],
                }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="absolute top-0 left-0 text-xs text-rose"
              >
                ♥
              </motion.span>
            );
          }),
        )}
      </AnimatePresence>
    </div>
  );
}
