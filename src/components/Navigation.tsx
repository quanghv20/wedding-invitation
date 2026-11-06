"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useSpring } from "motion/react";
import { CalendarHeart, Gift, Heart, House, Images, MailOpen } from "lucide-react";
import { scrollToId } from "./SmoothScroll";

const items = [
  { id: "home", label: "Trang chủ", icon: House },
  { id: "couple", label: "Cô dâu & Chú rể", icon: Heart },
  { id: "events", label: "Sự kiện", icon: CalendarHeart },
  { id: "gallery", label: "Album", icon: Images },
  { id: "rsvp", label: "Xác nhận", icon: MailOpen },
  { id: "gift", label: "Mừng cưới", icon: Gift },
];

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  return (
    <motion.div
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-50 h-[3px] origin-left bg-gradient-to-r from-rose via-gold to-gold-light"
    />
  );
}

/** Thanh điều hướng nổi dạng viên thuốc, tự sáng mục đang xem */
export function Navigation() {
  const [active, setActive] = useState("home");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    items.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <motion.nav
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 2.2, type: "spring", stiffness: 120, damping: 18 }}
      className="glass fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full px-2 py-2 shadow-[0_10px_40px_rgba(58,46,41,0.18)]"
    >
      <ul className="flex items-center gap-1">
        {items.map(({ id, label, icon: Icon }) => (
          <li key={id}>
            <button
              type="button"
              onClick={() => scrollToId(id)}
              aria-label={label}
              className={`group relative flex cursor-pointer items-center gap-2 rounded-full px-3 py-2.5 transition-colors ${
                active === id ? "text-ivory" : "text-ink/70 hover:text-wine"
              }`}
            >
              {active === id && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-wine to-rose"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <Icon className="relative size-[18px]" />
              <span className="relative hidden text-xs font-medium whitespace-nowrap lg:inline">
                {active === id ? label : ""}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </motion.nav>
  );
}
