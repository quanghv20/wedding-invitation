/** Nạp sẵn nội dung khi server khởi động để khách đầu tiên không phải chờ database */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { getWeddingContent } = await import("@/lib/content");
  getWeddingContent().catch((error) => console.error("[content] warm-up failed", error));
}
