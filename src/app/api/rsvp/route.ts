import { NextResponse } from "next/server";
import { appendToCollection, clean } from "@/lib/store";

export type Rsvp = {
  id: string;
  name: string;
  phone: string;
  attending: boolean;
  guests: number;
  side: string;
  note: string;
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
    createdAt: new Date().toISOString(),
  };

  await appendToCollection("rsvp", rsvp);
  return NextResponse.json({ ok: true });
}
