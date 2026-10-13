/**
 * Médias chat — envoi de photos.
 */
import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";

const MAX_CHAT_IMAGE_LENGTH = 900_000;

async function matchAccess(matchId: number, userId: string) {
  const sql = await getSql();
  const rows = await sql.query<{ id: number; user_a: string; user_b: string }>(
    "select id, user_a, user_b from matches where id = $1 limit 1",
    [matchId],
  );
  const m = rows[0];
  if (!m) return null;
  if (m.user_a !== userId && m.user_b !== userId) return null;
  return m;
}

export const sendImageMessage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { matchId: number; imageUrl: string }) => input)
  .handler(async ({ context, data }) => {
    if (!data.imageUrl?.startsWith("data:image/"))
      throw new Error("Image invalide");
    if (data.imageUrl.length > MAX_CHAT_IMAGE_LENGTH)
      throw new Error("Image trop volumineuse");
    const m = await matchAccess(data.matchId, context.userId);
    if (!m) throw new Error("Conversation introuvable");
    const sql = await getSql();
    await sql.query(
      "insert into messages (match_id, sender_id, body, kind, audio_url) values ($1,$2,$3,'image',$4)",
      [data.matchId, context.userId, "📷 Photo", data.imageUrl],
    );
    return { ok: true as const };
  });
