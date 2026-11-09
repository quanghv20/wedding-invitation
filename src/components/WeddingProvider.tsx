"use client";

import { createContext, useContext } from "react";
import type { WeddingContent } from "@/config/wedding";

const WeddingContext = createContext<WeddingContent | null>(null);

export function WeddingProvider({ content, children }: { content: WeddingContent; children: React.ReactNode }) {
  return <WeddingContext.Provider value={content}>{children}</WeddingContext.Provider>;
}

export function useWedding() {
  const content = useContext(WeddingContext);
  if (!content) throw new Error("useWedding phải nằm trong <WeddingProvider>");
  return content;
}
