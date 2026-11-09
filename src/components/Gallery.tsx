"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { useWedding } from "./WeddingProvider";
import { SectionTitle } from "./ui/SectionTitle";

const slide: Variants = {
  enter: (d: number) => ({ opacity: 0, x: d * 120, scale: d === 0 ? 0.85 : 1 }),
  center: { opacity: 1, x: 0, scale: 1 },
  exit: (d: number) => ({ opacity: 0, x: d * -120 }),
};
const aspects = ["aspect-[3/4]", "aspect-square", "aspect-[4/5]", "aspect-[3/4]", "aspect-[4/3]", "aspect-[2/3]"];

function Lightbox({ index, onClose, onChange }: { index: number; onClose: () => void; onChange: (i: number) => void }) {
  const { gallery: photos } = useWedding();
  const [direction, setDirection] = useState(0);

  const go = useCallback(
    (step: number) => {
      setDirection(step);
      onChange((index + step + photos.length) % photos.length);
    },
    [index, onChange, photos.length],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      data-lenis-prevent
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-md pointer-coarse:backdrop-blur-none"
      onClick={onClose}
    >
      <button
        type="button"
        aria-label="Đóng"
        className="absolute top-4 right-4 z-10 cursor-pointer rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
        onClick={onClose}
      >
        <X className="size-5" />
      </button>
      <p className="absolute top-6 left-1/2 -translate-x-1/2 font-serif text-sm tracking-[0.3em] text-white/70">
        {index + 1} / {photos.length}
      </p>

      <div className="relative h-[75vh] w-[92vw] max-w-5xl" onClick={(e) => e.stopPropagation()}>
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={index}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.6}
            onDragEnd={(_, info) => {
              if (info.offset.x < -80) go(1);
              else if (info.offset.x > 80) go(-1);
            }}
            className="absolute inset-0 cursor-grab active:cursor-grabbing"
          >
            <Image src={photos[index]} alt="" fill sizes="92vw" className="pointer-events-none object-contain" />
          </motion.div>
        </AnimatePresence>
      </div>

      {[-1, 1].map((step) => (
        <button
          key={step}
          type="button"
          aria-label={step < 0 ? "Ảnh trước" : "Ảnh sau"}
          onClick={(e) => {
            e.stopPropagation();
            go(step);
          }}
          className={`absolute top-1/2 hidden -translate-y-1/2 cursor-pointer rounded-full bg-white/10 p-3 text-white transition hover:scale-110 hover:bg-white/20 md:block ${
            step < 0 ? "left-6" : "right-6"
          }`}
        >
          {step < 0 ? <ChevronLeft className="size-6" /> : <ChevronRight className="size-6" />}
        </button>
      ))}
    </motion.div>
  );
}

export function Gallery() {
  const { gallery: photos } = useWedding();
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    document.documentElement.style.overflow = selected === null ? "" : "hidden";
  }, [selected]);

  return (
    <section id="gallery" className="paper-texture px-4 py-24 md:py-32">
      <SectionTitle
        script="Our moments"
        title="Album hình cưới"
        description="Những khung hình lưu giữ yêu thương — chạm vào ảnh để xem rõ hơn."
      />

      <div className="mx-auto max-w-6xl columns-2 gap-3 md:columns-3 md:gap-5">
        {photos.map((src, i) => (
          <motion.button
            key={src}
            type="button"
            onClick={() => setSelected(i)}
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, delay: (i % 3) * 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="group relative mb-3 block w-full cursor-zoom-in break-inside-avoid overflow-hidden rounded-2xl md:mb-5"
          >
            <div className={`relative w-full ${aspects[i % aspects.length]}`}>
              <Image
                src={src}
                alt={`Ảnh cưới ${i + 1}`}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-110"
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-wine/0 transition duration-500 group-hover:bg-wine/30">
              <Expand className="size-8 scale-50 text-white opacity-0 transition duration-500 group-hover:scale-100 group-hover:opacity-100" />
            </div>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {selected !== null && (
          <Lightbox index={selected} onClose={() => setSelected(null)} onChange={setSelected} />
        )}
      </AnimatePresence>
    </section>
  );
}
