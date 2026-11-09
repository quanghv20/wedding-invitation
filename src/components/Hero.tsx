"use client";

import Image from "next/image";
import { motion, type Variants } from "motion/react";
import { CalendarPlus, Clock, Gift, MapPin, Navigation, Send } from "lucide-react";
import { mainEventOf } from "@/config/wedding";
import { dateParts, formatTime, googleCalendarUrl, mapsUrl, weekdayName } from "@/lib/format";
import { useCountdown, useGuestName } from "@/lib/hooks";
import { useWedding } from "./WeddingProvider";
import { VibrantBackground } from "./effects/VibrantBackground";
import { FloralCorner } from "./ui/Ornament";
import { goToGiftQr, scrollToId } from "./SmoothScroll";

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 30, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } },
};

const pad = (n: number) => String(n).padStart(2, "0");

function DateBlock() {
  const wedding = useWedding();
  /** Các ngày diễn ra sự kiện (không trùng lặp), theo thứ tự */
  const days = Array.from(
    new Map(
      wedding.events.map((e) => {
        const d = dateParts(e.start);
        return [`${d.year}-${d.month}-${d.day}`, { ...d, iso: e.start }];
      }),
    ).values(),
  );
  const first = days[0];
  const last = days[days.length - 1];
  const side = "w-24 border-y border-wine/30 py-1.5 text-[11px] font-semibold tracking-[0.2em] text-wine uppercase sm:w-28 sm:text-xs";

  return (
    <div className="flex flex-col items-center">
      <p className="text-xs font-semibold tracking-[0.4em] text-wine/80 uppercase">Tháng {first.month}</p>
      <div className="my-1 flex items-center gap-3 sm:gap-4">
        <span className={side}>{weekdayName(first.iso)}</span>
        <span className="text-vibrant-gradient font-serif text-5xl leading-none font-bold tracking-tight sm:text-6xl">
          {days.map((d) => pad(d.day)).join("·")}
        </span>
        <span className={side}>{days.length > 1 ? weekdayName(last.iso) : formatTime(first.iso)}</span>
      </div>
      <p className="text-xs font-semibold tracking-[0.4em] text-wine/80 uppercase">Năm {first.year}</p>
      <p className="mt-2 font-serif text-base text-ink/70 italic">({wedding.lunarDate})</p>
    </div>
  );
}

function MiniCountdown() {
  const wedding = useWedding();
  const time = useCountdown(wedding.date);
  const units = [
    { label: "Ngày", value: time?.days },
    { label: "Giờ", value: time?.hours },
    { label: "Phút", value: time?.minutes },
    { label: "Giây", value: time?.seconds },
  ];
  return (
    <div className="grid grid-cols-4 gap-2">
      {units.map((u) => (
        <div key={u.label} className="rounded-2xl bg-white/70 py-2 text-center shadow-sm ring-1 ring-white">
          <motion.p
            key={u.value}
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="font-serif text-2xl leading-none font-bold text-wine lining-nums tabular-nums"
          >
            {u.value === undefined ? "--" : pad(u.value)}
          </motion.p>
          <p className="mt-1 text-[10px] tracking-widest text-ink/60 uppercase">{u.label}</p>
        </div>
      ))}
    </div>
  );
}

