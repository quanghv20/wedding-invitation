"use client";

import { createContext, useContext, useState } from "react";
import Image from "next/image";
import { Button, Checkbox, Col, Empty, Flex, Modal, Typography } from "antd";
import { CheckOutlined, HolderOutlined, PictureOutlined } from "@ant-design/icons";
import { albumFileName, orderedAlbum } from "@/lib/images";

/** Danh sách ảnh trong public/albums, nạp cùng dữ liệu admin */
export const AlbumContext = createContext<string[]>([]);

const NO_PHOTOS = "Thư mục public/albums chưa có ảnh nào.";

function Thumb({ src, sizes = "160px" }: { src: string; sizes?: string }) {
  return <Image src={src} alt="" fill sizes={sizes} draggable={false} className="pointer-events-none object-cover" />;
}

/** Hộp thoại chọn một ảnh trong album */
function PickerDialog({ open, value, onPick, onClose }: { open: boolean; value: string; onPick: (src: string) => void; onClose: () => void }) {
  const album = useContext(AlbumContext);

  return (
    <Modal open={open} title="Chọn ảnh trong album" footer={null} width={960} onCancel={onClose} destroyOnHidden>
      {album.length === 0 ? (
        <Empty description={NO_PHOTOS} />
      ) : (
        <div className="max-h-[70svh] overflow-y-auto p-1" data-lenis-prevent>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {album.map((src) => {
              const selected = src === value;
              return (
                <button
                  key={src}
                  type="button"
                  onClick={() => onPick(src)}
                  title={albumFileName(src)}
                  className={`relative aspect-[2/3] cursor-pointer overflow-hidden rounded-xl ring-offset-2 transition ${
                    selected ? "ring-3 ring-wine" : "ring-1 ring-gold/30 hover:ring-2 hover:ring-gold"
                  }`}
                >
                  <Thumb src={src} />
                  {selected && (
                    <span className="absolute top-1.5 right-1.5 flex rounded-full bg-wine p-1 text-xs text-ivory">
                      <CheckOutlined />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </Modal>
  );
}

/** Trường ảnh: xem ảnh đang dùng và chọn ảnh khác trong album (chiếm cả hàng trong Row của form) */
export function ImageField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const album = useContext(AlbumContext);
  const [open, setOpen] = useState(false);
  const missing = value && !album.includes(value);

  return (
    <Col span={24} style={{ marginBottom: 24 }}>
      <Typography.Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
        {label}
      </Typography.Text>
      <Flex align="center" gap={12}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="relative flex h-24 w-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-blush/30 ring-1 ring-gold/30 transition hover:ring-2 hover:ring-gold"
          aria-label={`Chọn ${label.toLowerCase()}`}
        >
          {value && !missing ? <Thumb src={value} sizes="96px" /> : <PictureOutlined className="text-lg text-muted" />}
        </button>
        <div className="min-w-0 flex-1">
          {missing ? (
            <Typography.Text type="danger">Ảnh cũ không nằm trong album, hãy chọn lại</Typography.Text>
          ) : (
            <Typography.Text ellipsis>{value ? albumFileName(value) : "Chưa chọn ảnh"}</Typography.Text>
          )}
        </div>
        <Button icon={<PictureOutlined />} onClick={() => setOpen(true)}>
          Chọn ảnh
        </Button>
      </Flex>
      <PickerDialog
        open={open}
        value={value}
        onClose={() => setOpen(false)}
        onPick={(src) => {
          onChange(src);
          setOpen(false);
        }}
      />
    </Col>
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

  if (!album.length) return <Empty description={NO_PHOTOS} />;

  const shown = items.filter((src) => visible.has(src));

  return (
    <div>
      <Flex wrap align="center" gap={8} style={{ marginBottom: 16 }}>
        <Typography.Text type="secondary" style={{ marginRight: "auto" }}>
          Hiển thị <Typography.Text strong>{shown.length}</Typography.Text> / {items.length} ảnh · kéo thả để đổi vị trí
        </Typography.Text>
        <Button onClick={() => commit(items, new Set(items))}>Chọn tất cả</Button>
        <Button onClick={() => commit(items, new Set())}>Bỏ chọn tất cả</Button>
      </Flex>

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

              <span className="absolute top-1.5 left-1.5 flex rounded-md bg-white/90 px-1 py-0.5 shadow">
                <Checkbox checked={checked} onChange={() => toggle(src)} aria-label={`Hiển thị ${albumFileName(src)}`} />
              </span>
              {position > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-6 rounded-full bg-wine px-1.5 py-0.5 text-center text-xs font-semibold text-ivory">
                  {position}
                </span>
              )}
              <HolderOutlined className="absolute right-1.5 bottom-7 text-white opacity-0 drop-shadow transition group-hover:opacity-100" />
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
