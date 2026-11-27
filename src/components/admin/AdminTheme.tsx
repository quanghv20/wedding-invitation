"use client";

import { App, ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";
import dayjs from "dayjs";
import "dayjs/locale/vi";

dayjs.locale("vi");

/**
 * Theme antd cho trang admin, cùng tông màu với thiệp (đỏ rượu + vàng gold).
 * Chỉ bọc trang admin, khung xem trước thiệp (/admin/preview) không dùng nên không bị ảnh hưởng.
 */
export function AdminTheme({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        token: {
          colorPrimary: "#6e2838",
          colorLink: "#6e2838",
          colorText: "#3a2e29",
          colorTextSecondary: "#7d6c62",
          colorBorderSecondary: "#efe4d3",
          colorBgLayout: "#fdf9f3",
          fontFamily: "var(--font-be-vietnam), system-ui, sans-serif",
          borderRadius: 8,
        },
        components: {
          Card: { headerFontSize: 18 },
          Table: { headerBg: "#faf3e9", rowSelectedBg: "#f9ecea", rowSelectedHoverBg: "#f4dfda" },
          Menu: { itemSelectedColor: "#6e2838", horizontalItemSelectedColor: "#6e2838" },
        },
      }}
    >
      <App>{children}</App>
    </ConfigProvider>
  );
}
