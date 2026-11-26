"use client";

import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, DatabaseBackup, ExternalLink, Eye, EyeOff, KeyRound, Loader2, LogOut, Plus, Save, Shuffle, Trash2 } from "lucide-react";
import { SIDE_LABEL, type WeddingContent } from "@/config/wedding";
import type { Rsvp } from "@/app/api/rsvp/route";
import type { Wish } from "@/app/api/wishes/route";
import { inviteeOf, type Guest } from "@/lib/guest";
import { AlbumContext, GalleryEditor, ImageField } from "./AlbumPicker";
import { BackupManager } from "./BackupManager";
import { SUGGESTED_GALLERY_SIZE, withSuggestedImages } from "./suggestImages";
import { GuestManager } from "./GuestManager";
import { PREVIEW_READY, PREVIEW_SECTIONS, PREVIEW_UPDATE, type PreviewMessage, type PreviewSection } from "./previewProtocol";
import { Section, buttonClass, inputClass } from "./ui";

type Data = { content: WeddingContent; rsvp: Rsvp[]; wishes: Wish[]; guests: Guest[]; album: string[] };
type Tab = "content" | "guests" | "rsvp" | "wishes" | "password" | "backup";


function Field({
  label,
  value,
  onChange,
  multiline,
  rows = 3,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  rows?: number;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {multiline ? (
        <textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />
      )}
      {hint && <span className="mt-1 block text-xs text-muted/80">{hint}</span>}
    </label>
  );
}

/** Ngày giờ lưu dạng ISO cố định múi giờ Việt Nam */
function DateField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      <input
        type="datetime-local"
        value={value.slice(0, 16)}
        onChange={(e) => onChange(e.target.value ? `${e.target.value}:00+07:00` : "")}
        className={inputClass}
      />
    </label>
  );
}

const grid = "grid gap-4 sm:grid-cols-2";

function ListEditor<T>({
  items,
  onChange,
  blank,
  itemLabel,
  render,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  blank: T;
  itemLabel: string;
  render: (item: T, patch: (changes: Partial<T>) => void) => React.ReactNode;
}) {
  const move = (from: number, to: number) => {
    const next = [...items];
    next.splice(to, 0, ...next.splice(from, 1));
    onChange(next);
  };
  const iconButton = "cursor-pointer rounded-full p-1.5 text-muted transition hover:bg-blush/60 hover:text-wine disabled:opacity-30";

  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div key={i} className="rounded-xl border border-gold/15 bg-ivory/60 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-ink">
              {itemLabel} {i + 1}
            </span>
            <div className="flex gap-1">
              <button type="button" aria-label="Chuyển lên" disabled={i === 0} onClick={() => move(i, i - 1)} className={iconButton}>
                <ArrowUp className="size-4" />
              </button>
              <button type="button" aria-label="Chuyển xuống" disabled={i === items.length - 1} onClick={() => move(i, i + 1)} className={iconButton}>
                <ArrowDown className="size-4" />
              </button>
              <button type="button" aria-label="Xóa" onClick={() => onChange(items.filter((_, j) => j !== i))} className={iconButton}>
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
          {render(item, (changes) => onChange(items.map((it, j) => (j === i ? { ...it, ...changes } : it))))}
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, blank])}
        className={`${buttonClass} border border-gold/40 px-4 py-2 text-wine hover:bg-blush/40`}
      >
        <Plus className="size-4" /> Thêm {itemLabel.toLowerCase()}
      </button>
    </div>
  );
}

function PersonFields({
  person,
  onChange,
}: {
  person: WeddingContent["groom"];
  onChange: (person: WeddingContent["groom"]) => void;
}) {
  const patch = (changes: Partial<WeddingContent["groom"]>) => onChange({ ...person, ...changes });
  return (
    <div className={grid}>
      <Field label="Tên hiển thị" value={person.name} onChange={(name) => patch({ name })} />
      <Field label="Họ tên đầy đủ" value={person.fullName} onChange={(fullName) => patch({ fullName })} />
      <Field label="Vai trò" value={person.role} onChange={(role) => patch({ role })} />
      <Field label="Ngày sinh" value={person.birthday} onChange={(birthday) => patch({ birthday })} />
      <Field label="Bố" value={person.parents.father} onChange={(father) => patch({ parents: { ...person.parents, father } })} />
      <Field label="Mẹ" value={person.parents.mother} onChange={(mother) => patch({ parents: { ...person.parents, mother } })} />
      <div className="sm:col-span-2">
        <Field label="Giới thiệu" multiline value={person.bio} onChange={(bio) => patch({ bio })} />
      </div>
      <ImageField label="Ảnh" value={person.photo} onChange={(photo) => patch({ photo })} />
    </div>
  );
}

