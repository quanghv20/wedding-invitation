import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/auth";
import { hasDatabase } from "@/lib/db";
import { isGuestId } from "@/lib/guest";
import { GuestError, MAX_BATCH, createGuest, createGuests, deleteGuests, parseGuest, parseGuestBatch, updateGuest } from "@/lib/guestStore";

/**
 * Quản lý lời mời, đều trả về danh sách mới:
 * - POST: tạo một lời mời, hoặc nhiều lời mời khi gửi { guests: [...] } (nhập bảng)
 * - PUT: sửa ({ id, ...})
 * - DELETE: xóa ({ id } hoặc { ids: [...] })
 */
async function handle(request: NextRequest, action: (body: Record<string, unknown>) => Promise<unknown>) {
  if (!hasDatabase() || !(await isAdmin(request))) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  try {
    return NextResponse.json(await action((await request.json().catch(() => null)) ?? {}));
  } catch (error) {
    if (error instanceof GuestError) return NextResponse.json({ error: error.message }, { status: 400 });
    throw error;
  }
}

const requireId = (body: Record<string, unknown>) => {
  if (!isGuestId(body.id)) throw new GuestError("Thiếu id lời mời");
  return body.id;
};

const requireIds = (body: Record<string, unknown>) => {
  if (body.ids === undefined) return [requireId(body)];
  if (!Array.isArray(body.ids) || !body.ids.length || body.ids.length > MAX_BATCH || !body.ids.every(isGuestId)) {
    throw new GuestError("Danh sách lời mời cần xóa không hợp lệ");
  }
  return body.ids as string[];
};

export const POST = (request: NextRequest) =>
  handle(request, (body) => ("guests" in body ? createGuests(parseGuestBatch(body.guests)) : createGuest(parseGuest(body))));

export const PUT = (request: NextRequest) =>
  handle(request, async (body) => ({ guests: await updateGuest(requireId(body), parseGuest(body)) }));

export const DELETE = (request: NextRequest) => handle(request, async (body) => ({ guests: await deleteGuests(requireIds(body)) }));
