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
