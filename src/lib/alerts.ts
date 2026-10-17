import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";

export type UserAlert = {
  id: number;
  kind: string;
  body: string;
  read: boolean;
  createdAt: string;
};

export const listMyAlerts = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<UserAlert[]> => {
    const sql = await getSql();
    try {
      const rows = await sql.query<{
        id: number;
        kind: string;
        body: string;
        read: boolean;
        created_at: string;
      }>(
        `select id, kind, body, read, created_at from user_alerts
         where user_id = $1 order by created_at desc limit 20`,
        [context.userId],
      );
      return rows.map((r) => ({
        id: Number(r.id),
        kind: r.kind,
        body: r.body,
        read: Boolean(r.read),
        createdAt: r.created_at,
      }));
    } catch {
      return [];
    }
  });

export const markAlertRead = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: number }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    try {
      await sql.query(
        `update user_alerts set read = true where id = $1 and user_id = $2`,
        [data.id, context.userId],
      );
    } catch {
      /* ignore */
    }
    return { ok: true as const };
  });
