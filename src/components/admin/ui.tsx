"use client";

import { useCallback } from "react";
import { App, Card, Input } from "antd";

/** Khung một phần trong trang admin */
export function Section({ title, children, extra }: { title: React.ReactNode; children: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <Card title={<span className="font-serif text-2xl font-semibold text-wine">{title}</span>} extra={extra}>
      {children}
    </Card>
  );
}

/** Bỏ dấu để gõ "quang coi" vẫn tìm ra "Quang Cối" */
export const normalize = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/đ/g, "d");

export const vnTime = (iso: string) => new Date(iso).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

/** Phân trang chung cho các bảng admin */
export const tablePagination = {
  defaultPageSize: 10,
  showSizeChanger: true,
  pageSizeOptions: [10, 20, 50, 100],
  showTotal: (total: number, [from, to]: [number, number]) => `${from}–${to} / ${total}`,
};

/**
 * Sao chép vào clipboard, báo kết quả bằng message của antd.
 * Trình duyệt chặn clipboard (không phải https) thì mở hộp thoại để admin tự chép.
 */
export function useCopy() {
  const { message, modal } = App.useApp();
  return useCallback(
    async (text: string, done = "Đã sao chép") => {
      try {
        await navigator.clipboard.writeText(text);
        message.success(done);
        return true;
      } catch {
        modal.info({
          title: "Sao chép nội dung dưới đây",
          width: 560,
          content: <Input.TextArea value={text} readOnly autoSize={{ minRows: 2, maxRows: 12 }} onFocus={(e) => e.target.select()} />,
        });
        return false;
      }
    },
    [message, modal],
  );
}

/** Gọi API admin dạng JSON; 401 thì quay về màn hình đăng nhập, lỗi khác ném Error kèm thông báo của server */
export async function callApi<T>(url: string, method: string, body: unknown, onUnauthorized: () => void): Promise<T | null> {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (res.status === 401) {
    onUnauthorized();
    return null;
  }
  const result = await res.json().catch(() => null);
  if (!res.ok) throw new Error(result?.error ?? "Có lỗi xảy ra");
  return result as T;
}

export const errorText = (error: unknown, fallback = "Có lỗi xảy ra") =>
  error instanceof Error && error.message !== "Failed to fetch" ? error.message : fallback;
