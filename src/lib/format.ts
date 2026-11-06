const TZ = "Asia/Ho_Chi_Minh";

export const initialOf = (name: string) => name.trim().split(/\s+/).pop()?.[0]?.toUpperCase() ?? "";

const pad = (n: number) => String(n).padStart(2, "0");

/** Lấy các thành phần ngày giờ theo múi giờ Việt Nam (ổn định giữa server & client) */
export function dateParts(iso: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hour12: false,
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return {
    day: Number(get("day")),
    month: Number(get("month")),
    year: Number(get("year")),
    hour: get("hour"),
    minute: get("minute"),
    weekday: weekdays.indexOf(get("weekday")),
  };
}

const WEEKDAYS_VI = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

export function formatDate(iso: string, style: "dots" | "long" = "long") {
  const d = dateParts(iso);
  if (style === "dots") return `${pad(d.day)} . ${pad(d.month)} . ${d.year}`;
  return `${WEEKDAYS_VI[d.weekday]}, ngày ${pad(d.day)} tháng ${pad(d.month)} năm ${d.year}`;
}

export const formatTime = (iso: string) => {
  const d = dateParts(iso);
  return `${d.hour}:${d.minute}`;
};

export const weekdayName = (iso: string) => WEEKDAYS_VI[dateParts(iso).weekday];

/** Định dạng YYYYMMDDTHHMMSSZ cho Google Calendar */
const toGCal = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

export function googleCalendarUrl(opts: { title: string; start: string; end: string; location: string; details?: string }) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: opts.title,
    dates: `${toGCal(opts.start)}/${toGCal(opts.end)}`,
    location: opts.location,
    details: opts.details ?? "",
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

export const mapsUrl = (query: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

export const mapsEmbedUrl = (query: string) =>
  `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
