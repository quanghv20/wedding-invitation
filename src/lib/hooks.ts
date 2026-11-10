"use client";

import { useEffect, useState } from "react";

function getRemaining(target: number) {
  const diff = Math.max(target - Date.now(), 0);
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

/** null trong lần render đầu để tránh lệch giữa server & client */
export function useCountdown(iso: string) {
  const target = new Date(iso).getTime();
  const [time, setTime] = useState<ReturnType<typeof getRemaining> | null>(null);
  useEffect(() => {
    setTime(getRemaining(target));
    const timer = setInterval(() => setTime(getRemaining(target)), 1000);
    return () => clearInterval(timer);
  }, [target]);
  return time;
}
