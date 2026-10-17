import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";

/**
 * Staff roles for the moderation panel (/admin). Nothing in the UI can create
 * an admin — the first one is set directly in the database after deploy (see
 * migrations/0003_admin.sql). From there, an admin can promote/demote other
 * accounts to moderator or admin from the panel itself.
 */
export type StaffRole = "user" | "moderator" | "admin";

const RANK: Record<StaffRole, number> = { user: 0, moderator: 1, admin: 2 };

export class ForbiddenError extends Error {
  readonly status = 403;
  constructor() {
    super("Forbidden");
    this.name = "ForbiddenError";
  }
}

async function loadRole(userId: string): Promise<StaffRole> {
  const sql = await getSql();
  const rows = await sql.query<{ role: string }>(
    "select role from profiles where user_id = $1 limit 1",
    [userId],
  );
  return (rows[0]?.role as StaffRole) ?? "user";
}

/** Throws ForbiddenError when the caller's role is below `minRole`. */
export async function requireStaff(
  userId: string,
  minRole: "moderator" | "admin",
): Promise<StaffRole> {
  const role = await loadRole(userId);
  if (RANK[role] < RANK[minRole]) throw new ForbiddenError();
  return role;
}

/** Used by the /admin route to decide whether to render or redirect. Never throws for role reasons — a plain visitor just gets "user" back. */
export const getMyStaffRole = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<{ role: StaffRole }> => {
    return { role: await loadRole(context.userId) };
  });

export type AdminProfileRow = {
  id: number;
  userId: string;
  firstName: string;
  city: string;
  country: string;
  verificationStatus: string;
  reliabilityScore: number;
  isPremium: boolean;
  isDemo: boolean;
  suspended: boolean;
  suspendedReason: string | null;
  role: StaffRole;
  reportCount: number;
  createdAt: string;
  photoUrl: string | null;
  selfieUrl: string | null;
  idDocumentUrl: string | null;
  idDocumentStatus: string;
  referralCode: string | null;
  referredCount: number;
};

export const listProfilesForAdmin = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { search?: string } | undefined) => input ?? {})
  .handler(async ({ context, data }): Promise<AdminProfileRow[]> => {
    await requireStaff(context.userId, "moderator");
    const sql = await getSql();
    const search = `%${(data.search ?? "").trim().toLowerCase()}%`;
    const rows = await sql.query<{
      id: number;
      user_id: string;
      first_name: string;
      city: string;
      country: string;
      verification_status: string;
      reliability_score: number;
      is_premium: boolean;
      is_demo: boolean;
      suspended: boolean;
      suspended_reason: string | null;
      role: string;
      report_count: number;
      created_at: string;
      photo_url: string | null;
      selfie_url: string | null;
      id_document_url: string | null;
      id_document_status: string | null;
      referral_code: string | null;
      referred_count: number;
    }>(
      `select p.id, p.user_id, p.first_name, p.city, p.country,
              p.verification_status, p.reliability_score, p.is_premium,
              p.is_demo, p.suspended, p.suspended_reason, p.role, p.created_at,
              p.photo_url, p.selfie_url, p.id_document_url, p.id_document_status, p.referral_code,
              (select count(*)::int from reports r where r.reported_id = p.user_id) as report_count,
              (select count(*)::int from profiles r2 where r2.referred_by = p.referral_code) as referred_count
       from profiles p
       where lower(p.first_name) like $1 or lower(p.city) like $1
       order by (p.verification_status = 'en_revue' or p.id_document_status = 'en_revue') desc, report_count desc, p.created_at desc
       limit 200`,
      [search],
    );
    return rows.map((r) => ({
      id: Number(r.id),
      userId: r.user_id,
      firstName: r.first_name,
      city: r.city ?? "",
      country: r.country,
      verificationStatus: r.verification_status,
      reliabilityScore: Number(r.reliability_score ?? 100),
      isPremium: Boolean(r.is_premium),
      isDemo: Boolean(r.is_demo),
      suspended: Boolean(r.suspended),
      suspendedReason: r.suspended_reason,
      role: (r.role as StaffRole) ?? "user",
      reportCount: Number(r.report_count ?? 0),
      createdAt: r.created_at,
      photoUrl: r.photo_url,
      selfieUrl: r.selfie_url,
      idDocumentUrl: r.id_document_url,
      idDocumentStatus: r.id_document_status ?? "non_soumis",
      referralCode: r.referral_code,
      referredCount: Number(r.referred_count ?? 0),
    }));
  });

