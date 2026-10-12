import { createServerFn } from "@tanstack/react-start";
import { requireStaff } from "@/lib/admin";
import { authMiddleware } from "@/lib/auth/middleware";
import { composeCircles, venueVisible } from "@/lib/circles";
import { getSql } from "@/lib/db";
import { type ImpactStory, loadProfile, matchAccess } from "@/lib/dating";
import { cleanText, PROJECT_CAUSES, scoreUniverse } from "@/lib/universe-match";

/* ------------------------------------------------------------------ */
/* Rencontres planifiées : visio pro 30 min, mentorat, échange projet  */
/* ------------------------------------------------------------------ */

export const MEETING_KINDS = {
  pro_visio: { universe: "professionnel", minutes: 30 },
  mentorat: { universe: "professionnel", minutes: 45 },
  projet_1h: { universe: "projets", minutes: 60 },
  voyage_visio: { universe: "voyage", minutes: 30 },
} as const;
export type MeetingKind = keyof typeof MEETING_KINDS;

export type MeetingRow = {
  id: number;
  kind: MeetingKind;
  startsAt: string;
  durationMin: number;
  status: "proposed" | "confirmed" | "declined" | "cancelled";
  mine: boolean;
  /** Salle visio — uniquement une fois la rencontre confirmée. */
  room: string | null;
  /** Fenêtre d'accès ouverte (10 min avant → 15 min après la fin). */
  joinable: boolean;
  ended: boolean;
  feedbackGiven: boolean;
};

const JOIN_EARLY_MS = 10 * 60_000;
const JOIN_LATE_MS = 15 * 60_000;

export const proposeMeeting = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { matchId: number; kind: MeetingKind; startsAt: string }) => input)
  .handler(async ({ context, data }) => {
    const m = await matchAccess(data.matchId, context.userId);
    if (!m) throw new Error("no match");
    const spec = MEETING_KINDS[data.kind];
    if (!spec) throw new Error("kind");
    const start = new Date(data.startsAt);
    const now = Date.now();
    if (Number.isNaN(start.getTime()) || start.getTime() < now + 5 * 60_000 || start.getTime() > now + 60 * 86_400_000)
      throw new Error("date");
    const me = await loadProfile(context.userId);
    const other = await loadProfile(m.user_a === context.userId ? m.user_b : m.user_a);
    if (!me || !other || !me.universes.includes(spec.universe) || !other.universes.includes(spec.universe))
      throw new Error("universe");
    const sql = await getSql();
    const open = await sql.query<{ c: number }>(
      "select count(*)::int as c from meetings where match_id = $1 and status in ('proposed','confirmed') and starts_at > now()",
      [m.id],
    );
    if (Number(open[0]?.c ?? 0) >= 3) throw new Error("too_many");
    const room = `nayora-m${m.id}-${Math.random().toString(36).slice(2, 12)}`;
    await sql.query(
      "insert into meetings (match_id, proposer_id, kind, starts_at, duration_min, room) values ($1,$2,$3,$4,$5,$6)",
      [m.id, context.userId, data.kind, start.toISOString(), spec.minutes, room],
    );
    return { ok: true as const };
  });

export const respondMeeting = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { meetingId: number; action: "accept" | "decline" | "cancel" }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql.query<{ id: number; match_id: number; proposer_id: string; status: string }>(
      "select id, match_id, proposer_id, status from meetings where id = $1 limit 1",
      [data.meetingId],
    );
    const mt = rows[0];
    if (!mt || !(await matchAccess(mt.match_id, context.userId))) throw new Error("no meeting");
    const mine = mt.proposer_id === context.userId;
    if (data.action === "cancel") {
      if (mt.status === "proposed" || mt.status === "confirmed")
        await sql.query("update meetings set status = 'cancelled' where id = $1", [mt.id]);
    } else if (!mine && mt.status === "proposed") {
      await sql.query("update meetings set status = $2 where id = $1", [
        mt.id,
        data.action === "accept" ? "confirmed" : "declined",
      ]);
    }
    return { ok: true as const };
  });

