import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";

export type EventRow = {
  id: number;
  title: string;
  description: string;
  city: string;
  country: string;
  startsAt: string;
  capacity: number | null;
  attendeeCount: number;
  going: boolean;
};

export const listUpcomingEvents = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<EventRow[]> => {
    const sql = await getSql();
    const rows = await sql.query<{
      id: number;
      title: string;
      description: string;
      city: string;
      country: string;
      starts_at: string;
      capacity: number | null;
      attendee_count: number;
      going: boolean;
    }>(
      `select e.id, e.title, e.description, e.city, e.country, e.starts_at, e.capacity,
              (select count(*)::int from event_rsvps r where r.event_id = e.id) as attendee_count,
              exists(select 1 from event_rsvps r where r.event_id = e.id and r.user_id = $1) as going
       from events e
       where e.starts_at > now()
       order by e.starts_at asc
       limit 100`,
      [context.userId],
    );
    return rows.map((r) => ({
      id: Number(r.id),
      title: r.title,
      description: r.description,
      city: r.city,
      country: r.country,
      startsAt: r.starts_at,
      capacity: r.capacity === null ? null : Number(r.capacity),
      attendeeCount: Number(r.attendee_count ?? 0),
      going: Boolean(r.going),
    }));
  });

export const rsvpEvent = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { eventId: number; going: boolean }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    if (data.going) {
      const [event] = await sql.query<{ capacity: number | null; count: number }>(
        `select e.capacity, (select count(*)::int from event_rsvps r where r.event_id = e.id) as count
         from events e where e.id = $1`,
        [data.eventId],
      );
      if (event?.capacity !== null && event !== undefined && event.count >= (event.capacity ?? Infinity)) {
        throw new Error("Complet");
      }
      await sql.query(
        "insert into event_rsvps (event_id, user_id) values ($1,$2) on conflict do nothing",
        [data.eventId, context.userId],
      );
    } else {
      await sql.query("delete from event_rsvps where event_id = $1 and user_id = $2", [
        data.eventId,
        context.userId,
      ]);
    }
    return { ok: true as const };
  });
