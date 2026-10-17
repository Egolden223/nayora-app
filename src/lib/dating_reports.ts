import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";

/**
 * Signalement profil :
 * - -8 fiabilité par signalement distinct
 * - pénalité de visibilité proportionnelle (même Prestige)
 * - avertissement + escalade modération à chaque palier de 10
 */
export const reportProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { userId: string; reason: string }) => input)
  .handler(async ({ context, data }) => {
    if (!data.userId || data.userId === context.userId) return { ok: true };
    const sql = await getSql();
    const recent = await sql.query<{ c: number }>(
      `select count(*)::int as c from reports
       where reporter_id = $1 and created_at > now() - interval '1 hour'`,
      [context.userId],
    );
    if ((recent[0]?.c ?? 0) >= 5) {
      return { ok: false as const, error: "too_many_reports" };
    }
    const already = await sql.query<{ c: number }>(
      `select count(*)::int as c from reports
       where reporter_id = $1 and reported_id = $2`,
      [context.userId, data.userId],
    );
    if ((already[0]?.c ?? 0) > 0) {
      return { ok: true as const, duplicate: true };
    }

    await sql.query(
      "insert into reports (reporter_id, reported_id, reason) values ($1,$2,$3)",
      [context.userId, data.userId, data.reason || "signalement"],
    );
    await sql.query(
      "insert into blocks (blocker_id, blocked_id, reason) values ($1,$2,$3) on conflict do nothing",
      [context.userId, data.userId, data.reason || "signalement"],
    );

    const cntRows = await sql.query<{ c: number }>(
      `select count(distinct reporter_id)::int as c from reports where reported_id = $1`,
      [data.userId],
    );
    const reportCount = Number(cntRows[0]?.c ?? 0);
    const visibilityPenalty = Math.min(50, reportCount * 5);
    const AUTO_SUSPEND_THRESHOLD = 40;
    const updated = await sql.query<{ reliability_score: number; report_warning_tier: number }>(
      `update profiles set
         reliability_score = greatest(0, reliability_score - 8),
         visibility_penalty = $2,
         updated_at = now()
       where user_id = $1
       returning reliability_score, coalesce(report_warning_tier, 0) as report_warning_tier`,
      [data.userId, visibilityPenalty],
    );
    const score = updated[0]?.reliability_score;
    const prevTier = Number(updated[0]?.report_warning_tier ?? 0);
    const newTier = Math.floor(reportCount / 10);

    if (newTier > prevTier && newTier >= 1) {
      await sql.query(
        `update profiles set report_warning_tier = $2, updated_at = now() where user_id = $1`,
        [data.userId, newTier],
      );
      const body =
        newTier === 1
          ? `Avertissement : votre profil a reçu ${reportCount} signalements. Votre visibilité et votre note de fiabilité ont été réduites. Respectez la charte RAYINE.`
          : `Avertissement niveau ${newTier} : ${reportCount} signalements. Visibilité et fiabilité encore réduites. Un contrôle modération est en cours.`;
      try {
        await sql.query(
          `insert into user_alerts (user_id, kind, body) values ($1, $2, $3)`,
          [data.userId, "report_warning", body],
        );
      } catch {
        /* migration not applied yet */
      }
      try {
        await sql.query(
          `update reports set escalated = true where reported_id = $1 and coalesce(status, 'pending') = 'pending'`,
          [data.userId],
        );
      } catch {
        /* column may be missing */
      }
    }

    if (score !== undefined && score < AUTO_SUSPEND_THRESHOLD) {
      await sql.query(
        `update profiles set suspended = true, suspended_reason = $2
         where user_id = $1 and suspended = false`,
        [data.userId, "auto: signalements multiples"],
      );
    }
    return { ok: true as const, reportCount, visibilityPenalty };
  });
