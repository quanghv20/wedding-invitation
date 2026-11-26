/**
 * Lời mời riêng cho từng khách: link /?to=<id> hiện đúng danh xưng và tên người được mời.
 * File này dùng được cả ở server lẫn trình duyệt (không truy cập database).
 */
export type Guest = {
  id: string;
  /** Danh xưng: Anh, Chị, Cô Chú, Gia đình, Tập thể... */
  title: string;
  /** Tên người / nhóm được mời: Quang Cối, anh Tuấn, lớp 12A1... */
  name: string;
  /** Phần kèm theo: và người thương, cùng gia đình... */
  extra: string;
  /** Cô dâu chú rể tự xưng với khách này: em, cháu, tụi mình, chúng tôi... */
  hostPronoun: string;
  side: "" | "groom" | "bride";
  /** Nhóm để lọc trong trang admin: Bạn đại học, Họ nội... */
  group: string;
  /** Lời nhắn riêng hiện trên thiệp */
  message: string;
  createdAt: string;
};

export type GuestInput = Omit<Guest, "id" | "createdAt">;

export const DEFAULT_INVITEE = "Quý khách";
export const DEFAULT_HOSTS = "chúng tôi";

/** Dòng người được mời: "Anh Quang Cối và người thương" */
export const inviteeOf = (g: Pick<Guest, "title" | "name" | "extra"> | null | undefined) =>
  (g && [g.title, g.name, g.extra].map((s) => s.trim()).filter(Boolean).join(" ")) || DEFAULT_INVITEE;

export const hostsOf = (g: Pick<Guest, "hostPronoun"> | null | undefined) => g?.hostPronoun.trim() || DEFAULT_HOSTS;

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Lời nhắn kèm link để dán vào Zalo / Messenger */
export function inviteMessage(g: Guest, couple: string, url: string) {
  return [
    `${capitalize(hostsOf(g))} trân trọng kính mời ${inviteeOf(g)} tới dự lễ thành hôn của ${couple}.`,
    g.message.trim(),
    `Thiệp mời: ${url}`,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Link mời riêng: /?to=<id>, kèm &side=groom|bride khi khách thuộc nhà trai / nhà gái
 * để thiệp hiện đúng địa chỉ bên đó; "Không ghi" thì không có side (thiệp hiện cả hai bên).
 */
export const guestUrl = (origin: string, guest: Pick<Guest, "id" | "side">) =>
  `${origin}/?to=${guest.id}${guest.side ? `&side=${guest.side}` : ""}`;

/** Id ngắn, bỏ các ký tự dễ nhầm (0/o, 1/l/i) để đọc qua điện thoại cũng không sai */
export const GUEST_ID_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
export const isGuestId = (value: unknown): value is string => typeof value === "string" && /^[a-z0-9]{4,16}$/.test(value);

export type GuestPreset = { label: string; title: string; hostPronoun: string; namePlaceholder: string };

/** Mẫu bấm nhanh: chọn danh xưng thì tự điền cách xưng hô cho hợp */
export const GUEST_PRESETS: { group: string; items: GuestPreset[] }[] = [
  {
    group: "Bạn bè",
    items: [
      { label: "Bạn", title: "Bạn", hostPronoun: "tụi mình", namePlaceholder: "Tên người bạn" },
      { label: "Cặp đôi bạn", title: "Vợ chồng bạn", hostPronoun: "tụi mình", namePlaceholder: "Tên hai bạn" },
      { label: "Hội bạn", title: "Hội", hostPronoun: "tụi mình", namePlaceholder: "Tên hội / nhóm bạn" },
    ],
  },
  {
    group: "Anh chị em",
    items: [
      { label: "Anh", title: "Anh", hostPronoun: "em", namePlaceholder: "Tên anh" },
      { label: "Chị", title: "Chị", hostPronoun: "em", namePlaceholder: "Tên chị" },
      { label: "Anh Chị", title: "Anh Chị", hostPronoun: "em", namePlaceholder: "Tên hai anh chị" },
      { label: "Em", title: "Em", hostPronoun: "anh chị", namePlaceholder: "Tên em" },
    ],
  },
  {
    group: "Họ hàng & bậc trên",
    items: [
      { label: "Ông Bà", title: "Ông Bà", hostPronoun: "cháu", namePlaceholder: "Nội / ngoại hoặc tên ông bà" },
      { label: "Bác", title: "Bác", hostPronoun: "cháu", namePlaceholder: "Tên hoặc thứ của bác" },
      { label: "Cô Chú", title: "Cô Chú", hostPronoun: "cháu", namePlaceholder: "Tên hoặc thứ của cô chú" },
      { label: "Cô", title: "Cô", hostPronoun: "cháu", namePlaceholder: "Tên hoặc thứ của cô" },
      { label: "Chú", title: "Chú", hostPronoun: "cháu", namePlaceholder: "Tên hoặc thứ của chú" },
      { label: "Dì", title: "Dì", hostPronoun: "cháu", namePlaceholder: "Tên hoặc thứ của dì" },
      { label: "Cậu Mợ", title: "Cậu Mợ", hostPronoun: "cháu", namePlaceholder: "Tên hoặc thứ của cậu mợ" },
    ],
  },
  {
    group: "Thầy cô & công việc",
    items: [
      { label: "Thầy", title: "Thầy", hostPronoun: "em", namePlaceholder: "Tên thầy" },
      { label: "Cô giáo", title: "Cô", hostPronoun: "em", namePlaceholder: "Tên cô" },
      { label: "Sếp / đối tác", title: "Anh", hostPronoun: "chúng tôi", namePlaceholder: "Tên, có thể kèm chức vụ" },
      { label: "Đồng nghiệp", title: "Các anh chị", hostPronoun: "em", namePlaceholder: "Tên phòng / nhóm" },
    ],
  },
  {
    group: "Gia đình & tập thể",
    items: [
      { label: "Gia đình", title: "Gia đình", hostPronoun: "chúng tôi", namePlaceholder: "Người đại diện, kèm danh xưng" },
      { label: "Đại gia đình", title: "Đại gia đình", hostPronoun: "chúng cháu", namePlaceholder: "Dòng họ hoặc người đại diện" },
      { label: "Tập thể", title: "Tập thể", hostPronoun: "tụi mình", namePlaceholder: "Tên lớp / công ty / nhóm" },
    ],
  },
];

export const TITLE_SUGGESTIONS = Array.from(new Set(GUEST_PRESETS.flatMap((g) => g.items.map((i) => i.title))));
export const EXTRA_SUGGESTIONS = ["và người thương", "và gia đình", "cùng các con", "và bạn đồng hành", "cùng người thân"];
export const HOST_SUGGESTIONS = ["tụi mình", "chúng mình", "em", "tụi em", "cháu", "chúng cháu", "con", "anh chị", "chúng tôi"];
