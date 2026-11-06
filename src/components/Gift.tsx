"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useAnimationControls } from "motion/react";
import { Check, Copy, ScanLine } from "lucide-react";
import { wedding } from "@/config/wedding";
import { SectionTitle } from "./ui/SectionTitle";
import { Reveal } from "./ui/Reveal";

type GiftInfo = (typeof wedding.gifts)[number];

const qrUrl = (g: GiftInfo) =>
  `https://img.vietqr.io/image/${g.bankId}-${g.accountNo}-qr_only.png?accountName=${encodeURIComponent(
    g.accountName,
  )}&addInfo=${encodeURIComponent("Mung cuoi")}`;

function GiftCard({ gift, index }: { gift: GiftInfo; index: number }) {
  const [copied, setCopied] = useState(false);
  const pulse = useAnimationControls();

  // nháy sáng khi linh vật dẫn người dùng tới
  useEffect(() => {
    const onHighlight = () =>
      pulse.start({
        scale: [1, 1.05, 1, 1.03, 1],
        boxShadow: [
          "0 25px 60px rgba(224,88,127,0.18)",
          "0 0 0 10px rgba(255,111,145,0.35)",
          "0 25px 60px rgba(224,88,127,0.18)",
        ],
        transition: { duration: 1.2, delay: index * 0.15 },
      });
    window.addEventListener("gift:highlight", onHighlight);
    return () => window.removeEventListener("gift:highlight", onHighlight);
  }, [pulse, index]);

  const copy = async () => {
    await navigator.clipboard.writeText(gift.accountNo).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Reveal delay={index * 0.15} className="mx-auto w-full max-w-sm">
      <motion.div
        animate={pulse}
        className="relative overflow-hidden rounded-[2rem] p-[3px] shadow-[0_25px_60px_rgba(224,88,127,0.18)]"
      >
        {/* viền gradient xoay */}
        <div className="absolute top-1/2 left-1/2 aspect-square w-[200%] -translate-x-1/2 -translate-y-1/2 animate-spin-slow bg-[conic-gradient(from_0deg,#ff6f91,#ffc46b,#c3a6ff,#ff9671,#ff6f91)]" />

        <div className="relative rounded-[calc(2rem-3px)] bg-white px-6 pt-6 pb-7 text-center">
          <p className="font-script text-3xl text-wine md:text-4xl">{gift.label}</p>
          <span className="mt-2 inline-block rounded-full bg-gradient-to-r from-[#ff6f91] to-[#ff9671] px-4 py-1 text-xs font-bold tracking-widest text-white uppercase">
            {gift.bankName}
          </span>

          <div className="relative mx-auto mt-5 size-52 rounded-2xl bg-[#fff5f8] p-3 md:size-56">
            {/* góc khung quét */}
            {["top-0 left-0 border-t-4 border-l-4 rounded-tl-2xl", "top-0 right-0 border-t-4 border-r-4 rounded-tr-2xl", "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-2xl", "bottom-0 right-0 border-b-4 border-r-4 rounded-br-2xl"].map((c) => (
              <span key={c} className={`absolute size-7 border-[#ff6f91] ${c}`} />
            ))}
            <div className="relative h-full w-full overflow-hidden rounded-lg bg-white">
              <Image src={qrUrl(gift)} alt={`Mã QR ${gift.bankName}`} fill unoptimized sizes="224px" className="object-contain p-1" />
              <motion.div
                animate={{ top: ["0%", "100%", "0%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-x-0 h-0.5 bg-[#ff4f81] shadow-[0_0_12px_3px_rgba(255,79,129,0.6)]"
              />
            </div>
          </div>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink/60">
            <ScanLine className="size-3.5" /> Mở app ngân hàng & quét mã
          </p>

          <div className="mt-4 rounded-2xl bg-[#fff5f8] px-4 py-3">
            <p className="font-serif text-2xl font-bold tracking-wider text-ink">{gift.accountNo}</p>
            <p className="text-sm text-ink/60">{gift.accountName}</p>
          </div>

          <button
            type="button"
            onClick={copy}
            className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full bg-wine px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#e0587f] active:scale-95"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={copied ? "ok" : "copy"} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              </motion.span>
            </AnimatePresence>
            {copied ? "Đã sao chép" : "Sao chép số tài khoản"}
          </button>
        </div>
      </motion.div>
    </Reveal>
  );
}

export function Gift() {
  return (
    <section id="gift" className="relative overflow-hidden bg-gradient-to-b from-ivory via-blush/40 to-ivory px-4 py-24 md:py-32">
      <SectionTitle
        script="Wedding gift"
        title="Hộp mừng cưới"
        description="Sự hiện diện của bạn đã là món quà quý giá nhất. Nếu muốn gửi thêm chút yêu thương, bạn có thể quét mã bên dưới."
      />
      <div id="gift-qr" className="mx-auto grid max-w-3xl gap-10 md:grid-cols-2">
        {wedding.gifts.map((g, i) => (
          <GiftCard key={g.accountNo} gift={g} index={i} />
        ))}
      </div>
    </section>
  );
}
