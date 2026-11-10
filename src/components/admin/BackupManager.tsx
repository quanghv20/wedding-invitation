"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, FileUp, Loader2, Mail, RotateCcw, XCircle } from "lucide-react";
import { Section, buttonClass } from "./ui";

type Run = { at: string; ok: boolean; reason: string; file?: string; bytes?: number; error?: string };
type Status = { recipient: string; scheduled: boolean; nextAt: string | null; runs: Run[] };
type Summary = {
  createdAt: string;
  tables: { name: string; rows: number }[];
  wedding: { hasContent: boolean; hasAdmin: boolean; guests: number; rsvp: number; wishes: number } | null;
};
type RestoreResult = { restored: { name: string; rows: number }[]; skipped: string[]; safetyBackup: string | null; safetyError: string | null };

const vnTime = (iso: string) => new Date(iso).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
const kb = (bytes?: number) => (bytes ? `${(bytes / 1024).toFixed(1)} KB` : "");

function Notice({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  const Icon = ok ? CheckCircle2 : XCircle;
  return (
    <div className={`flex gap-2 rounded-xl p-3 text-sm ${ok ? "bg-emerald-50 text-emerald-800" : "bg-rose/10 text-rose"}`}>
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function BackupManager({ onUnauthorized, onRestored }: { onUnauthorized: () => void; onRestored: () => void }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: boolean; text: string } | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [checking, setChecking] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState("");
  const [restored, setRestored] = useState<RestoreResult | null>(null);

  const loadStatus = useCallback(async () => {
    const res = await fetch("/api/admin/backup", { cache: "no-store" }).catch(() => null);
    if (res?.status === 401) return onUnauthorized();
    if (res?.ok) setStatus(await res.json());
  }, [onUnauthorized]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const sendNow = async () => {
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch("/api/admin/backup", { method: "POST" });
      if (res.status === 401) return onUnauthorized();
      const body = await res.json().catch(() => null);
      if (body?.status) setStatus(body.status);
      setSendResult(res.ok ? { ok: true, text: `Đã gửi ${body.filename} tới ${status?.recipient}` } : { ok: false, text: body?.error ?? "Không gửi được" });
    } catch {
      setSendResult({ ok: false, text: "Không kết nối được tới server" });
    } finally {
      setSending(false);
    }
  };

  const upload = (picked: File, confirm: boolean) => {
    const form = new FormData();
    form.append("file", picked);
    if (confirm) form.append("confirm", "1");
    return fetch("/api/admin/backup", { method: "PUT", body: form });
  };

  const pick = async (picked: File | undefined) => {
    setFile(picked ?? null);
    setSummary(null);
    setRestoreError("");
    setRestored(null);
    if (!picked) return;
    setChecking(true);
    try {
      const res = await upload(picked, false);
      if (res.status === 401) return onUnauthorized();
      const body = await res.json().catch(() => null);
      if (!res.ok) setRestoreError(body?.error ?? "Không đọc được file");
      else setSummary(body.summary);
    } catch {
      setRestoreError("Không kết nối được tới server");
    } finally {
      setChecking(false);
    }
  };

  const restore = async () => {
    if (!file || !summary) return;
    if (!window.confirm(`Thay TOÀN BỘ dữ liệu hiện tại bằng bản backup lúc ${vnTime(summary.createdAt)}? Bản hiện tại sẽ được gửi qua mail trước.`)) return;
    setRestoring(true);
    setRestoreError("");
    try {
      const res = await upload(file, true);
      if (res.status === 401) return onUnauthorized();
      const body = await res.json().catch(() => null);
      if (!res.ok) return setRestoreError(body?.error ?? "Khôi phục thất bại");
      setRestored(body);
      setSummary(null);
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      loadStatus();
      onRestored();
    } catch {
      setRestoreError("Không kết nối được tới server");
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-5">
      <Section title="Sao lưu tự động">
        {status && (
          <div className="mb-4 space-y-1 text-sm text-ink/80">
            {status.recipient ? (
              <p>
                Mỗi giờ (lúc phút 00) server tạo một bản <b>backup full database</b> và gửi tới <b>{status.recipient}</b>.
              </p>
            ) : (
              <p className="text-rose">Chưa đặt BACKUP_EMAIL_TO trong .env nên backup tự động đang tắt.</p>
            )}
            <p className="text-muted">
              {status.scheduled && status.nextAt
                ? `Lần chạy tiếp theo: ${vnTime(status.nextAt)}`
                : "Lịch tự động chỉ chạy trên server production (Docker), không chạy khi dev trên máy."}
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <a href="/api/admin/backup?download=1" className={`${buttonClass} bg-wine px-5 py-2.5 text-ivory hover:bg-rose`}>
            <Download className="size-4" /> Tải file backup ngay
          </a>
          <button type="button" onClick={sendNow} disabled={sending || !status?.recipient} className={`${buttonClass} border border-gold/40 px-5 py-2.5 text-wine hover:bg-blush/40`}>
            {sending ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />} Gửi backup qua mail ngay
          </button>
        </div>
        {sendResult && (
          <div className="mt-3">
            <Notice ok={sendResult.ok}>{sendResult.text}</Notice>
          </div>
        )}

        {!!status?.runs.length && (
          <div className="mt-5">
            <p className="mb-2 text-xs font-medium text-muted">Các lần gần đây (từ lúc server khởi động)</p>
            <ul className="divide-y divide-gold/10 text-sm">
              {status.runs.map((run) => (
                <li key={run.at + run.reason} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                  {run.ok ? <CheckCircle2 className="size-4 text-emerald-600" /> : <XCircle className="size-4 text-rose" />}
                  <span className="text-muted">{vnTime(run.at)}</span>
                  <span>{run.reason}</span>
                  {run.ok ? <span className="text-muted">{kb(run.bytes)}</span> : <span className="text-rose">{run.error}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Section>

      <Section title="Khôi phục từ file backup">
        <p className="mb-4 text-sm text-muted">
          Chọn file <code>.json.gz</code> nhận qua mail. Trang sẽ đọc file và cho xem trước, chưa ghi gì cho tới khi bạn bấm khôi phục.
        </p>

        <label className={`${buttonClass} border border-gold/40 px-5 py-2.5 text-wine hover:bg-blush/40 ${checking ? "pointer-events-none opacity-60" : ""}`}>
          {checking ? <Loader2 className="size-4 animate-spin" /> : <FileUp className="size-4" />} {file ? file.name : "Chọn file backup"}
          <input ref={fileRef} type="file" accept=".gz,.json,application/gzip,application/json" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
        </label>

        {summary && (
          <div className="mt-4 space-y-3 rounded-xl border border-gold/20 bg-ivory/60 p-4 text-sm">
            <p className="font-medium text-ink">Bản backup lúc {vnTime(summary.createdAt)}</p>
            {summary.wedding && (
              <p className="text-ink/80">
                {summary.wedding.guests} lời mời · {summary.wedding.rsvp} xác nhận tham dự · {summary.wedding.wishes} lời chúc · nội dung thiệp:{" "}
                {summary.wedding.hasContent ? "có" : "không"} · tài khoản admin: {summary.wedding.hasAdmin ? "có" : "không"}
              </p>
            )}
            <p className="text-muted">{summary.tables.map((t) => `${t.name} (${t.rows} dòng)`).join(", ")}</p>
            <div className="flex gap-2 rounded-lg bg-amber-50 p-3 text-amber-800">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <p>
                Dữ liệu hiện tại của các bảng trên sẽ bị thay bằng dữ liệu trong file (bản hiện tại được gửi qua mail trước). Nếu file có mật khẩu admin khác,
                bạn sẽ phải đăng nhập lại bằng mật khẩu cũ đó.
              </p>
            </div>
            <button type="button" onClick={restore} disabled={restoring} className={`${buttonClass} bg-wine px-5 py-2.5 text-ivory hover:bg-rose`}>
              {restoring ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />} Khôi phục dữ liệu từ file này
            </button>
          </div>
        )}

        {restoreError && (
          <div className="mt-4">
            <Notice ok={false}>{restoreError}</Notice>
          </div>
        )}
        {restored && (
          <div className="mt-4">
            <Notice ok>
              <p>Đã khôi phục: {restored.restored.map((t) => `${t.name} (${t.rows} dòng)`).join(", ")}.</p>
              {!!restored.skipped.length && <p>Bỏ qua vì database không có bảng: {restored.skipped.join(", ")}.</p>}
              {restored.safetyBackup ? (
                <p>Bản trước khi khôi phục đã gửi qua mail: {restored.safetyBackup}.</p>
              ) : (
                <p className="text-rose">Không gửi được bản trước khi khôi phục: {restored.safetyError}</p>
              )}
            </Notice>
          </div>
        )}
      </Section>
    </div>
  );
}
