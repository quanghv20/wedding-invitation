/** Next.js gọi hàm này một lần khi server khởi động */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Nạp sẵn nội dung để khách đầu tiên không phải chờ database
  const { getWeddingContent } = await import("@/lib/content");
  getWeddingContent().catch((error) => console.error("[content] warm-up failed", error));

  // Backup mỗi giờ: chỉ ở bản production (Docker), dev trên máy không gửi mail
  if (process.env.NODE_ENV === "production" && process.env.DATABASE_URL) {
    const { startBackupSchedule } = await import("@/lib/backupJob");
    startBackupSchedule();
  }
}
