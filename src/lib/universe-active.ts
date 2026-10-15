import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { COUNTRY_CODES, INTENTIONS, PRO_DOMAINS } from "@/lib/constants";
import { loadProfile } from "@/lib/dating_final";
import { sanitizeUniverseData, type UniverseData } from "@/lib/universe-match";

/** Met l'univers choisi en premier (univers actif) et met à jour intention. */
export const setActiveUniverse = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { universe: string }) => input)
  .handler(async ({ context, data }) => {
    const me = await loadProfile(context.userId);
    if (!me) throw new Error("Profil introuvable");
    const u = data.universe;
    if (!(INTENTIONS as readonly string[]).includes(u)) {
      throw new Error("Univers invalide");
    }
    const current = me.universes?.length ? [...me.universes] : [me.intention || "mariage"];
    if (!current.includes(u)) {
      throw new Error("Cet univers n'est pas activé sur ton profil");
    }
    const next = [u, ...current.filter((x) => x !== u)];
    const sql = await getSql();
    await sql.query(
      `update profiles set intention = $1, universes = $2, updated_at = now() where user_id = $3`,
      [u, next.join(","), context.userId],
    );
    return loadProfile(context.userId);
  });

/**
 * Ajoute un sous-profil (un nouvel univers) sans retoucher les infos de base
 * (naissance, photo, bio globale…). Fusionne uniquement universe_data.
 * Optionnellement active ce nouvel univers.
 */
export const addUniverseProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: { universe: string; universeData?: UniverseData; activate?: boolean }) => input,
  )
  .handler(async ({ context, data }) => {
    const me = await loadProfile(context.userId);
    if (!me) throw new Error("Profil introuvable");
    const u = data.universe;
    if (!(INTENTIONS as readonly string[]).includes(u)) {
      throw new Error("Univers invalide");
    }
    const current = me.universes?.length ? [...me.universes] : [me.intention || "mariage"];
    if (current.includes(u)) {
      throw new Error("Cet univers est déjà sur ton profil");
    }
    const next = [...current, u];
    const mergedRaw = { ...(me.universeData ?? {}), ...(data.universeData ?? {}) };
    const universeData = sanitizeUniverseData(mergedRaw, {
      domains: PRO_DOMAINS,
      countries: COUNTRY_CODES,
      universes: next,
    });
    const activate = data.activate !== false;
    const intention = activate ? u : (me.intention || next[0]);
    const ordered = activate ? [u, ...current] : next;
    const sql = await getSql();
    await sql.query(
      `update profiles set
         universes = $1,
         intention = $2,
         universe_data = $3::jsonb,
         updated_at = now()
       where user_id = $4`,
      [ordered.join(","), intention, JSON.stringify(universeData), context.userId],
    );
    return loadProfile(context.userId);
  });
