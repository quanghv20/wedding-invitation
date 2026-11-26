"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useSpring } from "motion/react";
import { Heart } from "lucide-react";
import type { WeddingContent } from "@/config/wedding";
import { useWedding } from "./WeddingProvider";
import { SectionTitle } from "./ui/SectionTitle";

type Story = WeddingContent["story"][number];

function StoryItem({ item, index }: { item: Story; index: number }) {
  const reversed = index % 2 === 1;
  return (
    <div className="relative grid items-center gap-8 pr-5 pl-9 md:grid-cols-2 md:gap-16 md:px-0">
      {/* nút tròn trên trục */}
      <motion.div
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true, margin: "-120px" }}
        transition={{ type: "spring", stiffness: 200, damping: 14 }}
        className="absolute top-8 left-2 z-10 flex size-7 -translate-x-1/2 items-center justify-center rounded-full border-[3px] border-ivory bg-rose shadow-lg md:top-1/2 md:left-1/2 md:size-9 md:-translate-y-1/2 md:border-4"
      >
        <Heart className="size-3 fill-ivory text-ivory md:size-3.5" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: reversed ? 80 : -80, rotate: reversed ? 4 : -4 }}
        whileInView={{ opacity: 1, x: 0, rotate: reversed ? 2 : -2 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ rotate: 0, scale: 1.03 }}
        className={`${reversed ? "md:order-2" : ""} mx-auto w-full max-w-md bg-white p-3 pb-12 shadow-[0_20px_50px_rgba(58,46,41,0.15)]`}
      >
        <div className="relative aspect-[2/3] overflow-hidden">
          <Image src={item.image} alt={item.title} fill sizes="(max-width: 768px) 90vw, 450px" className="object-cover" />
        </div>
        <p className="mt-4 text-center font-script text-2xl text-wine">{item.date}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className={`${reversed ? "md:order-1 md:text-right" : ""}`}
      >
        <span className="text-xs tracking-[0.3em] text-gold uppercase">Chương {index + 1}</span>
        <h3 className="mt-2 font-serif text-3xl font-semibold text-ink md:text-4xl">{item.title}</h3>
        <p className="mt-4 font-serif text-lg leading-relaxed text-muted">{item.text}</p>
      </motion.div>
    </div>
  );
}

export function LoveStory() {
  const wedding = useWedding();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 70%", "end 60%"] });
  const scaleY = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  return (
    <section id="story" className="paper-texture relative overflow-hidden px-3 py-24 md:px-4 md:py-32">
      <SectionTitle
        script="Our love story"
        title="Chuyện chúng mình"
        description="Mỗi khoảnh khắc là một trang nhật ký mà chúng mình muốn giữ mãi."
      />

      <div ref={ref} className="relative mx-auto max-w-5xl space-y-20 md:space-y-28">
        <div className="absolute top-0 bottom-0 left-2 w-px bg-gold/20 md:left-1/2" />
        <motion.div
          style={{ scaleY }}
          className="absolute top-0 bottom-0 left-2 w-[2px] origin-top -translate-x-[0.5px] bg-gradient-to-b from-rose via-gold to-rose md:left-1/2"
        />
        {wedding.story.map((item, i) => (
          <StoryItem key={item.title} item={item} index={i} />
        ))}
      </div>
    </section>
  );
}
