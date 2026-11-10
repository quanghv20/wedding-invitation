import { randomInt } from "crypto";
import { GUEST_ID_ALPHABET, isGuestId, type Guest, type GuestInput } from "./guest";
import { appendToCollection, clean, readCollection, writeCollection } from "./store";

const KEY = "guests";

export const readGuests = () => readCollection<Guest>(KEY);

/** Tìm khách theo id trên link; lỗi database thì coi như không có để thiệp vẫn mở được */
export async function findGuest(id: unknown): Promise<Guest | null> {
  if (!isGuestId(id)) return null;
  try {
    return (await readGuests()).find((g) => g.id === id) ?? null;
  } catch (error) {
    console.error("[guests] lookup failed", error);
    return null;
  }
}

export class GuestError extends Error {}

/** Kiểm tra dữ liệu gửi từ admin, chỉ giữ các trường đã biết */
export function parseGuest(body: unknown): GuestInput {
  const input = (body ?? {}) as Record<string, unknown>;
  const guest: GuestInput = {
    title: clean(input.title, 40),
    name: clean(input.name, 80),
    extra: clean(input.extra, 60),
    hostPronoun: clean(input.hostPronoun, 30),
    side: input.side === "groom" || input.side === "bride" ? input.side : "",
    group: clean(input.group, 60),
    message: clean(input.message, 300),
  };
  if (!guest.name) throw new GuestError("Hãy nhập tên người được mời");
  return guest;
}

function newId(taken: Set<string>) {
  for (;;) {
    const id = Array.from({ length: 6 }, () => GUEST_ID_ALPHABET[randomInt(GUEST_ID_ALPHABET.length)]).join("");
    if (!taken.has(id)) return id;
  }
}

export async function createGuest(input: GuestInput) {
  const guests = await readGuests();
  const guest: Guest = { ...input, id: newId(new Set(guests.map((g) => g.id))), createdAt: new Date().toISOString() };
  return { guest, guests: await appendToCollection(KEY, guest) };
}

export async function updateGuest(id: string, input: GuestInput) {
  const guests = await readGuests();
  if (!guests.some((g) => g.id === id)) throw new GuestError("Không tìm thấy lời mời này");
  const next = guests.map((g) => (g.id === id ? { ...g, ...input } : g));
  await writeCollection(KEY, next);
  return next;
}

export async function deleteGuest(id: string) {
  const next = (await readGuests()).filter((g) => g.id !== id);
  await writeCollection(KEY, next);
  return next;
}
