/**
 * Appels audio / vidéo à consentement mutuel (salles Jitsi).
 */
import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";

export type CallState = {
  status: "none" | "pending" | "accepted" | "declined";
  mine: boolean;
  room: string | null;
  media: "audio" | "video";
};

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

export const requestCall = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { matchId: number; media?: "audio" | "video" }) => input)
  .handler(async ({ context, data }) => {
    const m = await matchAccess(data.matchId, context.userId);
    if (!m) throw new Error("no match");
    const sql = await getSql();
    const media = data.media === "audio" ? "audio" : "video";
    const room = `nayora-${media}-${m.id}-${Math.random().toString(36).slice(2, 12)}`;
    await sql.query(
      "insert into call_requests (match_id, requester_id, status, room) values ($1,$2,'pending',$3)",
      [m.id, context.userId, room],
    );
    return { ok: true as const, media };
  });

export const getCallState = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { matchId: number }) => input)
  .handler(async ({ context, data }): Promise<CallState> => {
    const m = await matchAccess(data.matchId, context.userId);
    if (!m) return { status: "none", mine: false, room: null, media: "video" };
    const sql = await getSql();
    const rows = await sql.query<{ requester_id: string; status: string; room: string }>(
      "select requester_id, status, room from call_requests where match_id = $1 order by created_at desc limit 1",
      [m.id],
    );
    const call = rows[0];
    if (!call) return { status: "none", mine: false, room: null, media: "video" };
    const media: "audio" | "video" = call.room.includes("-audio-") ? "audio" : "video";
    return {
      status: call.status as CallState["status"],
      mine: call.requester_id === context.userId,
      room: call.status === "accepted" ? call.room : null,
      media,
    };
  });
