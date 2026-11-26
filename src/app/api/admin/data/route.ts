import { NextResponse, type NextRequest } from "next/server";
import { listAlbum } from "@/lib/albums";
import { isAdmin } from "@/lib/auth";
import { ContentError, parseContent, readStoredContent, saveWeddingContent } from "@/lib/content";
import { hasDatabase } from "@/lib/db";
import { readGuests } from "@/lib/guestStore";
import { readCollection } from "@/lib/store";
import type { Rsvp } from "../../rsvp/route";
import type { Wish } from "../../wishes/route";

const unauthorized = () => NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

async function authorized(request: NextRequest) {
  return hasDatabase() && (await isAdmin(request));
}

export async function GET(request: NextRequest) {
  if (!(await authorized(request))) return unauthorized();
  const [content, rsvp, wishes, guests, album] = await Promise.all([
    readStoredContent(),
    readCollection<Rsvp>("rsvp"),
    readCollection<Wish>("wishes"),
    readGuests(),
    listAlbum(),
  ]);
  return NextResponse.json({ content, rsvp, wishes, guests, album });
}

export async function PUT(request: NextRequest) {
  if (!(await authorized(request))) return unauthorized();
  try {
    const content = parseContent(await request.json().catch(() => null), await listAlbum());
    await saveWeddingContent(content);
    return NextResponse.json({ content });
  } catch (error) {
    if (error instanceof ContentError) return NextResponse.json({ error: error.message }, { status: 400 });
    throw error;
  }
}