export const listMeetings = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { matchId: number }) => input)
  .handler(async ({ context, data }): Promise<MeetingRow[]> => {
    const m = await matchAccess(data.matchId, context.userId);
    if (!m) return [];
    const sql = await getSql();
    const rows = await sql.query<{
      id: number;
      kind: string;
      starts_at: string;
      duration_min: number;
      status: string;
      proposer_id: string;
      room: string;
      fb: boolean;
    }>(
      `select mt.id, mt.kind, mt.starts_at, mt.duration_min, mt.status, mt.proposer_id, mt.room,
              exists(select 1 from meeting_feedback f where f.meeting_id = mt.id and f.user_id = $2) as fb
       from meetings mt where mt.match_id = $1 and mt.status <> 'cancelled'
       order by mt.starts_at desc limit 20`,
      [m.id, context.userId],
    );
    const now = Date.now();
    return rows.map((r) => {
      const start = new Date(r.starts_at).getTime();
      const end = start + Number(r.duration_min) * 60_000;
      const confirmed = r.status === "confirmed";
      return {
        id: Number(r.id),
        kind: r.kind as MeetingKind,
        startsAt: new Date(r.starts_at).toISOString(),
        durationMin: Number(r.duration_min),
        status: r.status as MeetingRow["status"],
        mine: r.proposer_id === context.userId,
        room: confirmed ? r.room : null,
        joinable: confirmed && now >= start - JOIN_EARLY_MS && now <= end + JOIN_LATE_MS,
        ended: confirmed && now > end,
        feedbackGiven: Boolean(r.fb),
      };
    });
  });

export const submitMeetingFeedback = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { meetingId: number; rating: number; again: boolean; note?: string }) => input)
  .handler(async ({ context, data }) => {
    const rating = Math.round(Number(data.rating));
    if (!(rating >= 1 && rating <= 5)) throw new Error("rating");
    const sql = await getSql();
    const rows = await sql.query<{ match_id: number; status: string; starts_at: string; duration_min: number }>(
      "select match_id, status, starts_at, duration_min from meetings where id = $1 limit 1",
      [data.meetingId],
    );
    const mt = rows[0];
    if (!mt) throw new Error("no meeting");
    const m = await matchAccess(mt.match_id, context.userId);
    if (!m) throw new Error("no meeting");
    const end = new Date(mt.starts_at).getTime() + Number(mt.duration_min) * 60_000;
    if (mt.status !== "confirmed" || Date.now() < end) throw new Error("not_ended");
    const inserted = await sql.query<{ meeting_id: number }>(
      `insert into meeting_feedback (meeting_id, user_id, rating, again, note)
       values ($1,$2,$3,$4,$5) on conflict do nothing returning meeting_id`,
      [data.meetingId, context.userId, rating, Boolean(data.again), cleanText(data.note ?? "", 280) || null],
    );
    if (inserted[0]) {
      // L'avis note l'AUTRE personne : on met à jour ses agrégats de réputation.
      const otherId = m.user_a === context.userId ? m.user_b : m.user_a;
      await sql.query(
        "update profiles set meet_count = meet_count + 1, meet_rating_sum = meet_rating_sum + $2 where user_id = $1",
        [otherId, rating],
      );
    }
    return { ok: true as const };
  });

/* ------------------------------------------------------------------ */
/* Pages « impact » (Projects & Learn)                                  */
/* ------------------------------------------------------------------ */

export const saveImpactStory = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { title: string; summary: string; cause: string }) => input)
  .handler(async ({ context, data }): Promise<ImpactStory[]> => {
    const title = cleanText(data.title, 80);
    const summary = cleanText(data.summary, 280);
    if (!title || !summary) throw new Error("empty");
    const cause = (PROJECT_CAUSES as readonly string[]).includes(data.cause) ? data.cause : "";
    const me = await loadProfile(context.userId);
    if (!me) throw new Error("no profile");
    if (me.impactStories.length >= 5) throw new Error("max");
    const next = [...me.impactStories, { title, summary, cause }];
    const sql = await getSql();
    await sql.query("update profiles set impact_stories = $2::jsonb, updated_at = now() where user_id = $1", [
      context.userId,
      JSON.stringify(next),
    ]);
    return next;
  });

export const deleteImpactStory = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { index: number }) => input)
  .handler(async ({ context, data }): Promise<ImpactStory[]> => {
    const me = await loadProfile(context.userId);
    if (!me) throw new Error("no profile");
    const next = me.impactStories.filter((_, i) => i !== data.index);
    const sql = await getSql();
    await sql.query("update profiles set impact_stories = $2::jsonb, updated_at = now() where user_id = $1", [
      context.userId,
      JSON.stringify(next),
    ]);
    return next;
  });

/* ------------------------------------------------------------------ */
/* Cercles de 4 à 6 personnes                                           */
/* ------------------------------------------------------------------ */

