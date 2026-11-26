/**
 * NỘI DUNG MẶC ĐỊNH CỦA THIỆP.
 * Nội dung thật nằm trong database và được sửa ở trang /admin. Nội dung ở đây được dùng khi
 * không có DATABASE_URL, khi database lỗi, và thay cho từng phần dữ liệu hỏng trong database,
 * nên phải luôn là nội dung thật, đầy đủ (giữ khớp với bản trong database).
 * Ảnh: mọi ảnh nằm trong /public/albums và được chọn ở trang admin.
 */

const album = (name: string) => `/albums/${name}.jpg`;

/** Album mặc định: 12 ảnh xen kẽ rừng / vườn / studio (ở admin có nút gợi ý ngẫu nhiên bộ khác) */
const GALLERY = [
  "VYK04206", "VYK04324", "VYK03839", "VYK04465", "VYK04730", "VYK04819",
  "VYK04397", "VYK04479", "VYK04927", "VYK04443", "VYK04969", "VYK04419",
];

export const wedding = {
  groom: {
    name: "Vương Trường",
    fullName: "Vương Văn Trường",
    role: "Chú rể",
    birthday: "29/12/2000",
    bio: "Chàng trai chân thành, ấm áp, luôn biết cách khiến người bên cạnh mỉm cười.",
    photo: album("VYK04892"),
    parents: { father: "Ông Vương Tất Võ", mother: "Bà Nguyễn Thị Trinh" },
  },
  bride: {
    name: "Nguyễn Mai",
    fullName: "Nguyễn Thị Mai",
    role: "Cô dâu",
    birthday: "06/11/2000",
    bio: "Cô gái dịu dàng, yêu hoa cỏ và những điều giản dị — mảnh ghép hoàn hảo của anh.",
    photo: album("VYK04730"),
    parents: { father: "Ông Nguyễn Văn Đô", mother: "Bà Nguyễn Thị Mùi" },
  },

  /** Thời điểm chính (dùng cho đồng hồ đếm ngược) — giờ Việt Nam */
  date: "2026-12-06T11:00:00+07:00",
  /** Ngày hiển thị ở footer */
  displayDate: "05 & 06 . 12 . 2026",
  lunarDate: "Tức ngày 27 & 28 tháng 10 năm Bính Ngọ",
  rsvpDeadline: "30/11/2026",
  quote: "Yêu nhau không phải là nhìn nhau, mà là cùng nhìn về một hướng.",
  quoteAuthor: "Antoine de Saint-Exupéry",

  hero: {
    image: album("VYK04563-"),
  },

  /** `main: true` là sự kiện được hiển thị nổi bật trên trang Home */
  events: [
    {
      title: "Tiệc Chung Vui",
      side: "Ngày thứ nhất",
      start: "2026-12-05T17:00:00+07:00",
      end: "2026-12-05T21:00:00+07:00",
      image: album("VYK04805"),
      main: false,
    },
    {
      title: "Tiệc Cưới",
      side: "Ngày thứ hai",
      start: "2026-12-06T10:00:00+07:00",
      end: "2026-12-06T11:00:00+07:00",
      image: album("VYK04347"),
      main: false,
    },
    {
      title: "Lễ Thành Hôn",
      side: "Ngày thứ hai",
      start: "2026-12-06T11:00:00+07:00",
      end: "2026-12-06T12:00:00+07:00",
      image: album("VYK04819"),
      main: true,
    },
  ],

  /**
   * Địa điểm của từng bên: các sự kiện dùng chung giờ, chỉ địa chỉ khác nhau.
   * Thiệp hiện địa chỉ theo ?side=groom / ?side=bride trên link, hoặc theo bên của khách
   * trong link mời riêng; không xác định được bên thì hiện cả hai.
   */
  places: {
    groom: { venue: "Nhà Văn Hóa", address: "Thôn Lai Cách, Đa Phúc, Hà Nội" },
    bride: { venue: "Tư gia nhà gái", address: "Số 12 Thôn Tân Lập, Sóc Sơn, Hà Nội" },
  },

  story: [
    {
      date: "Ngày đầu tiên",
      title: "Lần đầu gặp gỡ",
      text: "Một cái nhìn, một nụ cười — và hai con người xa lạ bắt đầu viết chung một câu chuyện.",
      image: album("VYK04397"),
    },
    {
      date: "Những ngày bên nhau",
      title: "Thương nhau",
      text: "Cùng nhau đi qua những ngày nắng và cả những ngày mưa, để hiểu rằng có nhau là đủ.",
      image: album("VYK03839"),
    },
    {
      date: "Lời hứa",
      title: "Lời cầu hôn",
      text: "Anh ngỏ lời, em gật đầu — và mình quyết định về chung một nhà.",
      image: album("VYK04007"),
    },
  ],

  /** Ảnh được hiển thị trong Album, theo thứ tự */
  // ảnh thứ 4 cũng là nền phần Xác nhận tham dự
  gallery: GALLERY.map(album),
  /** Thứ tự toàn bộ ảnh trong album ở trang admin (gồm cả ảnh đang ẩn); ảnh chưa có ở đây xếp cuối */
  galleryOrder: GALLERY.map(album),

  /** Mã ngân hàng theo chuẩn VietQR (VCB, TCB, MB, ACB, BIDV, PGB...) */
  gifts: [
    {
      label: "Mừng cưới chú rể",
      bankId: "PGB",
      bankName: "PGBank",
      accountNo: "8787878787877",
      accountName: "VƯƠNG VĂN TRƯỜNG",
    },
    {
      label: "Mừng cưới cô dâu",
      bankId: "TCB",
      bankName: "Techcombank",
      accountNo: "19036630783017",
      accountName: "NGUYỄN THỊ MAI",
    },
  ],

  /** Nhạc nền: đặt file vào /public/music/ rồi sửa đường dẫn */
  music: "/music/wedding.mp3",

  footerImage: album("VYK04419"),
};

export type WeddingContent = typeof wedding;
export type WeddingEvent = WeddingContent["events"][number];

export type Side = keyof WeddingContent["places"];
export type Place = WeddingContent["places"][Side] & { side: Side; label: string };

export const SIDE_LABEL: Record<Side, string> = { groom: "Nhà trai", bride: "Nhà gái" };

/** Địa điểm cần hiện: một bên nếu biết khách thuộc bên nào, không thì cả hai */
export const placesFor = (content: WeddingContent, side: Side | null): Place[] =>
  (side ? [side] : (["groom", "bride"] as Side[])).map((s) => ({ ...content.places[s], side: s, label: SIDE_LABEL[s] }));

/** "Tư gia nhà trai, 139 Lai Cách..." — dùng cho lịch và chỉ đường */
export const placeText = (place: Pick<Place, "venue" | "address">) => `${place.venue}, ${place.address}`;

/** Địa điểm ghi vào lịch / mô tả: một bên thì ghi thẳng, cả hai thì kèm nhãn từng bên */
export const locationText = (places: Place[]) =>
  places.length === 1 ? placeText(places[0]) : places.map((p) => `${p.label}: ${placeText(p)}`).join(" | ");

export const mainEventOf = (content: WeddingContent) => content.events.find((e) => e.main) ?? content.events[0];
