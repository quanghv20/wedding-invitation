"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useScroll, useTransform } from "motion/react";
import confetti from "canvas-confetti";
import { Check, ChevronDown, Frown, Loader2, PartyPopper, Send } from "lucide-react";
import { useGuest, useWedding } from "./WeddingProvider";
import { SectionTitle } from "./ui/SectionTitle";
import { Reveal } from "./ui/Reveal";

const inputClass =
  "w-full rounded-xl border border-gold/25 bg-white/80 px-4 py-3 text-sm text-ink outline-none transition placeholder:text-muted/60 focus:border-gold focus:ring-4 focus:ring-gold/15";

/** Select ẩn mũi tên gốc của trình duyệt, dùng icon riêng căn giữa theo chiều dọc */
function SelectField(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select {...props} className={`${inputClass} cursor-pointer appearance-none pr-11`} />
      <ChevronDown className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-gold" />
    </div>
  );
}

function fireConfetti() {
  const colors = ["#c4878a", "#b08d57", "#f4dfda", "#dcc496", "#6e2838"];
  const end = Date.now() + 1200;
  (function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors, zIndex: 130 });
    confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors, zIndex: 130 });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

export function Rsvp() {
  const wedding = useWedding();
  const guest = useGuest();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);

  const [attending, setAttending] = useState(true);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    setStatus("loading");
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, attending, guestId: guest?.id }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Có lỗi xảy ra");
      setStatus("done");
      if (attending) fireConfetti();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
      setStatus("error");
    }
  };

  return (
    <section id="rsvp" ref={ref} className="relative overflow-hidden px-4 py-24 md:py-32">
      <motion.div style={{ y: bgY }} className="absolute -inset-y-[15%] inset-x-0">
        <Image src={wedding.gallery[3] ?? wedding.hero.image} alt="" fill sizes="100vw" className="object-cover" />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-b from-wine/85 via-ink/80 to-wine/85" />

      <div className="relative">
        <SectionTitle
          light
          script="Will you join us?"
          title="Xác nhận tham dự"
          description={`Vui lòng phản hồi giúp chúng mình trước ngày ${wedding.rsvpDeadline} để việc đón tiếp được chu đáo nhất.`}
        />

        <Reveal direction="zoom" className="mx-auto max-w-xl">
          <div className="rounded-[2rem] border border-white/20 bg-ivory/95 p-6 shadow-2xl backdrop-blur pointer-coarse:backdrop-blur-none md:p-10">
            <AnimatePresence mode="wait">
              {status === "done" ? (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-10 text-center"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 160, damping: 12 }}
                    className="mx-auto flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-rose to-wine text-ivory shadow-lg"
                  >
                    {attending ? <PartyPopper className="size-9" /> : <Check className="size-9" />}
                  </motion.div>
                  <h3 className="mt-6 font-script text-5xl text-wine">Cảm ơn bạn!</h3>
                  <p className="mt-3 font-serif text-lg text-muted">
                    {attending
                      ? "Chúng mình rất mong được gặp bạn trong ngày vui!"
                      : "Tiếc quá! Cảm ơn bạn vẫn luôn dành tình cảm cho chúng mình."}
                  </p>
                </motion.div>
              ) : (
                <motion.form key="form" exit={{ opacity: 0, y: -20 }} onSubmit={onSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input name="name" required defaultValue={guest?.name} placeholder="Họ và tên *" className={inputClass} />
                    <input name="phone" type="tel" placeholder="Số điện thoại" className={inputClass} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: true, label: "Mình sẽ đến", icon: PartyPopper },
                      { value: false, label: "Rất tiếc", icon: Frown },
                    ].map(({ value, label, icon: Icon }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setAttending(value)}
                        className={`relative flex cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl border px-4 py-3 text-sm font-medium transition ${
                          attending === value ? "border-wine text-ivory" : "border-gold/25 bg-white/80 text-ink hover:border-gold"
                        }`}
                      >
                        {attending === value && (
                          <motion.span layoutId="attend" className="absolute inset-0 bg-gradient-to-r from-wine to-rose" />
                        )}
                        <Icon className="relative size-4" />
                        <span className="relative">{label}</span>
                      </button>
                    ))}
                  </div>

                  <AnimatePresence initial={false}>
                    {attending && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="grid gap-4 overflow-hidden sm:grid-cols-2"
                      >
                        <SelectField name="guests" defaultValue="1">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <option key={n} value={n}>
                              {n} người
                            </option>
                          ))}
                        </SelectField>
                        <SelectField name="side" defaultValue={guest?.side ?? ""}>
                          <option value="" disabled>
                            Bạn là khách của...
                          </option>
                          <option value="groom">Nhà trai</option>
                          <option value="bride">Nhà gái</option>
                        </SelectField>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <textarea name="note" rows={3} placeholder="Ghi chú thêm (ăn chay, dị ứng...)" className={inputClass} />

                  {status === "error" && <p className="text-sm text-rose">{error}</p>}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    disabled={status === "loading"}
                    className="relative flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-gold-dark via-gold to-gold-dark bg-[length:200%_auto] px-6 py-4 text-sm font-semibold tracking-widest text-ivory uppercase shadow-lg transition-[background-position] duration-700 hover:bg-right disabled:opacity-70"
                  >
                    {status === "loading" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                    Gửi xác nhận
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