export const setProfileVerification = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { userId: string; status: "en_revue" | "verifie" | "refuse" }) => input)
  .handler(async ({ context, data }) => {
    await requireStaff(context.userId, "moderator");
    const sql = await getSql();
    await sql.query(
      "update profiles set verification_status = $2, updated_at = now() where user_id = $1",
      [data.userId, data.status],
    );
    return { ok: true as const };
  });

export const setIdDocumentVerification = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { userId: string; status: "en_revue" | "verifie" | "refuse" }) => input)
  .handler(async ({ context, data }) => {
    await requireStaff(context.userId, "moderator");
    const sql = await getSql();
    await sql.query(
      "update profiles set id_document_status = $2, updated_at = now() where user_id = $1",
      [data.userId, data.status],
    );
    return { ok: true as const };
  });

export const setProfileSuspended = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { userId: string; suspended: boolean; reason?: string }) => input)
  .handler(async ({ context, data }) => {
    await requireStaff(context.userId, "moderator");
    const sql = await getSql();
    await sql.query(
      "update profiles set suspended = $2, suspended_reason = $3, updated_at = now() where user_id = $1",
      [data.userId, data.suspended, data.suspended ? (data.reason ?? "signalements") : null],
    );
    return { ok: true as const };
  });

/** Admin-only: moderators cannot grant themselves or others staff access. */
export const setStaffRole = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { userId: string; role: StaffRole }) => input)
  .handler(async ({ context, data }) => {
    await requireStaff(context.userId, "admin");
    const sql = await getSql();
    await sql.query("update profiles set role = $2, updated_at = now() where user_id = $1", [
      data.userId,
      data.role,
    ]);
    return { ok: true as const };
  });

/** Moderator+: activer ou retirer Prestige.
 *  Activation = 30 jours à partir de maintenant (ou prolongation si déjà actif).
 *  Désactivation = is_premium false + premium_until null.
 */
export const setPremium = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { userId: string; isPremium: boolean }) => input)
  .handler(async ({ context, data }) => {
    await requireStaff(context.userId, "moderator");
    const sql = await getSql();
    if (data.isPremium) {
      await sql.query(
        `update profiles set
           is_premium = true,
           premium_until = greatest(coalesce(premium_until, now()), now()) + interval '30 days',
           updated_at = now()
         where user_id = $1`,
        [data.userId],
      );
    } else {
      await sql.query(
        `update profiles set is_premium = false, premium_until = null, updated_at = now() where user_id = $1`,
        [data.userId],
      );
    }
    return { ok: true as const };
  });

/** Moderator+: offrir N jours de Prestige (même si l'utilisateur n'a jamais payé).
 *  Prolonge à partir de max(now, premium_until actuel).
 */
export const grantPremiumDays = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { userId: string; days: number }) => input)
  .handler(async ({ context, data }) => {
    await requireStaff(context.userId, "moderator");
    const days = Math.max(1, Math.min(365, Math.floor(Number(data.days) || 0)));
    if (days < 1) throw new Error("Invalid days");
    const sql = await getSql();
    await sql.query(
      `update profiles set
         is_premium = true,
         premium_until = greatest(coalesce(premium_until, now()), now()) + ($2 || ' days')::interval,
         updated_at = now()
       where user_id = $1`,
      [data.userId, String(days)],
    );
    return { ok: true as const, days };
  });

