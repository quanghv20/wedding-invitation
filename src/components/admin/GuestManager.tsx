"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Link2, Loader2, MessageSquareText, Pencil, Search, Trash2, X } from "lucide-react";
import type { WeddingContent } from "@/config/wedding";
import type { Rsvp } from "@/app/api/rsvp/route";
import {
  EXTRA_SUGGESTIONS,
  GUEST_PRESETS,
  HOST_SUGGESTIONS,
  TITLE_SUGGESTIONS,
  guestUrl,
  hostsOf,
  inviteMessage,
  inviteeOf,
  type Guest,
  type GuestInput,
} from "@/lib/guest";
import { Section, buttonClass, inputClass } from "./ui";

const BLANK: GuestInput = { title: "", name: "", extra: "", hostPronoun: "", side: "", group: "", message: "" };
const SIDES = [
  { value: "", label: "Không ghi" },
  { value: "groom", label: "Nhà trai" },
  { value: "bride", label: "Nhà gái" },
] as const;
const SIDE_LABEL: Record<string, string> = { groom: "Nhà trai", bride: "Nhà gái" };

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // trình duyệt chặn clipboard (không phải https): để admin tự chép
    window.prompt("Sao chép nội dung dưới đây:", text);
    return false;
  }
}

/** Nút sao chép, đổi thành dấu tích một lúc sau khi chép xong */
function CopyButton({ text, label, icon: Icon = Copy, primary }: { text: string; label: string; icon?: typeof Copy; primary?: boolean }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        if (await copyText(text)) {
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        }
      }}
      className={`${buttonClass} px-3 py-1.5 ${primary ? "bg-wine text-ivory hover:bg-rose" : "border border-gold/40 text-wine hover:bg-blush/40"}`}
    >
      {done ? <Check className="size-4" /> : <Icon className="size-4" />} {done ? "Đã chép" : label}
    </button>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  list,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  list?: string;
  options?: string[];
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} list={list} className={inputClass} />
      {list && options && (
        <datalist id={list}>
          {options.map((o) => (
            <option key={o} value={o} />
          ))}
        </datalist>
      )}
    </label>
  );
}

/** Thu nhỏ đúng phần lời mời ở đầu thiệp */
function InvitePreview({ guest }: { guest: GuestInput }) {
  const filled = guest.name.trim() ? guest : null;
  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#fff1f4] via-white to-[#fff6ec] p-5 text-center ring-1 ring-gold/20">
      <p className="text-[10px] font-semibold tracking-[0.4em] text-[#e0587f] uppercase">Trân trọng kính mời</p>
      <p className="mt-1 font-script text-3xl leading-tight text-balance text-wine">{inviteeOf(filled)}</p>
      <p className="mt-1 font-serif text-sm text-ink/70 italic">tới dự lễ thành hôn của {hostsOf(filled)}</p>
      {guest.message.trim() && (
        <p className="mx-auto mt-3 max-w-xs rounded-xl bg-white/80 px-3 py-2 font-serif text-sm text-ink/80 italic ring-1 ring-gold/10">
          “{guest.message.trim()}”
        </p>
      )}
    </div>
  );
}

type RsvpStatus = { label: string; className: string };

function statusOf(rsvp: Rsvp | undefined): RsvpStatus {
  if (!rsvp) return { label: "Chưa phản hồi", className: "bg-ink/5 text-muted" };
  if (rsvp.attending) return { label: `Sẽ đến · ${rsvp.guests} người`, className: "bg-emerald-50 text-emerald-700" };
  return { label: "Không đến", className: "bg-rose/10 text-rose" };
}

