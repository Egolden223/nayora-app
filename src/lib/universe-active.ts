import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { INTENTIONS } from "@/lib/constants";
import { loadProfile } from "@/lib/dating_final";

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