/** Khung điện thoại chạy chính các component của thiệp, hiển thị cả nội dung chưa lưu */
function PhonePreview({ content, section }: { content: WeddingContent; section: PreviewSection }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [readyCount, setReadyCount] = useState(0);
  const label = PREVIEW_SECTIONS.find((s) => s.id === section)?.label;

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frameRef.current?.contentWindow) return;
      if (event.data?.type === PREVIEW_READY) setReadyCount((count) => count + 1);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    if (!readyCount) return;
    const message: PreviewMessage = { type: PREVIEW_UPDATE, content, section };
    frameRef.current?.contentWindow?.postMessage(message, window.location.origin);
  }, [readyCount, content, section]);

  return (
    <aside className="sticky top-[72px] hidden lg:block">
      <p className="mb-2 text-center text-xs font-medium text-muted">Xem trước: {label}</p>
      <div className="overflow-hidden rounded-[2.5rem] border-[10px] border-ink bg-ink shadow-xl">
        <iframe
          ref={frameRef}
          src="/admin/preview"
          title="Xem trước trên điện thoại"
          className="block h-[min(calc(100svh-190px),780px)] w-[390px] rounded-[1.75rem] bg-white"
        />
      </div>
    </aside>
  );
}

function ContentForm({
  content,
  section,
  onChange,
}: {
  content: WeddingContent;
  section: PreviewSection;
  onChange: (content: WeddingContent) => void;
}) {
  const update = (changes: Partial<WeddingContent>) => onChange({ ...content, ...changes });
  const album = useContext(AlbumContext);

  return (
    <div className="space-y-5">
      {section === "home" && (
        <Section title="Trang chủ">
          <div className={grid}>
            <Field label="Tên chú rể" value={content.groom.name} onChange={(name) => update({ groom: { ...content.groom, name } })} />
            <Field label="Tên cô dâu" value={content.bride.name} onChange={(name) => update({ bride: { ...content.bride, name } })} />
            <div className="sm:col-span-2">
              <Field label="Ngày âm lịch" value={content.lunarDate} onChange={(lunarDate) => update({ lunarDate })} />
            </div>
            <ImageField label="Ảnh chính" value={content.hero.image} onChange={(image) => update({ hero: { image } })} />
          </div>
          <p className="mt-4 text-xs text-muted">Lịch trình và địa điểm ở trang chủ được sửa trong tab Sự kiện.</p>
        </Section>
      )}

      {section === "countdown" && (
        <Section title="Đếm ngược & lời dẫn">
          <div className={grid}>
            <div className="sm:col-span-2">
              <DateField label="Thời điểm đếm ngược (giờ Việt Nam)" value={content.date} onChange={(date) => update({ date })} />
            </div>
            <div className="sm:col-span-2">
              <Field label="Câu trích dẫn" multiline rows={2} value={content.quote} onChange={(quote) => update({ quote })} />
            </div>
            <Field label="Tác giả câu trích dẫn" value={content.quoteAuthor} onChange={(quoteAuthor) => update({ quoteAuthor })} />
          </div>
        </Section>
      )}

      {section === "couple" && (
        <>
          <Section title="Chú rể">
            <PersonFields person={content.groom} onChange={(groom) => update({ groom })} />
          </Section>
          <Section title="Cô dâu">
            <PersonFields person={content.bride} onChange={(bride) => update({ bride })} />
          </Section>
        </>
      )}

      {section === "events" && (
      <Section title="Sự kiện">
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          {(["groom", "bride"] as const).map((side) => (
            <div key={side} className="space-y-3 rounded-xl border border-gold/15 bg-ivory/60 p-4">
              <p className="text-sm font-semibold text-ink">Địa điểm {SIDE_LABEL[side].toLowerCase()}</p>
              <Field
                label="Tên địa điểm"
                value={content.places[side].venue}
                onChange={(venue) => update({ places: { ...content.places, [side]: { ...content.places[side], venue } } })}
              />
              <Field
                label="Địa chỉ (dùng cho bản đồ và chỉ đường)"
                value={content.places[side].address}
                onChange={(address) => update({ places: { ...content.places, [side]: { ...content.places[side], address } } })}
              />
              <p className="text-xs break-all text-muted">
                Link chung cho khách {SIDE_LABEL[side].toLowerCase()}: <span className="font-mono">/?side={side}</span>
              </p>
            </div>
          ))}
          <p className="text-xs text-muted sm:col-span-2">
            Các sự kiện dùng chung giờ, địa chỉ hiện theo bên: link có <span className="font-mono">?side=groom</span> /{" "}
            <span className="font-mono">?side=bride</span>, hoặc link mời riêng theo bên đã chọn cho khách. Không rõ bên nào thì thiệp hiện cả
            hai (như khung xem trước).
          </p>
        </div>
        <ListEditor
          items={content.events}
          onChange={(events) => update({ events })}
          itemLabel="Sự kiện"
          blank={{ title: "", side: "", start: "", end: "", image: "", main: false }}
          render={(event, patch) => (
            <div className={grid}>
              <Field label="Tên sự kiện" value={event.title} onChange={(title) => patch({ title })} />
              <Field label="Nhãn (vd: Ngày thứ nhất)" value={event.side} onChange={(side) => patch({ side })} />
              <DateField label="Bắt đầu (giờ Việt Nam)" value={event.start} onChange={(start) => patch({ start })} />
              <DateField label="Kết thúc (giờ Việt Nam)" value={event.end} onChange={(end) => patch({ end })} />
              <ImageField label="Ảnh" value={event.image} onChange={(image) => patch({ image })} />
              <label className="flex items-center gap-2 text-sm text-ink sm:col-span-2">
                <input
                  type="checkbox"
                  checked={event.main}
                  onChange={(e) =>
                    update({
                      events: content.events.map((it) =>
                        it === event ? { ...it, main: e.target.checked } : { ...it, main: e.target.checked ? false : it.main },
                      ),
                    })
                  }
                />
                Sự kiện chính (hiển thị nổi bật ở đầu trang)
              </label>
            </div>
          )}
        />
      </Section>
      )}

      {section === "story" && (
      <Section title="Chuyện tình">
        <ListEditor
          items={content.story}
          onChange={(story) => update({ story })}
          itemLabel="Chương"
          blank={{ date: "", title: "", text: "", image: "" }}
          render={(item, patch) => (
            <div className={grid}>
              <Field label="Thời gian" value={item.date} onChange={(date) => patch({ date })} />
              <Field label="Tiêu đề" value={item.title} onChange={(title) => patch({ title })} />
              <div className="sm:col-span-2">
                <Field label="Nội dung" multiline value={item.text} onChange={(text) => patch({ text })} />
              </div>
              <ImageField label="Ảnh" value={item.image} onChange={(image) => patch({ image })} />
            </div>
          )}
        />
      </Section>
      )}

      {section === "gallery" && (
        <Section title="Album">
          <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-gold/20 bg-blush/20 p-3">
            <p className="min-w-0 flex-1 text-sm text-ink/80">
              Chọn ngẫu nhiên ảnh hợp với từng phần (trang chủ, cô dâu chú rể, sự kiện, chuyện tình, cuối trang) và {SUGGESTED_GALLERY_SIZE} ảnh
              cho album. Bấm lại để đổi bộ khác, ưng thì bấm Lưu.
            </p>
            <button
              type="button"
              onClick={() => onChange(withSuggestedImages(content, album))}
              className={`${buttonClass} shrink-0 bg-wine px-4 py-2 text-ivory hover:bg-rose`}
            >
              <Shuffle className="size-4" /> Gợi ý ngẫu nhiên
            </button>
          </div>
          <GalleryEditor gallery={content.gallery} order={content.galleryOrder ?? []} onChange={update} />
          <p className="mt-4 text-xs text-muted">
            Ảnh lấy từ thư mục public/albums. Ảnh thứ 4 đang hiển thị được dùng làm nền phần Xác nhận tham dự.
          </p>
        </Section>
      )}

      {section === "rsvp" && (
        <Section title="Xác nhận tham dự">
          <Field label="Hạn xác nhận tham dự" value={content.rsvpDeadline} onChange={(rsvpDeadline) => update({ rsvpDeadline })} />
          <p className="mt-4 text-xs text-muted">Ảnh nền của phần này là ảnh thứ 4 trong Album. Form trong khung xem trước không gửi dữ liệu thật.</p>
        </Section>
      )}

      {section === "footer" && (
        <Section title="Cuối trang & nhạc">
          <div className={grid}>
            <ImageField label="Ảnh cuối trang" value={content.footerImage} onChange={(footerImage) => update({ footerImage })} />
            <Field label="Ngày hiển thị ở cuối trang" value={content.displayDate} onChange={(displayDate) => update({ displayDate })} />
            <Field label="Nhạc nền" value={content.music} onChange={(music) => update({ music })} />
          </div>
        </Section>
      )}

      {section === "gift" && (
      <Section title="Mừng cưới">
        <ListEditor
          items={content.gifts}
          onChange={(gifts) => update({ gifts })}
          itemLabel="Tài khoản"
          blank={{ label: "", bankId: "", bankName: "", accountNo: "", accountName: "" }}
          render={(gift, patch) => (
            <div className={grid}>
              <Field label="Tiêu đề" value={gift.label} onChange={(label) => patch({ label })} />
              <Field label="Tên ngân hàng" value={gift.bankName} onChange={(bankName) => patch({ bankName })} />
              <Field label="Mã VietQR (VCB, TCB, MB...)" value={gift.bankId} onChange={(bankId) => patch({ bankId })} />
              <Field label="Số tài khoản" value={gift.accountNo} onChange={(accountNo) => patch({ accountNo })} />
              <Field label="Chủ tài khoản" value={gift.accountName} onChange={(accountName) => patch({ accountName })} />
            </div>
          )}
        />
      </Section>
      )}
    </div>
  );
}

