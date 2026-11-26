import { NextResponse } from "next/server";
import { normalizePhone } from "@/lib/format";
import { isGuestId } from "@/lib/guest";
import { appendToCollection, clean, upsertInCollection } from "@/lib/store";

export type Rsvp = {
  id: string;
  name: string;
  phone: string;
  attending: boolean;
  guests: number;
  side: string;
  note: string;
  /** Có khi khách gửi từ link mời riêng */
  guestId?: string;
  /** Lần phản hồi gần nhất (khách gửi lại thì cập nhật) */
  createdAt: string;
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = clean(body?.name, 80);
  if (!name) {
    return NextResponse.json({ error: "Vui lòng nhập tên của bạn" }, { status: 400 });
  }

  const rsvp: Rsvp = {
    id: crypto.randomUUID(),
    name,
    phone: clean(body?.phone, 20),
    attending: Boolean(body?.attending),
    guests: Math.min(Math.max(Number(body?.guests) || 1, 1), 10),
    side: clean(body?.side, 20),
    note: clean(body?.note, 500),
    ...(isGuestId(body?.guestId) && { guestId: body.guestId }),
    createdAt: new Date().toISOString(),
  };

  // Cùng số điện thoại là cùng một khách: cập nhật phản hồi cũ thay vì thêm dòng mới
  const phone = normalizePhone(rsvp.phone);
  if (!phone) {
    await appendToCollection("rsvp", rsvp);
  } else {
    await upsertInCollection<Rsvp>(
      "rsvp",
      (r) => normalizePhone(r.phone ?? "") === phone,
      ([previous]) => ({ ...rsvp, id: previous?.id ?? rsvp.id, guestId: rsvp.guestId ?? previous?.guestId }),
    );
  }
  return NextResponse.json({ ok: true });
}