export type CircleView = {
  id: number;
  title: string;
  city: string;
  womenOnly: boolean;
  startsAt: string;
  revealAt: string;
  /** Null tant que le lieu n'est pas révélé. */
  venue: string | null;
  venueRevealed: boolean;
  members: { firstName: string; ageBand: string }[];
};
export type MyCircles = {
  waiting: { womenOnly: boolean } | null;
  circles: CircleView[];
  /** Cercles « femmes uniquement » : réservés aux femmes dont le selfie est vérifié. */
  canWomenOnly: boolean;
};

export const getMyCircles = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<MyCircles> => {
    const me = await loadProfile(context.userId);
    const sql = await getSql();
    const w = await sql.query<{ women_only: boolean }>(
      "select women_only from circle_signups where user_id = $1 and status = 'waiting' limit 1",
      [context.userId],
    );
    const cs = await sql.query<{
      id: number;
      title: string;
      city: string;
      women_only: boolean;
      starts_at: string;
      reveal_at: string;
      venue: string | null;
    }>(
      `select c.id, c.title, c.city, c.women_only, c.starts_at, c.reveal_at, c.venue
       from circles c join circle_members cm on cm.circle_id = c.id
       where cm.user_id = $1 and c.starts_at > now() - interval '1 day'
       order by c.starts_at asc limit 10`,
      [context.userId],
    );
    const circles: CircleView[] = [];
    for (const c of cs) {
      const members = await sql.query<{ first_name: string; age_band: string }>(
        `select p.first_name, p.age_band from circle_members cm
         join profiles p on p.user_id = cm.user_id where cm.circle_id = $1 order by p.first_name`,
        [c.id],
      );
      const revealed = venueVisible(c.reveal_at);
      circles.push({
        id: Number(c.id),
        title: c.title,
        city: c.city,
        womenOnly: Boolean(c.women_only),
        startsAt: new Date(c.starts_at).toISOString(),
        revealAt: new Date(c.reveal_at).toISOString(),
        venue: revealed ? c.venue : null,
        venueRevealed: revealed,
        members: members.map((x) => ({ firstName: x.first_name, ageBand: x.age_band })),
      });
    }
    return {
      waiting: w[0] ? { womenOnly: Boolean(w[0].women_only) } : null,
      circles,
      canWomenOnly: me?.gender === "femme" && me.verificationStatus === "verifie",
    };
  });

export const joinCircleQueue = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { womenOnly: boolean }) => input)
  .handler(async ({ context, data }) => {
    const me = await loadProfile(context.userId);
    if (!me || !me.city) throw new Error("profile");
    if (data.womenOnly && !(me.gender === "femme" && me.verificationStatus === "verifie"))
      throw new Error("women_only_requires_verification");
    const sql = await getSql();
    await sql.query(
      `insert into circle_signups (user_id, city, country, women_only) values ($1,$2,$3,$4)
       on conflict (user_id) where status = 'waiting' do update set women_only = excluded.women_only`,
      [context.userId, me.city, me.country, Boolean(data.womenOnly)],
    );
    return { ok: true as const };
  });

export const leaveCircleQueue = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await sql.query("update circle_signups set status = 'cancelled' where user_id = $1 and status = 'waiting'", [
      context.userId,
    ]);
    return { ok: true as const };
  });

export const leaveCircle = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { circleId: number }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql.query(
      `delete from circle_members where user_id = $1 and circle_id = $2
       and exists (select 1 from circles c where c.id = $2 and c.starts_at > now())`,
      [context.userId, data.circleId],
    );
    return { ok: true as const };
  });

export type AdminCircles = {
  waiting: { city: string; country: string; womenOnly: boolean; count: number }[];
  upcoming: { id: number; title: string; city: string; womenOnly: boolean; startsAt: string; venue: string | null; members: number }[];
};

export const adminCircles = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<AdminCircles> => {
    await requireStaff(context.userId, "moderator");
    const sql = await getSql();
    const waiting = await sql.query<{ city: string; country: string; women_only: boolean; c: number }>(
      `select city, country, women_only, count(*)::int as c from circle_signups
       where status = 'waiting' group by city, country, women_only order by c desc`,
    );
    const upcoming = await sql.query<{
      id: number; title: string; city: string; women_only: boolean; starts_at: string; venue: string | null; m: number;
    }>(
      `select c.id, c.title, c.city, c.women_only, c.starts_at, c.venue,
              (select count(*)::int from circle_members cm where cm.circle_id = c.id) as m
       from circles c where c.starts_at > now() order by c.starts_at asc limit 50`,
    );
    return {
      waiting: waiting.map((w) => ({ city: w.city, country: w.country, womenOnly: Boolean(w.women_only), count: Number(w.c) })),
      upcoming: upcoming.map((u) => ({
        id: Number(u.id), title: u.title, city: u.city, womenOnly: Boolean(u.women_only),
        startsAt: new Date(u.starts_at).toISOString(), venue: u.venue, members: Number(u.m),
      })),
    };
  });

