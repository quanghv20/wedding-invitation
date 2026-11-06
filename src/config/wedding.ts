/**
 * TOÀN BỘ NỘI DUNG THIỆP NẰM Ở FILE NÀY.
 * Chỉ cần sửa thông tin bên dưới là thiệp tự cập nhật.
 * Ảnh: thay link Unsplash bằng ảnh của bạn (đặt vào /public/images rồi dùng "/images/ten-anh.jpg").
 */

const unsplash = (id: string, w = 1600) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

const ADDRESS = "139 Lai Cách, Đa Phúc, Hà Nội";

export const wedding = {
  groom: {
    name: "Vương Trường",
    fullName: "Vương Trường",
    role: "Chú rể",
    birthday: "31/12/2000",
    bio: "Chàng trai chân thành, ấm áp, luôn biết cách khiến người bên cạnh mỉm cười.",
    photo: unsplash("1537633552985-df8429e8048b", 900),
    // TODO: thay bằng tên bố mẹ chú rể
    parents: { father: "Ông Vương Văn ...", mother: "Bà ..." },
  },
  bride: {
    name: "Xuân Hải",
    fullName: "Xuân Hải",
    role: "Cô dâu",
    birthday: "11/06/2000",
    bio: "Cô gái dịu dàng, yêu hoa cỏ và những điều giản dị — mảnh ghép hoàn hảo của anh.",
    photo: unsplash("1494955870715-979ca4f13bf0", 900),
    // TODO: thay bằng tên bố mẹ cô dâu
    parents: { father: "Ông ...", mother: "Bà ..." },
  },

  /** Thời điểm chính (dùng cho đồng hồ đếm ngược) — giờ Việt Nam */
  date: "2026-12-06T09:00:00+07:00",
  /** Ngày hiển thị ở footer */
  displayDate: "05 & 06 . 12 . 2026",
  lunarDate: "Tức ngày 27 & 28 tháng 10 năm Bính Ngọ",
  rsvpDeadline: "30/11/2026",
  quote: "Yêu nhau không phải là nhìn nhau, mà là cùng nhìn về một hướng.",
  quoteAuthor: "Antoine de Saint-Exupéry",

  hero: {
    image: "/images/anh-chinh.jpg",
  },

  /** `main: true` là sự kiện được hiển thị nổi bật trên trang Home */
  // TODO: chỉnh lại giờ từng sự kiện cho đúng
  events: [
    {
      title: "Tiệc Chung Vui",
      side: "Ngày thứ nhất",
      start: "2026-12-05T17:00:00+07:00",
      end: "2026-12-05T21:00:00+07:00",
      venue: "Tư gia",
      address: ADDRESS,
      image: unsplash("1464366400600-7168b8af9bc3", 1000),
      main: false,
    },
    {
      title: "Lễ Thành Hôn",
      side: "Ngày thứ hai",
      start: "2026-12-06T09:00:00+07:00",
      end: "2026-12-06T10:30:00+07:00",
      venue: "Tư gia",
      address: ADDRESS,
      image: unsplash("1606800052052-a08af7148866", 1000),
      main: false,
    },
    {
      title: "Tiệc Cưới",
      side: "Ngày thứ hai",
      start: "2026-12-06T11:00:00+07:00",
      end: "2026-12-06T14:00:00+07:00",
      venue: "Tư gia",
      address: ADDRESS,
      image: unsplash("1469371670807-013ccf25f16a", 1000),
      main: true,
    },
  ],

  /** Bản đồ hiển thị dưới phần sự kiện */
  mapQuery: "139 Lai Cách, Đa Phúc, Hà Nội",

  story: [
    {
      date: "Ngày đầu tiên",
      title: "Lần đầu gặp gỡ",
      text: "Một cái nhìn, một nụ cười — và hai con người xa lạ bắt đầu viết chung một câu chuyện.",
      image: unsplash("1522673607200-164d1b6ce486", 900),
    },
    {
      date: "Những ngày bên nhau",
      title: "Thương nhau",
      text: "Cùng nhau đi qua những ngày nắng và cả những ngày mưa, để hiểu rằng có nhau là đủ.",
      image: unsplash("1529636798458-92182e662485", 900),
    },
    {
      date: "Lời hứa",
      title: "Lời cầu hôn",
      text: "Anh ngỏ lời, em gật đầu — và mình quyết định về chung một nhà.",
      image: unsplash("1525258946800-98cfd641d0de", 900),
    },
  ],

  gallery: [
    "/images/anh-chinh.jpg",
    unsplash("1511285560929-80b456fea0bc", 1200),
    unsplash("1537633552985-df8429e8048b", 1200),
    unsplash("1583939003579-730e3918a45a", 1200),
    unsplash("1460978812857-470ed1c77af0", 1200),
    unsplash("1465495976277-4387d4b0b4c6", 1200),
    unsplash("1520854221256-17451cc331bf", 1200),
    unsplash("1544078751-58fee2d8a03b", 1200),
    unsplash("1515934751635-c81c6bc9a2d8", 1200),
  ],

  /** Mã ngân hàng theo chuẩn VietQR (VCB, TCB, MB, ACB, BIDV, ...). TODO: sửa STK thật */
  gifts: [
    {
      label: "Mừng cưới chú rể",
      bankId: "VCB",
      bankName: "Vietcombank",
      accountNo: "0123456789",
      accountName: "VUONG TRUONG",
    },
    {
      label: "Mừng cưới cô dâu",
      bankId: "TCB",
      bankName: "Techcombank",
      accountNo: "1903456789012",
      accountName: "XUAN HAI",
    },
  ],

  /** Nhạc nền: đặt file vào /public/music/ rồi sửa đường dẫn */
  music: "/music/wedding.mp3",

  footerImage: unsplash("1532712938310-34cb3982ef74", 2000),
};

export type WeddingEvent = (typeof wedding.events)[number];

export const mainEvent = wedding.events.find((e) => e.main) ?? wedding.events[0];
