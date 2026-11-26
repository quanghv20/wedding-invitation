"use client";

import { createContext, useContext } from "react";
import { allEventPlaces, eventPlaces, type Side, type WeddingContent, type WeddingEvent } from "@/config/wedding";
import type { Guest } from "@/lib/guest";

const WeddingContext = createContext<WeddingContent | null>(null);
const GuestContext = createContext<Guest | null>(null);
const SideContext = createContext<Side | null>(null);
const AlbumContext = createContext<string[] | null>(null);

/**
 * guest: khách mở thiệp từ link mời riêng (/?to=<id>), null nếu không có hoặc id sai.
 * side: thiệp của nhà trai hay nhà gái (quyết định địa chỉ hiển thị), null thì hiện cả hai.
 * album: toàn bộ ảnh cho nút "Xem toàn bộ album" (bộ đã chọn trước), không có thì chỉ có bộ đã chọn.
 */
export function WeddingProvider({
  content,
  guest = null,
  side = null,
  album = null,
  children,
}: {
  content: WeddingContent;
  guest?: Guest | null;
  side?: Side | null;
  album?: string[] | null;
  children: React.ReactNode;
}) {
  return (
    <WeddingContext.Provider value={content}>
      <GuestContext.Provider value={guest}>
        <SideContext.Provider value={side}>
          <AlbumContext.Provider value={album}>{children}</AlbumContext.Provider>
        </SideContext.Provider>
      </GuestContext.Provider>
    </WeddingContext.Provider>
  );
}

export function useWedding() {
  const content = useContext(WeddingContext);
  if (!content) throw new Error("useWedding phải nằm trong <WeddingProvider>");
  return content;
}

export const useGuest = () => useContext(GuestContext);
export const useSide = () => useContext(SideContext);

/** Toàn bộ ảnh album (bộ đã chọn đứng đầu) */
export function useFullAlbum() {
  const album = useContext(AlbumContext);
  const { gallery } = useWedding();
  return album && album.length > gallery.length ? album : gallery;
}

/** Mọi địa điểm khách đang xem sẽ tới (qua tất cả sự kiện): một bên, hoặc cả hai */
export const usePlaces = () => allEventPlaces(useWedding(), useSide());

/** Địa điểm của một sự kiện với khách đang xem */
export const useEventPlaces = (event: WeddingEvent) => eventPlaces(useWedding(), event, useSide());
