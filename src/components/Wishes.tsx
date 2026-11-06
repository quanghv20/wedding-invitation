"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Loader2, Quote, Send } from "lucide-react";
import { initialOf } from "@/lib/format";
import { SectionTitle } from "./ui/SectionTitle";
import { Reveal } from "./ui/Reveal";

type Wish = { id: string; name: string; message: string; createdAt: string };

const inputClass =
  "w-full rounded-xl border border-gold/25 bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-muted/60 focus:border-gold focus:ring-4 focus:ring-gold/15";

const avatarColors = ["from-rose to-wine", "from-gold to-gold-dark", "from-[#9bb3a4] to-[#5f7f6c]", "from-[#a9a1c9] to-[#6c6496]"];

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "Vừa xong";
  if (s < 3600) return `${Math.floor(s / 60)} phút trước`;
  if (s < 86400) return `${Math.floor(s / 3600)} giờ trước`;
  return `${Math.floor(s / 86400)} ngày trước`;
}

export function Wishes() {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch("/api/wishes")
      .then((r) => r.json())
      .then(setWishes)
      .catch(() => {});
  }, []);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setSending(true);
    try {
      const res = await fetch("/api/wishes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      if (res.ok) {
        const wish: Wish = await res.json();
        setWishes((prev) => [wish, ...prev]);
        form.reset();
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="wishes" className="paper-texture px-4 py-24 md:py-32">
      <SectionTitle
        script="Guest book"
        title="Sổ lưu bút"
        description="Gửi đôi lời chúc phúc — chúng mình sẽ đọc từng lời và giữ gìn thật kỹ."
      />

      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[2fr_3fr]">
        <Reveal direction="left">
          <form
            onSubmit={onSubmit}
            className="space-y-4 rounded-[2rem] border border-gold/20 bg-gradient-to-br from-white to-cream p-6 shadow-[0_20px_50px_rgba(176,141,87,0.15)] md:p-8 lg:sticky lg:top-24"
          >
            <p className="font-script text-4xl text-wine">Gửi lời chúc</p>
            <input name="name" required maxLength={60} placeholder="Tên của bạn *" className={inputClass} />
            <textarea
              name="message"
              required
              rows={5}
              maxLength={400}
              placeholder="Lời chúc dành cho cô dâu & chú rể *"
              className={inputClass}
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              disabled={sending}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-gradient-to-r from-wine to-rose px-6 py-3.5 text-sm font-semibold tracking-widest text-ivory uppercase shadow-lg disabled:opacity-70"
            >
              {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Gửi lời chúc
            </motion.button>
          </form>
        </Reveal>

        <Reveal direction="right">
          <div
            data-lenis-prevent
            className="max-h-[560px] space-y-4 overflow-y-auto pr-2 [mask-image:linear-gradient(to_bottom,black_85%,transparent)]"
          >
            <AnimatePresence initial={false}>
              {wishes.map((w, i) => (
                <motion.article
                  key={w.id}
                  layout
                  initial={{ opacity: 0, y: -30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 22 }}
                  className="relative flex gap-4 rounded-2xl border border-gold/15 bg-white/90 p-5 shadow-sm transition hover:shadow-md"
                >
                  <div
                    className={`flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-semibold text-white ${
                      avatarColors[i % avatarColors.length]
                    }`}
                  >
                    {initialOf(w.name) || "♥"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <p className="font-medium text-ink">{w.name}</p>
                      <p className="text-xs text-muted/70">{timeAgo(w.createdAt)}</p>
                    </div>
                    <p className="mt-1.5 font-serif text-lg leading-relaxed break-words text-muted">{w.message}</p>
                  </div>
                  <Quote className="absolute top-4 right-4 size-6 text-gold/15" />
                </motion.article>
              ))}
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
