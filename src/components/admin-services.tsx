import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  type AdminCircles,
  adminCircles,
  type AdminMatchmakerRequest,
  adminMatchmakerRequests,
  composeCirclesAdmin,
  setCircleVenue,
  updateMatchmakerRequest,
} from "@/lib/services";

/** Onglet « Cercles » : file d'attente, composition automatique (4–6 personnes), lieu à renseigner. */
export function CirclesAdminTab() {
  const [data, setData] = useState<AdminCircles | null>(null);
  const [startsAt, setStartsAt] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [venues, setVenues] = useState<Record<number, string>>({});

  const load = useCallback(async () => setData(await adminCircles()), []);
  useEffect(() => {
    void load();
  }, [load]);

  const compose = async () => {
    setMsg(null);
    try {
      const r = await composeCirclesAdmin({ data: { startsAt: new Date(startsAt).toISOString() } });
      setMsg(`${r.created} cercle(s) créé(s) · ${r.waiting} personne(s) restent en attente (moins de 4 dans leur ville).`);
      await load();
    } catch {
      setMsg("Impossible de composer : vérifie la date (dans le futur).");
    }
  };

  if (!data) return <p className="text-sm text-muted-foreground">Chargement…</p>;
  const total = data.waiting.reduce((s, w) => s + w.count, 0);
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="font-medium">File d'attente — {total} personne(s)</h2>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          {data.waiting.map((w, i) => (
            <li key={i}>
              {w.city} ({w.country}){w.womenOnly ? " · femmes uniquement" : ""} : {w.count}
            </li>
          ))}
          {!data.waiting.length && <li>Personne en attente.</li>}
        </ul>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="max-w-[16rem]" />
          <Button size="sm" disabled={!startsAt || !total} onClick={compose}>
            Composer les cercles
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Cercles de 4 à 6 personnes, par ville, regroupés par centres d'intérêt et ambiance ; les cercles « femmes » ne
          contiennent que des femmes au selfie vérifié. Le lieu est révélé aux participants 12 h avant le début.
        </p>
        {msg && <p className="mt-2 text-sm text-primary">{msg}</p>}
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">Cercles à venir</h2>
        {data.upcoming.map((c) => (
          <div key={c.id} className="rounded-2xl border border-border bg-card p-4 text-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium">{c.title}</p>
              <Badge>{c.members} pers.</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{new Date(c.startsAt).toLocaleString("fr-FR")}</p>
            <div className="mt-2 flex gap-2">
              <Input
                placeholder="Lieu (restaurant, adresse…)"
                value={venues[c.id] ?? c.venue ?? ""}
                onChange={(e) => setVenues((v) => ({ ...v, [c.id]: e.target.value }))}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  await setCircleVenue({ data: { circleId: c.id, venue: venues[c.id] ?? c.venue ?? "" } });
                  await load();
                }}
              >
                Enregistrer
              </Button>
            </div>
          </div>
        ))}
        {!data.upcoming.length && <p className="text-sm text-muted-foreground">Aucun cercle planifié.</p>}
      </section>
    </div>
  );
}

const KIND_LABEL = { entremise: "Entremise", preparation: "Préparation au mariage" } as const;

/** Onglet « Accompagnement » : demandes Prestige (entremise humaine, préparation au mariage). */
export function MatchmakerAdminTab() {
  const [rows, setRows] = useState<AdminMatchmakerRequest[] | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const load = useCallback(async () => setRows(await adminMatchmakerRequests()), []);
  useEffect(() => {
    void load();
  }, [load]);

  if (!rows) return <p className="text-sm text-muted-foreground">Chargement…</p>;
  const save = async (r: AdminMatchmakerRequest, status: AdminMatchmakerRequest["status"]) => {
    await updateMatchmakerRequest({ data: { id: r.id, status, note: notes[r.id] ?? r.staffNote ?? "" } });
    await load();
  };
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.id} className="rounded-2xl border border-border bg-card p-4 text-sm">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium">
              {r.firstName} · {r.city} ({r.country})
            </p>
            <Badge tone={r.status === "terminee" ? "ok" : "primary"}>{r.status.replace("_", " ")}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {KIND_LABEL[r.kind]} · univers : {r.universes} · {new Date(r.createdAt).toLocaleDateString("fr-FR")}
          </p>
          {r.brief && <p className="mt-2">{r.brief}</p>}
          <Input
            className="mt-2"
            placeholder="Note interne (profils proposés, suivi…)"
            value={notes[r.id] ?? r.staffNote ?? ""}
            onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => save(r, "en_cours")}>
              En cours
            </Button>
            <Button size="sm" variant="outline" onClick={() => save(r, "terminee")}>
              Terminée
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Pour présenter un profil, utilise « Envoyer une suggestion » dans l'onglet Profils.
          </p>
        </div>
      ))}
      {!rows.length && <p className="text-sm text-muted-foreground">Aucune demande.</p>}
    </div>
  );
}
