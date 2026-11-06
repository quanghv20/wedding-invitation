import { NextResponse } from "next/server";
import { appendToCollection, clean, readCollection } from "@/lib/store";

export type Wish = { id: string; name: string; message: string; createdAt: string };

const seed: Wish[] = [
  {
    id: "seed-1",
    name: "Hoàng Anh",
    message: "Chúc hai bạn trăm năm hạnh phúc, sớm có thiên thần nhỏ nhé! 💕",
    createdAt: "2026-10-01T09:00:00.000Z",
  },
  {
    id: "seed-2",
    name: "Hội bạn thân",
    message: "Chúc Trường & Hải mãi hạnh phúc, cùng nhau đi hết chặng đường dài nhé!",
    createdAt: "2026-10-02T10:00:00.000Z",
  },
  {
    id: "seed-3",
    name: "Lớp 12A",
    message: "Cô dâu xinh quá! Chúc hai bạn trăm năm hạnh phúc, đầu bạc răng long.",
    createdAt: "2026-10-03T11:00:00.000Z",
  },
];

export async function GET() {
  const wishes = await readCollection<Wish>("wishes", seed);
  return NextResponse.json(wishes.slice(0, 100));
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = clean(body?.name, 60);
  const message = clean(body?.message, 400);
  if (!name || !message) {
    return NextResponse.json({ error: "Vui lòng nhập tên và lời chúc" }, { status: 400 });
  }

  const wish: Wish = { id: crypto.randomUUID(), name, message, createdAt: new Date().toISOString() };
  await appendToCollection("wishes", wish, seed);
  return NextResponse.json(wish);
}
