import { useRef, useState } from "react";

export const inputClass =
  "w-full rounded-lg border border-gold/30 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20";
export const buttonClass =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full text-sm font-medium transition disabled:opacity-60";

const PER_PAGE = 10;

/**
 * Phân trang phía trình duyệt; đổi trang thì cuộn về đầu danh sách (gắn topRef vào đó).
 * resetKey đổi (vd từ khóa tìm kiếm, bộ lọc) thì quay về trang 1.
 */
export function usePaged<T>(items: T[], resetKey: unknown = null, pageSize = PER_PAGE) {
  const [state, setState] = useState({ page: 1, key: resetKey });
  const topRef = useRef<HTMLDivElement>(null);
  const page = Object.is(state.key, resetKey) ? state.page : 1;
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  // danh sách ngắn lại (xóa, tải lại dữ liệu) thì không đứng ở trang không còn tồn tại
  const current = Math.min(page, pages);
  return {
    topRef,
    shown: items.slice((current - 1) * pageSize, current * pageSize),
    pagination: {
      page: current,
      pageSize,
      total: items.length,
      onChange: (next: number) => {
        setState({ page: next, key: resetKey });
        topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      },
    },
  };
}

/** Các số trang cần hiện: trang đầu, cuối, quanh trang hiện tại; "…" cho khoảng bị lược */
function pageItems(page: number, pages: number): (number | "…")[] {
  const wanted = new Set([1, pages, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pages));
  const sorted = [...wanted].sort((a, b) => a - b);
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? (["…", p] as const) : [p]));
}

/** Thanh phân trang; page bắt đầu từ 1 */
export function Pagination({
  page,
  pageSize,
  total,
  onChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const pill = "flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-full px-2.5 text-sm transition disabled:cursor-default disabled:opacity-40";

  return (
    <nav aria-label="Phân trang" className="mt-5 flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-muted">
        {from}–{to} / {total}
      </p>
      <div className="flex items-center gap-1">
        <button type="button" onClick={() => onChange(page - 1)} disabled={page === 1} aria-label="Trang trước" className={`${pill} text-wine hover:bg-blush/50`}>
          ‹
        </button>
        {pageItems(page, pages).map((p, i) =>
          p === "…" ? (
            <span key={`gap-${i}`} className="px-1 text-sm text-muted">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              aria-current={p === page ? "page" : undefined}
              className={`${pill} ${p === page ? "bg-wine text-ivory" : "text-ink/80 hover:bg-blush/50"}`}
            >
              {p}
            </button>
          ),
        )}
        <button type="button" onClick={() => onChange(page + 1)} disabled={page === pages} aria-label="Trang sau" className={`${pill} text-wine hover:bg-blush/50`}>
          ›
        </button>
      </div>
    </nav>
  );
}

export function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-gold/20 bg-white/80 p-5 md:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-2xl font-semibold text-wine">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
