"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "motion/react";
import { Heart } from "lucide-react";
import { useWedding } from "./WeddingProvider";

export function Footer() {
  const wedding = useWedding();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const scale = useTransform(scrollYProgress, [0, 1], [1.3, 1]);
  const textY = useTransform(scrollYProgress, [0, 1], [120, 0]);

  return (
    <footer ref={ref} className="relative flex min-h-svh items-center justify-center overflow-hidden px-4 pt-24 pb-32">
      <motion.div style={{ scale }} className="absolute inset-0">
        <Image src={wedding.footerImage} alt="" fill sizes="100vw" className="object-cover" />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/50" />

      <motion.div style={{ y: textY }} className="relative text-center text-ivory">
        <p className="font-serif text-xs tracking-[0.5em] text-gold-light uppercase md:text-sm">Hẹn gặp bạn tại lễ cưới</p>
        <h2 className="text-gold-gradient mt-4 py-4 font-script text-7xl md:text-9xl">Thank you</h2>
        <p className="mx-auto mt-4 max-w-xl font-serif text-lg text-ivory/85 italic md:text-xl">
          Cảm ơn bạn đã dành thời gian quý báu để chia vui cùng chúng mình. Sự hiện diện của bạn là niềm hạnh phúc lớn
          nhất!
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-2 font-script text-4xl sm:flex-row sm:gap-4 md:text-5xl">
          <span>{wedding.groom.name}</span>
          <Heart className="size-6 animate-heartbeat fill-rose text-rose" />
          <span>{wedding.bride.name}</span>
        </div>
        <p className="mt-4 font-serif tracking-[0.4em] text-ivory/70">{wedding.displayDate}</p>
      </motion.div>

      <p className="absolute bottom-24 left-1/2 -translate-x-1/2 text-[11px] tracking-widest whitespace-nowrap text-ivory/40 md:bottom-6">
        Made with ♥ for our special day
      </p>
    </footer>
  );
}
