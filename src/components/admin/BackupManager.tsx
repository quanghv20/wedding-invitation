"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, App, Button, Descriptions, Flex, Space, Timeline, Typography, Upload } from "antd";
import { CloudDownloadOutlined, MailOutlined, RollbackOutlined, UploadOutlined } from "@ant-design/icons";
import { Section, vnTime } from "./ui";

type Run = { at: string; ok: boolean; reason: string; file?: string; bytes?: number; error?: string };
type Status = { recipient: string; scheduled: boolean; nextAt: string | null; runs: Run[] };
type Summary = {
  createdAt: string;
  tables: { name: string; rows: number }[];
  wedding: { hasContent: boolean; hasAdmin: boolean; guests: number; rsvp: number; wishes: number } | null;
};
type RestoreResult = { restored: { name: string; rows: number }[]; skipped: string[]; safetyBackup: string | null; safetyError: string | null };

const kb = (bytes?: number) => (bytes ? `${(bytes / 1024).toFixed(1)} KB` : "");
const tableList = (tables: { name: string; rows: number }[]) => tables.map((t) => `${t.name} (${t.rows} dòng)`).join(", ");

export function BackupManager({ onUnauthorized, onRestored }: { onUnauthorized: () => void; onRestored: () => void }) {
  const { modal } = App.useApp();
  const [status, setStatus] = useState<Status | null>(null);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: boolean; text: string } | null>(null);

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

  const pick = async (picked: File) => {
    setFile(picked);
    setSummary(null);
    setRestoreError("");
    setRestored(null);
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
    if (!file) return;
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
      loadStatus();
      onRestored();
    } catch {
      setRestoreError("Không kết nối được tới server");
    } finally {
      setRestoring(false);
    }
  };

  const confirmRestore = () => {
    if (!summary) return;
    modal.confirm({
      title: "Khôi phục toàn bộ dữ liệu?",
      content: `Thay TOÀN BỘ dữ liệu hiện tại bằng bản backup lúc ${vnTime(summary.createdAt)}. Bản hiện tại sẽ được gửi qua mail trước.`,
      okText: "Khôi phục",
      okButtonProps: { danger: true },
      cancelText: "Không",
      onOk: restore,
    });
  };

  return (
    <Space orientation="vertical" size="large" style={{ width: "100%" }}>
      <Section title="Sao lưu tự động">
        <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
          {status &&
            (status.recipient ? (
              <Typography.Paragraph style={{ marginBottom: 0 }}>
                Mỗi giờ (lúc phút 00) server tạo một bản <b>backup full database</b> và gửi tới <b>{status.recipient}</b>.
                <br />
                <Typography.Text type="secondary">
                  {status.scheduled && status.nextAt
                    ? `Lần chạy tiếp theo: ${vnTime(status.nextAt)}`
                    : "Lịch tự động chỉ chạy trên server production (Docker), không chạy khi dev trên máy."}
                </Typography.Text>
              </Typography.Paragraph>
            ) : (
              <Alert type="warning" showIcon title="Chưa đặt BACKUP_EMAIL_TO trong .env nên backup tự động đang tắt." />
            ))}

          <Flex wrap gap={8}>
            <Button type="primary" icon={<CloudDownloadOutlined />} href="/api/admin/backup?download=1">
              Tải file backup ngay
            </Button>
            <Button icon={<MailOutlined />} loading={sending} disabled={!status?.recipient} onClick={sendNow}>
              Gửi backup qua mail ngay
            </Button>
          </Flex>
          {sendResult && <Alert type={sendResult.ok ? "success" : "error"} showIcon title={sendResult.text} />}

          {!!status?.runs.length && (
            <div>
              <Typography.Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
                Các lần gần đây (từ lúc server khởi động)
              </Typography.Text>
              <Timeline
                items={status.runs.map((run) => ({
                  key: run.at + run.reason,
                  color: run.ok ? "green" : "red",
                  content: (
                    <Space wrap size={8}>
                      <Typography.Text type="secondary">{vnTime(run.at)}</Typography.Text>
                      <span>{run.reason}</span>
                      {run.ok ? <Typography.Text type="secondary">{kb(run.bytes)}</Typography.Text> : <Typography.Text type="danger">{run.error}</Typography.Text>}
                    </Space>
                  ),
                }))}
              />
            </div>
          )}
        </Space>
      </Section>

      <Section title="Khôi phục từ file backup">
        <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
          <Typography.Text type="secondary">
            Chọn file <Typography.Text code>.json.gz</Typography.Text> nhận qua mail. Trang sẽ đọc file và cho xem trước, chưa ghi gì cho tới khi bạn bấm
            khôi phục.
          </Typography.Text>

          <Upload
            accept=".gz,.json,application/gzip,application/json"
            showUploadList={false}
            maxCount={1}
            beforeUpload={(picked) => {
              pick(picked);
              return false;
            }}
          >
            <Button icon={<UploadOutlined />} loading={checking}>
              {file ? file.name : "Chọn file backup"}
            </Button>
          </Upload>

          {summary && (
            <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
              <Descriptions
                bordered
                size="small"
                column={1}
                title={`Bản backup lúc ${vnTime(summary.createdAt)}`}
                items={[
                  ...(summary.wedding
                    ? [
                        { key: "guests", label: "Lời mời", children: summary.wedding.guests },
                        { key: "rsvp", label: "Xác nhận tham dự", children: summary.wedding.rsvp },
                        { key: "wishes", label: "Lời chúc", children: summary.wedding.wishes },
                        { key: "content", label: "Nội dung thiệp", children: summary.wedding.hasContent ? "Có" : "Không" },
                        { key: "admin", label: "Tài khoản admin", children: summary.wedding.hasAdmin ? "Có" : "Không" },
                      ]
                    : []),
                  { key: "tables", label: "Các bảng", children: tableList(summary.tables) },
                ]}
              />
              <Alert
                type="warning"
                showIcon
                title="Dữ liệu hiện tại của các bảng trên sẽ bị thay bằng dữ liệu trong file (bản hiện tại được gửi qua mail trước). Nếu file có mật khẩu admin khác, bạn sẽ phải đăng nhập lại bằng mật khẩu cũ đó."
              />
              <Button type="primary" danger icon={<RollbackOutlined />} loading={restoring} onClick={confirmRestore}>
                Khôi phục dữ liệu từ file này
              </Button>
            </Space>
          )}

          {restoreError && <Alert type="error" showIcon title={restoreError} />}
          {restored && (
            <Alert
              type="success"
              showIcon
              title={`Đã khôi phục: ${tableList(restored.restored)}.`}
              description={
                <>
                  {!!restored.skipped.length && <div>Bỏ qua vì database không có bảng: {restored.skipped.join(", ")}.</div>}
                  {restored.safetyBackup ? (
                    <div>Bản trước khi khôi phục đã gửi qua mail: {restored.safetyBackup}.</div>
                  ) : (
                    <Typography.Text type="danger">Không gửi được bản trước khi khôi phục: {restored.safetyError}</Typography.Text>
                  )}
                </>
              }
            />
          )}
        </Space>
      </Section>
    </Space>
  );
}
