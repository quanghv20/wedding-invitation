"use client";

import { createContext, useContext, useEffect, useState } from "react";
import Image from "next/image";
import { Check, GripVertical, ImageOff, Images, X } from "lucide-react";
import { albumFileName, orderedAlbum } from "@/lib/images";
import { buttonClass } from "./ui";

/** Danh sách ảnh trong public/albums, nạp cùng dữ liệu admin */
export const AlbumContext = createContext<string[]>([]);

function Thumb({ src, sizes = "160px" }: { src: string; sizes?: string }) {
  return <Image src={src} alt="" fill sizes={sizes} draggable={false} className="pointer-events-none object-cover" />;
}

/** Hộp thoại chọn một ảnh trong album */
function PickerDialog({ value, onPick, onClose }: { value: string; onPick: (src: string) => void; onClose: () => void }) {
  const album = useContext(AlbumContext);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Chọn ảnh trong album"
        className="flex max-h-[90svh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gold/20 px-5 py-3">
          <h2 className="font-serif text-lg font-semibold text-wine">Chọn ảnh trong album</h2>
          <button type="button" onClick={onClose} aria-label="Đóng" className="cursor-pointer rounded-full p-2 text-muted hover:bg-blush/50 hover:text-wine">
            <X className="size-4" />
          </button>
        </div>
        <div className="overflow-y-auto p-4" data-lenis-prevent>
          {album.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">Thư mục public/albums chưa có ảnh nào.</p>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {album.map((src) => {
                const selected = src === value;
                return (
                  <button
                    key={src}
                    type="button"
                    onClick={() => onPick(src)}
                    title={albumFileName(src)}
                    className={`group relative aspect-[2/3] cursor-pointer overflow-hidden rounded-xl ring-offset-2 transition ${
                      selected ? "ring-3 ring-wine" : "ring-1 ring-gold/30 hover:ring-2 hover:ring-gold"
                    }`}
                  >
                    <Thumb src={src} />
                    {selected && (
                      <span className="absolute top-1.5 right-1.5 rounded-full bg-wine p-1 text-ivory">
                        <Check className="size-3.5" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Trường ảnh: xem ảnh đang dùng và chọn ảnh khác trong album */
export function ImageField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const album = useContext(AlbumContext);
  const [open, setOpen] = useState(false);
  const missing = value && !album.includes(value);

  return (
    <div className="sm:col-span-2">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="relative h-24 w-16 shrink-0 cursor-pointer overflow-hidden rounded-lg bg-blush/30 ring-1 ring-gold/30 transition hover:ring-2 hover:ring-gold"
          aria-label={`Chọn ${label.toLowerCase()}`}
        >
          {value && !missing ? <Thumb src={value} sizes="96px" /> : <ImageOff className="m-auto size-5 text-muted" />}
        </button>
        <div className="min-w-0 flex-1 text-sm">
          {missing ? (
            <p className="text-rose">Ảnh cũ không nằm trong album, hãy chọn lại</p>
          ) : (
            <p className="truncate text-ink/80">{value ? albumFileName(value) : "Chưa chọn ảnh"}</p>
          )}
        </div>
        <button type="button" onClick={() => setOpen(true)} className={`${buttonClass} shrink-0 border border-gold/40 px-3 py-2 text-wine hover:bg-blush/40`}>
          <Images className="size-4" /> Chọn ảnh
        </button>
      </div>
      {open && (
        <PickerDialog
          value={value}
          onClose={() => setOpen(false)}
          onPick={(src) => {
            onChange(src);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

/** Album: kéo thả để đổi vị trí, tick để hiển thị trên thiệp */
export function GalleryEditor({
  gallery,
  order,
  onChange,
}: {
  gallery: string[];
  order: string[];
  onChange: (changes: { gallery: string[]; galleryOrder: string[] }) => void;
}) {
  const album = useContext(AlbumContext);
  const items = orderedAlbum(album, order, gallery);
  const visible = new Set(gallery);
  const [dragging, setDragging] = useState<string | null>(null);

  const commit = (nextItems: string[], nextVisible: Set<string>) =>
    onChange({ galleryOrder: nextItems, gallery: nextItems.filter((src) => nextVisible.has(src)) });

  const toggle = (src: string) => {
    const next = new Set(visible);
    if (next.has(src)) next.delete(src);
    else next.add(src);
    commit(items, next);
  };

  const moveOver = (target: string) => {
    if (!dragging || dragging === target) return;
    const next = items.filter((src) => src !== dragging);
    next.splice(items.indexOf(target), 0, dragging);
    commit(next, visible);
  };

  if (!album.length) return <p className="text-sm text-muted">Thư mục public/albums chưa có ảnh nào.</p>;

  const shown = items.filter((src) => visible.has(src));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <p className="mr-auto text-sm text-muted">
          Hiển thị <span className="font-semibold text-wine">{shown.length}</span> / {items.length} ảnh · kéo thả để đổi vị trí
        </p>
        <button type="button" onClick={() => commit(items, new Set(items))} className={`${buttonClass} border border-gold/40 px-3 py-1.5 text-wine hover:bg-blush/40`}>
          Chọn tất cả
        </button>
        <button type="button" onClick={() => commit(items, new Set())} className={`${buttonClass} border border-gold/40 px-3 py-1.5 text-wine hover:bg-blush/40`}>
          Bỏ chọn tất cả
        </button>
      </div>

      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 xl:grid-cols-5">
        {items.map((src) => {
          const checked = visible.has(src);
          const position = checked ? shown.indexOf(src) + 1 : 0;
          return (
            <li
              key={src}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", src);
                setDragging(src);
              }}
              onDragEnter={() => moveOver(src)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => e.preventDefault()}
              onDragEnd={() => setDragging(null)}
              className={`group relative aspect-[2/3] cursor-grab overflow-hidden rounded-xl bg-blush/20 transition active:cursor-grabbing ${
                checked ? "ring-2 ring-wine" : "ring-1 ring-gold/30"
              } ${dragging === src ? "scale-95 opacity-40" : ""}`}
            >
              <div className={`absolute inset-0 transition ${checked ? "" : "opacity-40 grayscale"}`}>
                <Thumb src={src} />
              </div>

              <label className="absolute top-1.5 left-1.5 flex cursor-pointer items-center rounded-md bg-white/90 p-1 shadow">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(src)}
                  aria-label={`Hiển thị ${albumFileName(src)}`}
                  className="size-4 cursor-pointer accent-wine"
                />
              </label>
              {position > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-6 rounded-full bg-wine px-1.5 py-0.5 text-center text-xs font-semibold text-ivory">
                  {position}
                </span>
              )}
              <GripVertical className="absolute right-1 bottom-6 size-4 text-white opacity-0 drop-shadow transition group-hover:opacity-100" />
              <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/60 to-transparent px-2 pt-4 pb-1 text-[11px] text-white">
                {albumFileName(src)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
