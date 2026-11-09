"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCountdown } from "@/lib/hooks";
import { Heart } from "lucide-react";
import { dateParts } from "@/lib/format";
import { useWedding } from "./WeddingProvider";
import { Reveal } from "./ui/Reveal";
import { SectionTitle } from "./ui/SectionTitle";
import { FloralCorner } from "./ui/Ornament";

function FlipNumber({ value, label }: { value: number | null; label: string }) {
  const text = value === null ? "--" : String(value).padStart(2, "0");
  return (
    <div className="flex flex-col items-center">
      <div className="relative flex h-20 w-16 items-center justify-center overflow-hidden rounded-2xl border border-gold/20 bg-white/70 shadow-[0_10px_30px_rgba(176,141,87,0.15)] backdrop-blur pointer-coarse:bg-white/85 pointer-coarse:backdrop-blur-none sm:h-28 sm:w-24 md:h-32 md:w-28">
        <span className="absolute inset-x-0 top-1/2 h-px bg-gold/15" />
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={text}
            initial={{ y: "-100%", opacity: 0, rotateX: 90 }}
            animate={{ y: 0, opacity: 1, rotateX: 0 }}
            exit={{ y: "100%", opacity: 0, rotateX: -90 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="font-serif text-4xl font-semibold text-wine lining-nums tabular-nums sm:text-5xl md:text-6xl"
          >
            {text}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="mt-3 text-[11px] tracking-[0.3em] text-muted uppercase sm:text-xs">{label}</span>
    </div>
  );
}

function MonthCalendar() {
  const wedding = useWedding();
  const { month, year } = dateParts(wedding.date);
  const weddingDays = new Set(
    wedding.events.map((e) => dateParts(e.start)).filter((d) => d.month === month).map((d) => d.day),
  );
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  // Lịch bắt đầu từ Thứ Hai
  const offset = (firstWeekday + 6) % 7;
  const cells = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <div className="mx-auto w-full max-w-sm rounded-3xl border border-gold/20 bg-white/70 p-6 shadow-[0_20px_50px_rgba(176,141,87,0.15)] backdrop-blur pointer-coarse:bg-white/85 pointer-coarse:backdrop-blur-none md:p-8">
      <p className="text-center font-serif text-2xl text-ink">
        Tháng {month} <span className="text-gold">/</span> {year}
      </p>
      <div className="mt-5 grid grid-cols-7 gap-y-2 text-center text-xs font-medium text-muted">
        {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => (
          <span key={d} className="py-1">
            {d}
          </span>
        ))}
        {cells.map((d, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.015 }}
            className="relative flex aspect-square items-center justify-center font-serif text-base"
          >
            {d !== null && weddingDays.has(d) ? (
              <>
                <Heart className="absolute size-10 animate-heartbeat fill-rose text-rose" />
                <span className="relative font-semibold text-white">{d}</span>
              </>
            ) : (
              <span className="text-ink/80">{d}</span>
            )}
          </motion.span>
        ))}
      </div>
    </div>
  );
}

export function Countdown() {
  const wedding = useWedding();
  const time = useCountdown(wedding.date);

  return (
    <section id="countdown" className="paper-texture relative overflow-hidden px-4 py-24 md:py-32">
      <FloralCorner className="pointer-events-none absolute -top-6 -right-6 w-44 rotate-180 text-gold/40 md:w-72" />
      <FloralCorner className="pointer-events-none absolute -bottom-6 -left-6 w-44 text-gold/40 md:w-72" />

      <Reveal className="mx-auto mb-20 max-w-3xl text-center">
        <p className="font-serif text-2xl leading-relaxed text-ink/80 italic md:text-3xl">“{wedding.quote}”</p>
        <p className="mt-4 text-xs tracking-[0.3em] text-gold uppercase">— {wedding.quoteAuthor}</p>
      </Reveal>

      <SectionTitle script="Save the date" title="Đếm ngược ngày vui" />

      <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2">
        <Reveal direction="left" className="flex justify-center gap-3 sm:gap-5">
          <FlipNumber value={time?.days ?? null} label="Ngày" />
          <FlipNumber value={time?.hours ?? null} label="Giờ" />
          <FlipNumber value={time?.minutes ?? null} label="Phút" />
          <FlipNumber value={time?.seconds ?? null} label="Giây" />
        </Reveal>
        <Reveal direction="right">
          <MonthCalendar />
        </Reveal>
      </div>
    </section>
  );
}