/** Moderator+: offrir un bonus chat (conversation débloquée sans Prestige). */
export const grantBonusChatsAdmin = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { userId: string; amount?: number }) => input)
  .handler(async ({ context, data }) => {
    await requireStaff(context.userId, "moderator");
    const amount = Math.max(1, Math.min(10, data.amount ?? 1));
    const sql = await getSql();
    await sql.query(
      "update profiles set bonus_chats = coalesce(bonus_chats, 0) + $2, updated_at = now() where user_id = $1",
      [data.userId, amount],
    );
    return { ok: true as const };
  });

export type AdminReportRow = {
  id: number;
  reporterId: string;
  reporterName: string | null;
  reportedId: string;
  reportedName: string | null;
  reason: string;
  status: string;
  createdAt: string;
};

export const listReportsForModeration = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<AdminReportRow[]> => {
    await requireStaff(context.userId, "moderator");
    const sql = await getSql();
    const rows = await sql.query<{
      id: number;
      reporter_id: string;
      reporter_name: string | null;
      reported_id: string;
      reported_name: string | null;
      reason: string;
      status: string;
      created_at: string;
    }>(
      `select r.id, r.reporter_id, pr.first_name as reporter_name,
              r.reported_id, pd.first_name as reported_name,
              r.reason, r.status, r.created_at
       from reports r
       left join profiles pr on pr.user_id = r.reporter_id
       left join profiles pd on pd.user_id = r.reported_id
       order by (r.status = 'pending') desc, r.created_at desc
       limit 200`,
    );
    return rows.map((r) => ({
      id: Number(r.id),
      reporterId: r.reporter_id,
      reporterName: r.reporter_name,
      reportedId: r.reported_id,
      reportedName: r.reported_name,
      reason: r.reason,
      status: r.status,
      createdAt: r.created_at,
    }));
  });

export const resolveReport = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { reportId: number; status: "reviewed" | "dismissed" }) => input)
  .handler(async ({ context, data }) => {
    await requireStaff(context.userId, "moderator");
    const sql = await getSql();
    await sql.query(
      "update reports set status = $2, resolved_by = $3, resolved_at = now() where id = $1",
      [data.reportId, data.status, context.userId],
    );
    return { ok: true as const };
  });

/** "Cercles RAYINE" — rencontres de groupe. Création réservée aux modérateurs/admins. */
/**
 * Palier "concierge" : un modérateur suggère manuellement un profil à un
 * utilisateur (recherché par prénom — v1 volontairement simple). Le
 * destinataire voit la suggestion en tête de sa découverte.
 */
export const sendCuratedSuggestion = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { recipientQuery: string; suggestedUserId: string; note: string }) => input)
  .handler(async ({ context, data }) => {
    await requireStaff(context.userId, "moderator");
    const sql = await getSql();
    const recipients = await sql.query<{ user_id: string }>(
      "select user_id from profiles where lower(first_name) like $1 order by created_at desc limit 1",
      [`%${data.recipientQuery.trim().toLowerCase()}%`],
    );
    const recipient = recipients[0];
    if (!recipient) throw new Error("Destinataire introuvable");
    if (recipient.user_id === data.suggestedUserId) throw new Error("Même personne");
    await sql.query(
      "insert into curated_suggestions (user_id, suggested_user_id, note, created_by) values ($1,$2,$3,$4)",
      [recipient.user_id, data.suggestedUserId, data.note.trim() || null, context.userId],
    );
    return { ok: true as const };
  });

export const createEvent = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: {
      title: string;
      description: string;
      city: string;
      country: string;
      startsAt: string;
      capacity: number | null;
    }) => input,
  )
  .handler(async ({ context, data }) => {
    await requireStaff(context.userId, "moderator");
    if (!data.title.trim() || !data.city.trim() || !data.startsAt) {
      throw new Error("Titre, ville et date sont obligatoires");
    }
    const sql = await getSql();
    await sql.query(
      `insert into events (title, description, city, country, starts_at, capacity, created_by)
       values ($1,$2,$3,$4,$5,$6,$7)`,
      [
        data.title.trim(),
        data.description.trim(),
        data.city.trim(),
        data.country,
        data.startsAt,
        data.capacity,
        context.userId,
      ],
    );
    return { ok: true as const };
  });
