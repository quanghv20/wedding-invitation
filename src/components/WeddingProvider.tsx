"use client";

import { createContext, useContext } from "react";
import type { WeddingContent } from "@/config/wedding";
import type { Guest } from "@/lib/guest";

const WeddingContext = createContext<WeddingContent | null>(null);
const GuestContext = createContext<Guest | null>(null);

/** guest: khách mở thiệp từ link mời riêng (/?to=<id>), null nếu không có hoặc id sai */
export function WeddingProvider({
  content,
  guest = null,
  children,
}: {
  content: WeddingContent;
  guest?: Guest | null;
  children: React.ReactNode;
}) {
  return (
    <WeddingContext.Provider value={content}>
      <GuestContext.Provider value={guest}>{children}</GuestContext.Provider>
    </WeddingContext.Provider>
  );
}

export function useWedding() {
  const content = useContext(WeddingContext);
  if (!content) throw new Error("useWedding phải nằm trong <WeddingProvider>");
  return content;
}

export const useGuest = () => useContext(GuestContext);
