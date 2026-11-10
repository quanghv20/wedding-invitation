import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/auth";
import { hasDatabase } from "@/lib/db";
import { isGuestId } from "@/lib/guest";
import { GuestError, createGuest, deleteGuest, parseGuest, updateGuest } from "@/lib/guestStore";

/** Quản lý lời mời: POST tạo, PUT sửa ({ id, ...}), DELETE xóa ({ id }). Đều trả về danh sách mới */
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

export const POST = (request: NextRequest) => handle(request, (body) => createGuest(parseGuest(body)));

export const PUT = (request: NextRequest) =>
  handle(request, async (body) => ({ guests: await updateGuest(requireId(body), parseGuest(body)) }));

export const DELETE = (request: NextRequest) => handle(request, async (body) => ({ guests: await deleteGuest(requireId(body)) }));