function Schedule() {
  const wedding = useWedding();
  return (
    <ul className="space-y-2">
      {wedding.events.map((e) => {
        const d = dateParts(e.start);
        return (
          <li
            key={e.title}
            className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 ring-1 ${
              e.main ? "bg-gradient-to-r from-[#ff6f91] to-[#ff9671] text-white shadow-md ring-white/40" : "bg-white/70 ring-white"
            }`}
          >
            <span
              className={`flex w-14 shrink-0 flex-col items-center rounded-xl py-1 ${e.main ? "bg-white/20" : "bg-blush/70"}`}
            >
              <span className="font-serif text-lg leading-none font-bold">{formatTime(e.start)}</span>
              <span className={`text-[10px] ${e.main ? "text-white/85" : "text-ink/60"}`}>
                {pad(d.day)}/{pad(d.month)}
              </span>
            </span>
            <span className="min-w-0">
              <span className={`block font-semibold ${e.main ? "" : "text-ink"}`}>{e.title}</span>
              <span className={`block truncate text-xs ${e.main ? "text-white/85" : "text-ink/60"}`}>
                {weekdayName(e.start)} · {e.venue}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function Hero() {
  const guest = useGuestName();
  const wedding = useWedding();
  const mainEvent = mainEventOf(wedding);
  const place = `${mainEvent.venue}, ${mainEvent.address}`;
  const calendarUrl = googleCalendarUrl({
    title: `Đám cưới ${wedding.groom.name} & ${wedding.bride.name}`,
    start: mainEvent.start,
    end: mainEvent.end,
    location: place,
  });

  const smallBtn =
    "flex flex-col items-center justify-center gap-1 rounded-2xl bg-white/75 px-2 py-3 text-[11px] font-semibold text-wine shadow-sm ring-1 ring-white transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md sm:text-xs";

  return (
    <section id="home" className="relative min-h-svh overflow-clip">
      <VibrantBackground />
      <FloralCorner className="pointer-events-none absolute -top-6 -left-6 w-36 rotate-90 text-[#e0587f]/40 md:w-60" />
      <FloralCorner className="pointer-events-none absolute -right-6 -bottom-6 w-36 -rotate-90 text-[#e0587f]/40 md:w-60" />

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="no-blur-touch-all relative mx-auto grid max-w-6xl items-center gap-8 px-4 pt-24 pb-28 md:pt-28 lg:min-h-svh lg:grid-cols-[5fr_6fr] lg:gap-14 lg:pb-20"
      >
        {/* Ảnh cặp đôi */}
        <motion.div variants={item} className="relative order-2 mx-auto lg:sticky lg:top-24 lg:order-1 lg:row-span-2 lg:self-start">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/2 left-1/2 aspect-square w-[125%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-[#ff8fb1]/50"
          />
          <div className="relative aspect-[3/4] w-[min(62vw,240px)] overflow-hidden rounded-t-full rounded-b-[2rem] border-[6px] border-white shadow-[0_25px_60px_rgba(255,111,145,0.35)] lg:w-[380px]">
            <Image
              src={wedding.hero.image}
              alt={`${wedding.groom.name} & ${wedding.bride.name}`}
              fill
              priority
              sizes="(max-width: 1024px) 62vw, 380px"
              className="animate-ken-burns object-cover object-[50%_15%]"
            />
          </div>
          <motion.div
            animate={{ y: [0, -10, 0], rotate: [-8, 8, -8] }}
            transition={{ duration: 5, repeat: Infinity }}
            className="absolute -bottom-3 -left-6 rounded-full bg-white px-4 py-2 font-script text-2xl text-[#e0587f] shadow-lg lg:-left-10 lg:text-3xl"
          >
            Just married
          </motion.div>
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
            className="absolute -top-2 -right-3 flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-[#ff6f91] to-[#ff9671] text-2xl text-white shadow-lg"
          >
            ♥
          </motion.span>
        </motion.div>

        {/* Thông tin thiệp */}
        <div className="order-1 text-center lg:order-2">
          <motion.p variants={item} className="text-[11px] font-semibold tracking-[0.45em] text-[#e0587f] uppercase sm:text-xs">
            Trân trọng kính mời
          </motion.p>
          <motion.p variants={item} className="mt-1 font-script text-3xl text-wine sm:text-4xl">
            {guest || "Quý khách"}
          </motion.p>
          <motion.p variants={item} className="mt-1 font-serif text-base text-ink/70 italic">
            tới dự lễ thành hôn của chúng tôi
          </motion.p>

          <motion.h1
            variants={item}
            className="text-vibrant-gradient mt-3 py-2 font-script text-[3.4rem] leading-[1.05] sm:text-7xl lg:text-8xl"
          >
            {wedding.groom.name}
            <span className="block py-1 text-4xl text-gold sm:text-5xl">&</span>
            {wedding.bride.name}
          </motion.h1>

          <motion.div variants={item} className="mt-4">
            <DateBlock />
          </motion.div>

          <motion.a
            variants={item}
            href={mapsUrl(place)}
            target="_blank"
            rel="noreferrer"
            className="mx-auto mt-5 flex max-w-md items-start gap-2 rounded-2xl bg-white/70 px-4 py-3 text-left shadow-sm ring-1 ring-white transition hover:bg-white"
          >
            <MapPin className="mt-0.5 size-5 shrink-0 text-[#e0587f]" />
            <span className="text-sm">
              <span className="block font-semibold text-ink">Địa điểm: {mainEvent.venue}</span>
              <span className="text-ink/70">{mainEvent.address}</span>
            </span>
          </motion.a>
        </div>

        {/* Lịch trình, đếm ngược và hành động — trên desktop nằm dưới cột thông tin */}
        <motion.div variants={item} className="order-3 mx-auto w-full max-w-md space-y-4 lg:col-start-2 lg:-mt-6">
          <div>
            <p className="mb-2 flex items-center justify-center gap-2 text-xs font-semibold tracking-[0.3em] text-wine/80 uppercase">
              <Clock className="size-3.5" /> Lịch trình
            </p>
            <Schedule />
          </div>

          <MiniCountdown />

          <button
            type="button"
            onClick={() => scrollToId("rsvp")}
            className="relative flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[#e0587f] via-[#ff6f91] to-[#ff9671] px-6 py-4 text-sm font-bold tracking-widest text-white uppercase shadow-[0_12px_30px_rgba(255,111,145,0.45)] transition hover:scale-[1.02] active:scale-95"
          >
            <span className="absolute inset-0 -translate-x-full animate-sheen bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            <Send className="relative size-4" />
            <span className="relative">Xác nhận tham dự</span>
          </button>

          <div className="grid grid-cols-3 gap-2">
            <a href={mapsUrl(place)} target="_blank" rel="noreferrer" className={smallBtn}>
              <Navigation className="size-5 text-[#e0587f]" /> Chỉ đường
            </a>
            <a href={calendarUrl} target="_blank" rel="noreferrer" className={smallBtn}>
              <CalendarPlus className="size-5 text-[#e0587f]" /> Lưu lịch
            </a>
            <button type="button" onClick={goToGiftQr} className={`${smallBtn} cursor-pointer`}>
              <Gift className="size-5 text-[#e0587f]" /> Mừng cưới
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* chuyển màu mềm sang section tiếp theo */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-ivory" />
    </section>
  );
}
