import { NextResponse } from "next/server";

/**
 * Healthcheck của Docker: chỉ kiểm tra server còn sống, KHÔNG đụng database.
 * Nếu gọi DB mỗi 30s thì Neon không bao giờ được tạm nghỉ và sẽ hết quota compute.
 */
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ ok: true });
}