/** Compose les cercles à partir de la file d'attente (à lancer chaque semaine, ou via un cron). */
export const composeCirclesAdmin = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { startsAt: string }) => input)
  .handler(async ({ context, data }) => {
    await requireStaff(context.userId, "moderator");
    const start = new Date(data.startsAt);
    if (Number.isNaN(start.getTime()) || start.getTime() < Date.now()) throw new Error("date");
    const sql = await getSql();
    const signups = await sql.query<{ id: number; user_id: string; city: string; country: string; women_only: boolean }>(
      "select id, user_id, city, country, women_only from circle_signups where status = 'waiting' order by created_at asc",
    );
    const profiles = new Map<string, NonNullable<Awaited<ReturnType<typeof loadProfile>>>>();
    for (const s of signups) {
      const p = await loadProfile(s.user_id);
      if (p && !p.suspended) profiles.set(s.user_id, p);
    }
    const candidates = signups
      .filter((s) => profiles.has(s.user_id))
      .map((s, i) => ({ userId: s.user_id, city: s.city, country: s.country, womenOnly: Boolean(s.women_only), order: i }));
    const { circles, waiting } = composeCircles(candidates, (a, b) =>
      scoreUniverse("amitie", profiles.get(a)!, profiles.get(b)!).score,
    );
    const reveal = new Date(start.getTime() - 12 * 3_600_000);
    for (const c of circles) {
      const title = `Cercle NAYORA — ${c.city}${c.womenOnly ? " (femmes)" : ""}`;
      const created = await sql.query<{ id: number }>(
        `insert into circles (title, city, country, women_only, starts_at, reveal_at, created_by)
         values ($1,$2,$3,$4,$5,$6,$7) returning id`,
        [title, c.city, c.country, c.womenOnly, start.toISOString(), reveal.toISOString(), context.userId],
      );
      const id = Number(created[0].id);
      for (const uid of c.memberIds) {
        await sql.query("insert into circle_members (circle_id, user_id) values ($1,$2) on conflict do nothing", [id, uid]);
        await sql.query("update circle_signups set status = 'placed' where user_id = $1 and status = 'waiting'", [uid]);
      }
    }
    return { created: circles.length, waiting: waiting.length };
  });

export const setCircleVenue = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { circleId: number; venue: string }) => input)
  .handler(async ({ context, data }) => {
    await requireStaff(context.userId, "moderator");
    const sql = await getSql();
    await sql.query("update circles set venue = $2 where id = $1", [data.circleId, cleanText(data.venue, 160) || null]);
    return { ok: true as const };
  });

/* ------------------------------------------------------------------ */
/* Accompagnement humain (Prestige)                                     */
/* ------------------------------------------------------------------ */

export type MatchmakerRequest = {
  id: number;
  kind: "entremise" | "preparation";
  brief: string;
  status: "nouvelle" | "en_cours" | "terminee";
  createdAt: string;
};

export const requestMatchmaker = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { kind: "entremise" | "preparation"; brief: string }) => input)
  .handler(async ({ context, data }) => {
    if (data.kind !== "entremise" && data.kind !== "preparation") throw new Error("kind");
    const me = await loadProfile(context.userId);
    if (!me) throw new Error("profile");
    if (!me.isPremium) throw new Error("premium_required");
    const sql = await getSql();
    const open = await sql.query<{ id: number }>(
      "select id from matchmaker_requests where user_id = $1 and kind = $2 and status <> 'terminee' limit 1",
      [context.userId, data.kind],
    );
    if (open[0]) return { ok: true as const, existing: true as const };
    await sql.query("insert into matchmaker_requests (user_id, kind, brief) values ($1,$2,$3)", [
      context.userId,
      data.kind,
      cleanText(data.brief, 500),
    ]);
    return { ok: true as const, existing: false as const };
  });

export const listMyMatchmakerRequests = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<MatchmakerRequest[]> => {
    const sql = await getSql();
    const rows = await sql.query<{ id: number; kind: string; brief: string; status: string; created_at: string }>(
      "select id, kind, brief, status, created_at from matchmaker_requests where user_id = $1 order by created_at desc limit 10",
      [context.userId],
    );
    return rows.map((r) => ({
      id: Number(r.id),
      kind: r.kind as MatchmakerRequest["kind"],
      brief: r.brief,
      status: r.status as MatchmakerRequest["status"],
      createdAt: new Date(r.created_at).toISOString(),
    }));
  });