export function GuestManager({
  guests,
  rsvp,
  content,
  onChange,
  onUnauthorized,
}: {
  guests: Guest[];
  rsvp: Rsvp[];
  content: WeddingContent;
  onChange: (guests: Guest[]) => void;
  onUnauthorized: () => void;
}) {
  const [form, setForm] = useState<GuestInput>(BLANK);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [namePlaceholder, setNamePlaceholder] = useState("Tên người được mời");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<Guest | null>(null);
  const [query, setQuery] = useState("");
  const [sideFilter, setSideFilter] = useState<"" | "groom" | "bride">("");

  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const couple = `${content.groom.name} & ${content.bride.name}`;
  const patch = (changes: Partial<GuestInput>) => setForm((f) => ({ ...f, ...changes }));
  const groups = Array.from(new Set(guests.map((g) => g.group).filter(Boolean)));

  // RSVP mới nhất gửi từ link của từng khách (danh sách RSVP đã xếp mới nhất trước)
  const rsvpByGuest = new Map<string, Rsvp>();
  for (const r of rsvp) if (r.guestId && !rsvpByGuest.has(r.guestId)) rsvpByGuest.set(r.guestId, r);

  const call = async (method: "POST" | "PUT" | "DELETE", body: object) => {
    const res = await fetch("/api/admin/guests", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.status === 401) {
      onUnauthorized();
      return null;
    }
    const result = await res.json().catch(() => null);
    if (!res.ok) throw new Error(result?.error ?? "Có lỗi xảy ra");
    return result as { guests: Guest[]; guest?: Guest };
  };

  const resetForm = () => {
    setForm(BLANK);
    setEditingId(null);
    setError("");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await call(editingId ? "PUT" : "POST", editingId ? { ...form, id: editingId } : form);
      if (!result) return;
      onChange(result.guests);
      setCreated(editingId ? (result.guests.find((g) => g.id === editingId) ?? null) : (result.guest ?? null));
      // giữ danh xưng, cách xưng hô, bên và nhóm để tạo tiếp người cùng loại cho nhanh
      setForm((f) => ({ ...f, name: "", extra: "", message: "" }));
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setBusy(false);
    }
  };

  const edit = (guest: Guest) => {
    setEditingId(guest.id);
    setCreated(null);
    setError("");
    setForm({
      title: guest.title,
      name: guest.name,
      extra: guest.extra,
      hostPronoun: guest.hostPronoun,
      side: guest.side,
      group: guest.group,
      message: guest.message,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (guest: Guest) => {
    if (!window.confirm(`Xóa lời mời "${inviteeOf(guest)}"? Link đã gửi sẽ hiện "Quý khách".`)) return;
    try {
      const result = await call("DELETE", { id: guest.id });
      if (!result) return;
      onChange(result.guests);
      if (editingId === guest.id) resetForm();
      if (created?.id === guest.id) setCreated(null);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Không xóa được");
    }
  };

  /** Bỏ dấu để gõ "quang coi" vẫn tìm ra "Quang Cối" */
  const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/đ/g, "d");
  const q = normalize(query.trim());
  const visible = guests.filter(
    (g) => (!sideFilter || g.side === sideFilter) && (!q || normalize(`${inviteeOf(g)} ${g.group} ${g.message}`).includes(q)),
  );
  const coming = guests.filter((g) => rsvpByGuest.get(g.id)?.attending);
  const declined = guests.filter((g) => rsvpByGuest.get(g.id) && !rsvpByGuest.get(g.id)!.attending);

  return (
    <div className="space-y-5">
      <Section
        title={editingId ? "Sửa lời mời" : "Tạo lời mời"}
        action={
          editingId && (
            <button type="button" onClick={resetForm} className={`${buttonClass} px-3 py-1.5 text-muted hover:bg-blush/40`}>
              <X className="size-4" /> Hủy sửa
            </button>
          )
        }
      >
        <div className="mb-5 space-y-2">
          <p className="text-xs font-medium text-muted">Chọn nhanh danh xưng (tự điền cách xưng hô cho hợp)</p>
          {GUEST_PRESETS.map((group) => (
            <div key={group.group} className="flex flex-wrap items-center gap-1.5">
              <span className="w-full text-[11px] tracking-wide text-muted/80 uppercase sm:w-36">{group.group}</span>
              {group.items.map((preset) => {
                const active = form.title === preset.title && form.hostPronoun === preset.hostPronoun;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      patch({ title: preset.title, hostPronoun: preset.hostPronoun });
                      setNamePlaceholder(preset.namePlaceholder);
                    }}
                    className={`cursor-pointer rounded-full border px-3 py-1 text-sm transition ${
                      active ? "border-wine bg-wine text-ivory" : "border-gold/30 bg-white text-ink/80 hover:bg-blush/50"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid content-start gap-4 sm:grid-cols-2">
            <TextInput label="Danh xưng" value={form.title} onChange={(title) => patch({ title })} placeholder="Anh, Chị, Cô Chú..." list="guest-titles" options={TITLE_SUGGESTIONS} />
            <TextInput label="Tên người / nhóm được mời *" value={form.name} onChange={(name) => patch({ name })} placeholder={namePlaceholder} />
            <TextInput label="Kèm theo" value={form.extra} onChange={(extra) => patch({ extra })} placeholder="và người thương" list="guest-extras" options={EXTRA_SUGGESTIONS} />
            <TextInput
              label="Cô dâu chú rể xưng là"
              value={form.hostPronoun}
              onChange={(hostPronoun) => patch({ hostPronoun })}
              placeholder="chúng tôi"
              list="guest-hosts"
              options={HOST_SUGGESTIONS}
            />
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted">Khách của</span>
              <select value={form.side} onChange={(e) => patch({ side: e.target.value as GuestInput["side"] })} className={`${inputClass} cursor-pointer`}>
                {SIDES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <TextInput label="Nhóm (chỉ admin thấy, để lọc)" value={form.group} onChange={(group) => patch({ group })} placeholder="Bạn đại học" list="guest-groups" options={groups} />
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-medium text-muted">Lời nhắn riêng (hiện trên thiệp)</span>
              <textarea
                rows={2}
                maxLength={300}
                value={form.message}
                onChange={(e) => patch({ message: e.target.value })}
                placeholder="Nhớ đến sớm uống với tụi mình vài ly nha!"
                className={inputClass}
              />
            </label>
            <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
              <button disabled={busy} className={`${buttonClass} bg-wine px-6 py-2.5 text-ivory hover:bg-rose`}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />} {editingId ? "Lưu thay đổi" : "Tạo link mời"}
              </button>
              {error && <p className="text-sm text-rose">{error}</p>}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-medium text-muted">Khách sẽ thấy ở đầu thiệp</p>
            <InvitePreview guest={form} />
          </div>
        </form>

        {created && (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
            <p className="text-sm font-medium text-emerald-800">Đã lưu lời mời cho {inviteeOf(created)}</p>
            <p className="mt-1 font-mono text-sm break-all text-ink">{guestUrl(origin, created.id)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <CopyButton primary text={guestUrl(origin, created.id)} label="Chép link" />
              <CopyButton text={inviteMessage(created, couple, guestUrl(origin, created.id))} label="Chép lời nhắn kèm link" icon={MessageSquareText} />
              <a href={guestUrl(origin, created.id)} target="_blank" rel="noreferrer" className={`${buttonClass} border border-gold/40 px-3 py-1.5 text-wine hover:bg-blush/40`}>
                <ExternalLink className="size-4" /> Mở thử
              </a>
            </div>
          </div>
        )}
      </Section>

      <Section title={`Danh sách khách mời (${guests.length})`}>
        <p className="mb-4 text-sm text-muted">
          {coming.length} sẽ đến ({coming.reduce((sum, g) => sum + (rsvpByGuest.get(g.id)?.guests ?? 0), 0)} người) · {declined.length} không đến ·{" "}
          {guests.length - coming.length - declined.length} chưa phản hồi
        </p>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <label className="relative min-w-0 flex-1 basis-56">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm theo tên, nhóm..." className={`${inputClass} pl-9`} />
          </label>
          {[{ value: "", label: "Tất cả" }, ...SIDES.slice(1)].map((s) => (
            <button
              key={s.value}
              type="button"
              aria-pressed={sideFilter === s.value}
              onClick={() => setSideFilter(s.value as typeof sideFilter)}
              className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm transition ${
                sideFilter === s.value ? "border-wine bg-wine text-ivory" : "border-gold/30 bg-white text-ink/80 hover:bg-blush/50"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {!guests.length ? (
          <p className="rounded-xl border border-dashed border-gold/30 p-6 text-center text-sm text-muted">Chưa có lời mời nào. Tạo lời mời đầu tiên ở trên nhé.</p>
        ) : !visible.length ? (
          <p className="p-6 text-center text-sm text-muted">Không có khách nào khớp.</p>
        ) : (
          <ul className="divide-y divide-gold/10">
            {visible.map((g) => {
              const url = guestUrl(origin, g.id);
              const status = statusOf(rsvpByGuest.get(g.id));
              const iconButton = "cursor-pointer rounded-full p-2 text-muted transition hover:bg-blush/60 hover:text-wine";
              return (
                <li key={g.id} className={`flex flex-wrap items-center gap-x-4 gap-y-2 py-3 ${editingId === g.id ? "bg-blush/30" : ""}`}>
                  <div className="min-w-0 flex-1 basis-60">
                    <p className="font-medium text-ink">{inviteeOf(g)}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                      <span className={`rounded-full px-2 py-0.5 font-medium ${status.className}`}>{status.label}</span>
                      {g.side && <span>{SIDE_LABEL[g.side]}</span>}
                      {g.group && <span>· {g.group}</span>}
                      <span>· xưng “{hostsOf(g)}”</span>
                      <span className="font-mono">· {g.id}</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <CopyButton text={url} label="Link" />
                    <CopyButton text={inviteMessage(g, couple, url)} label="Lời nhắn" icon={MessageSquareText} />
                    <a href={url} target="_blank" rel="noreferrer" aria-label="Mở thiệp của khách này" className={iconButton}>
                      <ExternalLink className="size-4" />
                    </a>
                    <button type="button" onClick={() => edit(g)} aria-label="Sửa" className={iconButton}>
                      <Pencil className="size-4" />
                    </button>
                    <button type="button" onClick={() => remove(g)} aria-label="Xóa" className={iconButton}>
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </div>
  );
}
