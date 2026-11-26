"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronDown } from "lucide-react";

export type SelectOption = { value: string; label: string; disabled?: boolean };

type Props = {
  options: readonly SelectOption[];
  /** Có value là điều khiển từ ngoài; không thì tự giữ giá trị, bắt đầu từ defaultValue */
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Tên trường trong form (gửi qua input ẩn, đọc được bằng FormData) */
  name?: string;
  placeholder?: string;
  /** Class của ô bấm, để khớp với các ô nhập khác trong cùng form */
  className?: string;
  "aria-label"?: string;
};

type Position = { left: number; width: number; top?: number; bottom?: number; maxHeight: number };

const GAP = 6;
const MAX_LIST = 280;

/**
 * Select tự vẽ thay cho danh sách gốc của trình duyệt.
 * Danh sách render vào body (portal) nên không bị cắt bởi khung overflow-hidden của form.
 */
export function Select({ options, value, defaultValue = "", onChange, name, placeholder, className = "", ...aria }: Props) {
  const [inner, setInner] = useState(defaultValue);
  const current = value ?? inner;
  const selected = options.find((o) => o.value === current);

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [position, setPosition] = useState<Position | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const id = useId();

  const choose = (option: SelectOption) => {
    if (option.disabled) return;
    if (value === undefined) setInner(option.value);
    onChange?.(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const enabled = options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);
  const step = (from: number, dir: 1 | -1) => {
    if (!enabled.length) return -1;
    const pos = enabled.indexOf(from);
    if (pos < 0) return dir === 1 ? enabled[0] : enabled[enabled.length - 1];
    return enabled[Math.min(Math.max(pos + dir, 0), enabled.length - 1)];
  };

  const openList = () => {
    const index = options.findIndex((o) => o.value === current && !o.disabled);
    setActive(index >= 0 ? index : (enabled[0] ?? -1));
    setOpen(true);
  };

  /** Mở xuống dưới, không đủ chỗ thì mở lên trên */
  const place = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const below = window.innerHeight - rect.bottom - GAP * 2;
    const above = rect.top - GAP * 2;
    const up = below < Math.min(MAX_LIST, 160) && above > below;
    setPosition({
      left: rect.left,
      width: rect.width,
      ...(up ? { bottom: window.innerHeight - rect.top + GAP } : { top: rect.bottom + GAP }),
      maxHeight: Math.min(MAX_LIST, up ? above : below),
    });
  }, []);

  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!triggerRef.current?.contains(target) && !listRef.current?.contains(target)) setOpen(false);
    };
    window.addEventListener("pointerdown", onPointer);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, place]);

  useEffect(() => {
    if (open && active >= 0) listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "Tab") {
      setOpen(false);
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => step(i, e.key === "ArrowDown" ? 1 : -1));
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      setActive(e.key === "Home" ? (enabled[0] ?? -1) : (enabled[enabled.length - 1] ?? -1));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (options[active]) choose(options[active]);
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-activedescendant={open && active >= 0 ? `${id}-${active}` : undefined}
        aria-label={aria["aria-label"]}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className={`${className} flex cursor-pointer items-center justify-between gap-2 text-left`}
      >
        <span className={`truncate ${selected ? "" : "text-muted/70"}`}>{selected?.label ?? placeholder ?? ""}</span>
        <ChevronDown className={`size-4 shrink-0 text-gold transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      {name && <input type="hidden" name={name} value={current} />}

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && position && (
              <motion.ul
                ref={listRef}
                id={`${id}-list`}
                role="listbox"
                data-lenis-prevent
                initial={{ opacity: 0, y: position.top !== undefined ? -6 : 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: position.top !== undefined ? -6 : 6, scale: 0.98 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                style={{ position: "fixed", left: position.left, width: position.width, top: position.top, bottom: position.bottom, maxHeight: position.maxHeight }}
                className="z-[140] overflow-y-auto overscroll-contain rounded-2xl border border-gold/25 bg-ivory/98 p-1.5 shadow-[0_20px_50px_rgba(58,46,41,0.22)] backdrop-blur"
              >
                {options.map((option, i) => {
                  const isSelected = option.value === current;
                  return (
                    <li
                      key={option.value}
                      id={`${id}-${i}`}
                      data-index={i}
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={option.disabled}
                      onPointerEnter={() => !option.disabled && setActive(i)}
                      onClick={() => choose(option)}
                      className={`flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors ${
                        option.disabled
                          ? "cursor-default text-muted/60"
                          : `cursor-pointer ${i === active ? "bg-blush/70 text-wine" : "text-ink"} ${isSelected ? "font-semibold text-wine" : ""}`
                      }`}
                    >
                      <span className="truncate">{option.label}</span>
                      {isSelected && <Check className="size-4 shrink-0 text-gold" />}
                    </li>
                  );
                })}
              </motion.ul>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
