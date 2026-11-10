import { NextResponse } from "next/server";
import { appendToCollection, clean, readCollection } from "@/lib/store";

export type Wish = { id: string; name: string; message: string; createdAt: string };

export async function GET() {
  const wishes = await readCollection<Wish>("wishes");
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
  await appendToCollection("wishes", wish);
  return NextResponse.json(wish);
}