const formatDate =(iso: string) => new Date(iso).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

function RsvpList({ items, invited }: { items: Rsvp[]; invited: Guest[] }) {
  const guestById = new Map(invited.map((g) => [g.id, g]));
  const coming = items.filter((r) => r.attending);
  const guests = coming.reduce((sum, r) => sum + r.guests, 0);
  return (
    <Section title="Xác nhận tham dự">
      <p className="mb-4 text-sm text-muted">
        {items.length} phản hồi · {coming.length} sẽ đến · tổng {guests} khách
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-gold/30 text-xs text-muted">
            <tr>
              {["Tên", "Điện thoại", "Tham dự", "Số người", "Bên", "Ghi chú", "Thời gian"].map((h) => (
                <th key={h} className="py-2 pr-4 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id} className="border-b border-gold/10 align-top">
                <td className="py-2 pr-4 font-medium text-ink">
                  {r.name}
                  {r.guestId && guestById.has(r.guestId) && (
                    <span className="block text-xs font-normal text-muted">Link mời: {inviteeOf(guestById.get(r.guestId))}</span>
                  )}
                </td>
                <td className="py-2 pr-4">{r.phone}</td>
                <td className="py-2 pr-4">{r.attending ? "Có" : "Không"}</td>
                <td className="py-2 pr-4">{r.attending ? r.guests : ""}</td>
                <td className="py-2 pr-4">{SIDE_LABEL[r.side as keyof typeof SIDE_LABEL] ?? r.side}</td>
                <td className="py-2 pr-4">{r.note}</td>
                <td className="py-2 whitespace-nowrap text-muted">{formatDate(r.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function WishList({ items }: { items: Wish[] }) {
  return (
    <Section title="Lời chúc">
      <ul className="space-y-3">
        {items.map((w) => (
          <li key={w.id} className="rounded-xl border border-gold/15 bg-ivory/60 p-4 text-sm">
            <p className="font-medium text-ink">{w.name}</p>
            <p className="mt-1 text-ink/80">{w.message}</p>
            <p className="mt-2 text-xs text-muted">{formatDate(w.createdAt)}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/** Ô mật khẩu có nút con mắt để hiện / ẩn */
function PasswordInput(props: { name: string; autoComplete: string; minLength?: number; placeholder?: string }) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;
  return (
    <div className="relative">
      <input {...props} type={visible ? "text" : "password"} required className={`${inputClass} pr-10`} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex w-10 cursor-pointer items-center justify-center text-muted transition hover:text-wine"
      >
        <Icon className="size-4" />
      </button>
    </div>
  );
}

function LoginForm({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))),
      });
      if (res.ok) return onLoggedIn();
      setError((await res.json().catch(() => null))?.error ?? "Có lỗi xảy ra");
    } catch {
      setError("Không kết nối được tới server");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-svh items-center justify-center bg-ivory px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-2xl border border-gold/20 bg-white p-8 shadow-lg">
        <h1 className="text-center font-serif text-3xl font-semibold text-wine">Quản trị thiệp</h1>
        <input name="username" required autoComplete="username" placeholder="Tài khoản" className={inputClass} />
        <PasswordInput name="password" autoComplete="current-password" placeholder="Mật khẩu" />
        {error && <p className="text-sm text-rose">{error}</p>}
        <button disabled={busy} className={`${buttonClass} w-full bg-wine px-4 py-2.5 text-ivory hover:bg-rose`}>
          {busy && <Loader2 className="size-4 animate-spin" />} Đăng nhập
        </button>
      </form>
    </main>
  );
}

function PasswordForm({ onUnauthorized }: { onUnauthorized: () => void }) {
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    if (values.newPassword !== values.confirmPassword) {
      return setMessage({ ok: false, text: "Mật khẩu xác nhận không khớp" });
    }
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/session", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (res.status === 401) return onUnauthorized();
      if (!res.ok) return setMessage({ ok: false, text: (await res.json().catch(() => null))?.error ?? "Có lỗi xảy ra" });
      form.reset();
      setMessage({ ok: true, text: "Đã đổi mật khẩu" });
    } catch {
      setMessage({ ok: false, text: "Không kết nối được tới server" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section title="Đổi mật khẩu">
      <form onSubmit={onSubmit} className="max-w-sm space-y-4">
        {[
          { name: "currentPassword", label: "Mật khẩu cũ", autoComplete: "current-password", minLength: undefined },
          { name: "newPassword", label: "Mật khẩu mới (ít nhất 8 ký tự)", autoComplete: "new-password", minLength: 8 },
          { name: "confirmPassword", label: "Xác nhận mật khẩu mới", autoComplete: "new-password", minLength: 8 },
        ].map((f) => (
          <label key={f.name} className="block">
            <span className="mb-1 block text-xs font-medium text-muted">{f.label}</span>
            <PasswordInput name={f.name} autoComplete={f.autoComplete} minLength={f.minLength} />
          </label>
        ))}
        {message && <p className={`text-sm ${message.ok ? "text-gold-dark" : "text-rose"}`}>{message.text}</p>}
        <button disabled={busy} className={`${buttonClass} bg-wine px-6 py-2.5 text-ivory hover:bg-rose`}>
          {busy && <Loader2 className="size-4 animate-spin" />} Đổi mật khẩu
        </button>
      </form>
    </Section>
  );
}

export function AdminApp() {
  const [status, setStatus] = useState<"loading" | "login" | "ready" | "error">("loading");
  const [data, setData] = useState<Data | null>(null);
  const [tab, setTab] = useState<Tab>("content");
  const [section, setSection] = useState<PreviewSection>("home");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/admin/data", { cache: "no-store" });
      if (res.status === 401) return setStatus("login");
      if (!res.ok) return setStatus("error");
      setData(await res.json());
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  /** Tải lại dữ liệu ngầm (sau khi khôi phục backup), không xóa màn hình đang xem */
  const reload = useCallback(async () => {
    const res = await fetch("/api/admin/data", { cache: "no-store" }).catch(() => null);
    if (res?.status === 401) return setStatus("login");
    if (res?.ok) setData(await res.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!data) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/data", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.content),
      });
      if (res.status === 401) return setStatus("login");
      const result = await res.json().catch(() => null);
      if (!res.ok) return setMessage({ ok: false, text: result?.error ?? "Không lưu được" });
      setData({ ...data, content: result.content });
      setMessage({ ok: true, text: "Đã lưu, thiệp đã cập nhật" });
    } catch {
      setMessage({ ok: false, text: "Không kết nối được tới server" });
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    await fetch("/api/admin/session", { method: "DELETE" }).catch(() => {});
    setData(null);
    setStatus("login");
  };

  if (status === "login") return <LoginForm onLoggedIn={load} />;
  if (status === "error") {
    return <main className="flex min-h-svh items-center justify-center bg-ivory text-sm text-rose">Không tải được dữ liệu từ database</main>;
  }
  if (status === "loading" || !data) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-ivory">
        <Loader2 className="size-6 animate-spin text-gold" />
      </main>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "content", label: "Nội dung thiệp" },
    { id: "guests", label: `Khách mời (${data.guests.length})` },
    { id: "rsvp", label: `Xác nhận (${data.rsvp.length})` },
    { id: "wishes", label: `Lời chúc (${data.wishes.length})` },
  ];

  return (
    <div className="min-h-svh bg-ivory text-ink">
      <header className="sticky top-0 z-10 border-b border-gold/20 bg-white/95">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <h1 className="font-serif text-xl font-semibold text-wine">Quản trị thiệp</h1>
          <nav className="flex gap-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`cursor-pointer rounded-full px-3 py-1.5 text-sm transition ${tab === t.id ? "bg-wine text-ivory" : "text-muted hover:bg-blush/50"}`}
              >
                {t.label}
              </button>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <a href="/" target="_blank" rel="noreferrer" aria-label="Xem thiệp" className="rounded-full p-2 text-muted transition hover:bg-blush/50 hover:text-wine">
              <ExternalLink className="size-4" />
            </a>
            <button
              type="button"
              onClick={() => setTab("password")}
              aria-label="Đổi mật khẩu"
              aria-pressed={tab === "password"}
              className={`cursor-pointer rounded-full p-2 transition hover:bg-blush/50 hover:text-wine ${tab === "password" ? "bg-blush/50 text-wine" : "text-muted"}`}
            >
              <KeyRound className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setTab("backup")}
              aria-label="Sao lưu & khôi phục"
              title="Sao lưu & khôi phục"
              aria-pressed={tab === "backup"}
              className={`cursor-pointer rounded-full p-2 transition hover:bg-blush/50 hover:text-wine ${tab === "backup" ? "bg-blush/50 text-wine" : "text-muted"}`}
            >
              <DatabaseBackup className="size-4" />
            </button>
            <button type="button" onClick={logout} aria-label="Đăng xuất" className="cursor-pointer rounded-full p-2 text-muted transition hover:bg-blush/50 hover:text-wine">
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </header>

      <main className={`mx-auto px-4 py-6 pb-28 ${tab === "content" ? "max-w-7xl" : "max-w-4xl"}`}>
        {tab === "content" && (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
            <div className="min-w-0">
              <nav aria-label="Phần cần chỉnh sửa" className="mb-5 flex flex-wrap gap-2">
                {PREVIEW_SECTIONS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={section === s.id}
                    onClick={() => setSection(s.id)}
                    className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-sm transition ${
                      section === s.id ? "border-wine bg-wine text-ivory" : "border-gold/30 bg-white text-ink/80 hover:bg-blush/50"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </nav>
              <AlbumContext value={data.album}>
                <ContentForm content={data.content} section={section} onChange={(content) => setData({ ...data, content })} />
              </AlbumContext>
            </div>
            <PhonePreview content={data.content} section={section} />
          </div>
        )}
        {tab === "guests" && (
          <GuestManager
            guests={data.guests}
            rsvp={data.rsvp}
            content={data.content}
            onChange={(guests) => setData({ ...data, guests })}
            onUnauthorized={() => setStatus("login")}
          />
        )}
        {tab === "rsvp" && <RsvpList items={data.rsvp} invited={data.guests} />}
        {tab === "wishes" && <WishList items={data.wishes} />}
        {tab === "password" && <PasswordForm onUnauthorized={() => setStatus("login")} />}
        {tab === "backup" && <BackupManager onUnauthorized={() => setStatus("login")} onRestored={reload} />}
      </main>

      {tab === "content" && (
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-gold/20 bg-white/95">
          <div className="mx-auto flex max-w-7xl items-center justify-end gap-4 px-4 py-3">
            {message && <p className={`min-w-0 flex-1 text-sm ${message.ok ? "text-gold-dark" : "text-rose"}`}>{message.text}</p>}
            <button type="button" onClick={save} disabled={saving} className={`${buttonClass} shrink-0 bg-wine px-6 py-2.5 text-ivory hover:bg-rose`}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Lưu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
