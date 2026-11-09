"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const Petals = dynamic(() => import("./Petals").then((m) => m.Petals), { ssr: false });
const ClickHearts = dynamic(() => import("./ClickHearts").then((m) => m.ClickHearts), { ssr: false });
const GiftMascot = dynamic(() => import("../GiftMascot").then((m) => m.GiftMascot), { ssr: false });

/** Hiệu ứng mở đầu của trang chạy trong khoảng này; hiệu ứng trang trí vào sau để máy yếu không bị giật */
const START_AFTER_MS = 1500;

export function DeferredEffects() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), START_AFTER_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!ready) return null;
  return (
    <>
      <ClickHearts />
      <Petals />
      <GiftMascot />
    </>
  );
}