export type AdminMatchmakerRequest = MatchmakerRequest & {
  userId: string;
  firstName: string;
  city: string;
  country: string;
  universes: string;
  staffNote: string | null;
};

export const adminMatchmakerRequests = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<AdminMatchmakerRequest[]> => {
    await requireStaff(context.userId, "moderator");
    const sql = await getSql();
    const rows = await sql.query<{
      id: number; user_id: string; kind: string; brief: string; status: string; staff_note: string | null;
      created_at: string; first_name: string; city: string; country: string; universes: string | null; intention: string;
    }>(
      `select r.id, r.user_id, r.kind, r.brief, r.status, r.staff_note, r.created_at,
              p.first_name, p.city, p.country, p.universes, p.intention
       from matchmaker_requests r join profiles p on p.user_id = r.user_id
       order by (r.status = 'terminee'), r.created_at asc limit 100`,
    );
    return rows.map((r) => ({
      id: Number(r.id),
      userId: r.user_id,
      kind: r.kind as MatchmakerRequest["kind"],
      brief: r.brief,
      status: r.status as MatchmakerRequest["status"],
      createdAt: new Date(r.created_at).toISOString(),
      firstName: r.first_name,
      city: r.city ?? "",
      country: r.country,
      universes: r.universes || r.intention,
      staffNote: r.staff_note,
    }));
  });

export const updateMatchmakerRequest = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: number; status: "nouvelle" | "en_cours" | "terminee"; note: string }) => input)
  .handler(async ({ context, data }) => {
    await requireStaff(context.userId, "moderator");
    if (!["nouvelle", "en_cours", "terminee"].includes(data.status)) throw new Error("status");
    const sql = await getSql();
    await sql.query(
      "update matchmaker_requests set status = $2, staff_note = $3, updated_at = now() where id = $1",
      [data.id, data.status, cleanText(data.note, 500) || null],
    );
    return { ok: true as const };
  });

/* ------------------------------------------------------------------ */
/* Avis de voyage                                                       */
/* ------------------------------------------------------------------ */

export type TravelReview = { rating: number; body: string | null; role: string; authorFirstName: string; createdAt: string };

export const submitTravelReview = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { subjectId: string; rating: number; body?: string }) => input)
  .handler(async ({ context, data }) => {
    const rating = Math.round(Number(data.rating));
    if (!(rating >= 1 && rating <= 5)) throw new Error("rating");
    if (!data.subjectId || data.subjectId === context.userId) throw new Error("subject");
    const sql = await getSql();
    const [a, b] = [context.userId, data.subjectId].sort();
    const matched = await sql.query<{ id: number }>(
      "select id from matches where user_a = $1 and user_b = $2 limit 1",
      [a, b],
    );
    if (!matched[0]) throw new Error("no match");
    const me = await loadProfile(context.userId);
    const subject = await loadProfile(data.subjectId);
    if (!me || !subject || !me.universes.includes("voyage") || !subject.universes.includes("voyage"))
      throw new Error("universe");
    const role = subject.universeData.travelGoal === "guide" ? "guide" : "compagnon";
    await sql.query(
      `insert into travel_reviews (author_id, subject_id, role, rating, body) values ($1,$2,$3,$4,$5)
       on conflict (author_id, subject_id) do update set rating = excluded.rating, body = excluded.body, role = excluded.role`,
      [context.userId, data.subjectId, role, rating, cleanText(data.body ?? "", 400) || null],
    );
    // Agrégats de réputation du membre noté (recalculés, jamais incrémentés à l'aveugle).
    await sql.query(
      `update profiles set
         trip_review_count = (select count(*)::int from travel_reviews where subject_id = $1),
         trip_rating_sum = coalesce((select sum(rating)::int from travel_reviews where subject_id = $1), 0)
       where user_id = $1`,
      [data.subjectId],
    );
    return { ok: true as const };
  });

export const listTravelReviews = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { userId: string }) => input)
  .handler(async ({ data }): Promise<TravelReview[]> => {
    const sql = await getSql();
    const rows = await sql.query<{ rating: number; body: string | null; role: string; first_name: string; created_at: string }>(
      `select r.rating, r.body, r.role, p.first_name, r.created_at from travel_reviews r
       join profiles p on p.user_id = r.author_id where r.subject_id = $1 order by r.created_at desc limit 5`,
      [data.userId],
    );
    return rows.map((r) => ({
      rating: Number(r.rating),
      body: r.body,
      role: r.role,
      authorFirstName: r.first_name,
      createdAt: new Date(r.created_at).toISOString(),
    }));
  });
