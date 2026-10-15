import { useCallback, useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import {
  listProfilesForAdmin,
  listReportsForModeration,
  resolveReport,
  sendCuratedSuggestion,
  setProfileSuspended,
  setIdDocumentVerification,
  setProfileVerification,
  setStaffRole,
  setPremium,
  grantPremiumDays,
  grantBonusChatsAdmin,
  type AdminProfileRow,
  type AdminReportRow,
  type StaffRole,
} from "@/lib/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CirclesAdminTab, MatchmakerAdminTab } from "@/components/admin-services";

type Tab = "reports" | "profiles" | "circles" | "matchmaker";

export function AdminPanel({ role }: { role: StaffRole }) {
  const [tab, setTab] = useState<Tab>("reports");

  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-16 pt-6">
      <div className="mb-6 flex items-center gap-2">
        <ShieldAlert className="size-6" />
        <h1 className="font-display text-2xl font-medium">Modération</h1>
        <Badge tone="primary" className="ml-1">
          {role === "admin" ? "Administrateur" : "Modérateur"}
        </Badge>
      </div>
      <div className="mb-6 flex gap-2">
        <Button
          size="sm"
          variant={tab === "reports" ? "default" : "outline"}
          onClick={() => setTab("reports")}
        >
          Signalements
        </Button>
        <Button
          size="sm"
          variant={tab === "profiles" ? "default" : "outline"}
          onClick={() => setTab("profiles")}
        >
          Profils
        </Button>
        <Button
          size="sm"
          variant={tab === "circles" ? "default" : "outline"}
          onClick={() => setTab("circles")}
        >
          Cercles
        </Button>
        <Button
          size="sm"
          variant={tab === "matchmaker" ? "default" : "outline"}
          onClick={() => setTab("matchmaker")}
        >
          Accompagnement
        </Button>
      </div>
      {tab === "reports" ? (
        <ReportsTab />
      ) : tab === "profiles" ? (
        <ProfilesTab role={role} />
      ) : tab === "circles" ? (
        <CirclesAdminTab />
      ) : (
        <MatchmakerAdminTab />
      )}
    </div>
  );
}

function ReportsTab() {
  const [reports, setReports] = useState<AdminReportRow[] | null>(null);

  const load = useCallback(async () => {
    setReports(await listReportsForModeration());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (reports === null) {
    return <p className="text-sm text-muted-foreground">Chargement…</p>;
  }
  if (reports.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucun signalement.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {reports.map((r) => (
        <div key={r.id} className="rounded-xl border border-border p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm">
              <span className="font-medium">{r.reporterName ?? r.reporterId}</span> a
              signalé <span className="font-medium">{r.reportedName ?? r.reportedId}</span>
            </p>
            <Badge tone={r.status === "pending" ? "primary" : "muted"}>
              {r.status === "pending"
                ? "en attente"
                : r.status === "reviewed"
                  ? "traité"
                  : "rejeté"}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{r.reason}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {new Date(r.createdAt).toLocaleString("fr-FR")}
          </p>
          {r.status === "pending" && (
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  await resolveReport({ data: { reportId: r.id, status: "reviewed" } });
                  await load();
                }}
              >
                Marquer traité
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  await resolveReport({ data: { reportId: r.id, status: "dismissed" } });
                  await load();
                }}
              >
                Rejeter
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ProfilesTab({ role }: { role: StaffRole }) {
  const [search, setSearch] = useState("");
  const [profiles, setProfiles] = useState<AdminProfileRow[] | null>(null);

  const load = useCallback(async (q: string) => {
    setProfiles(await listProfilesForAdmin({ data: { search: q } }));
  }, []);

  useEffect(() => {
    void load(search);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only, search is debounced via the button/Enter key below
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void load(search);
        }}
      >
        <Input
          placeholder="Rechercher par prénom ou ville…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button type="submit" size="sm">
          Chercher
        </Button>
      </form>
      {profiles === null ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : profiles.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun profil.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {profiles.map((p) => (
            <ProfileRow key={p.userId} profile={p} role={role} onChange={() => load(search)} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProfileRow({
  profile: p,
  role,
  onChange,
}: {
  profile: AdminProfileRow;
  role: StaffRole;
  onChange: () => void;
}) {
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{p.firstName}</span>
        <span className="text-sm text-muted-foreground">
          {p.city || p.country}
        </span>
        {p.suspended && <Badge tone="muted">suspendu</Badge>}
        {p.isDemo && <Badge tone="muted">démo</Badge>}
        {p.isPremium && <Badge tone="ok">prestige</Badge>}
        {p.verificationStatus !== "non_soumis" && (
          <Badge tone={p.verificationStatus === "verifie" ? "ok" : "muted"}>
            {p.verificationStatus === "verifie"
              ? "vérifié"
              : p.verificationStatus === "refuse"
                ? "refusé"
                : "en revue"}
          </Badge>
        )}
        {p.reportCount > 0 && (
          <Badge tone="primary">{p.reportCount} signalement{p.reportCount > 1 ? "s" : ""}</Badge>
        )}
        {p.role !== "user" && (
          <Badge tone="primary">{p.role === "admin" ? "admin" : "modérateur"}</Badge>
        )}
        {p.referredCount > 0 && (
          <Badge tone="ok">{p.referredCount} filleul{p.referredCount > 1 ? "s" : ""}</Badge>
        )}
      </div>
      {p.selfieUrl && (
        <div className="mt-3 flex gap-3">
          <div>
            <p className="mb-1 text-[11px] text-muted-foreground">Photo de profil</p>
            {p.photoUrl ? (
              <img src={p.photoUrl} alt="" className="size-24 rounded-xl object-cover" />
            ) : (
              <div className="grid size-24 place-items-center rounded-xl bg-secondary text-xs text-muted-foreground">
                aucune
              </div>
            )}
          </div>
          <div>
            <p className="mb-1 text-[11px] text-muted-foreground">Selfie soumis</p>
            <img src={p.selfieUrl} alt="" className="size-24 rounded-xl object-cover" />
          </div>
        </div>
      )}
      {p.idDocumentUrl && (
        <div className="mt-3">
          <p className="mb-1 text-[11px] text-muted-foreground">
            Pièce d'identité (niveau 3) — {p.idDocumentStatus}
          </p>
          <img src={p.idDocumentUrl} alt="" className="max-h-48 rounded-xl object-contain" />
          <div className="mt-2 flex flex-wrap gap-2">
            {p.idDocumentStatus !== "verifie" && (
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  await setIdDocumentVerification({ data: { userId: p.userId, status: "verifie" } });
                  onChange();
                }}
              >
                Valider l'identité
              </Button>
            )}
            {p.idDocumentStatus !== "refuse" && (
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  await setIdDocumentVerification({ data: { userId: p.userId, status: "refuse" } });
                  onChange();
                }}
              >
                Refuser le document
              </Button>
            )}
          </div>
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {p.verificationStatus !== "verifie" && (
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              await setProfileVerification({ data: { userId: p.userId, status: "verifie" } });
              onChange();
            }}
          >
            Vérifier
          </Button>
        )}
        {p.verificationStatus !== "refuse" && (
          <Button
            size="sm"
            variant="ghost"
            onClick={async () => {
              await setProfileVerification({ data: { userId: p.userId, status: "refuse" } });
              onChange();
            }}
          >
            Refuser la vérification
          </Button>
        )}
        <Button
          size="sm"
          variant={p.isPremium ? "outline" : "default"}
          onClick={async () => {
            await setPremium({ data: { userId: p.userId, isPremium: !p.isPremium } });
            onChange();
          }}
        >
          {p.isPremium ? "Retirer Prestige" : "Activer Prestige (30 j)"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            await grantPremiumDays({ data: { userId: p.userId, days: 7 } });
            onChange();
          }}
        >
          +7 j Prestige
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            await grantPremiumDays({ data: { userId: p.userId, days: 30 } });
            onChange();
          }}
        >
          +30 j Prestige
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            await grantPremiumDays({ data: { userId: p.userId, days: 90 } });
            onChange();
          }}
        >
          +90 j Prestige
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            await grantBonusChatsAdmin({ data: { userId: p.userId, amount: 1 } });
            onChange();
          }}
        >
          +1 bonus chat
        </Button>
        <Button
          size="sm"
          variant={p.suspended ? "outline" : "destructive"}
          onClick={async () => {
            const reason = !p.suspended
              ? window.prompt("Motif de suspension (optionnel) :") ?? undefined
              : undefined;
            await setProfileSuspended({
              data: { userId: p.userId, suspended: !p.suspended, reason },
            });
            onChange();
          }}
        >
          {p.suspended ? "Réactiver" : "Suspendre"}
        </Button>
        {role === "admin" && (
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={async () => {
                const next = p.role === "moderator" ? "user" : "moderator";
                await setStaffRole({ data: { userId: p.userId, role: next } });
                onChange();
              }}
            >
              {p.role === "moderator" ? "Retirer modérateur" : "Nommer modérateur"}
            </Button>
            {p.role !== "admin" && (
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  if (!window.confirm(`Nommer ${p.firstName} administrateur ?`)) return;
                  await setStaffRole({ data: { userId: p.userId, role: "admin" } });
                  onChange();
                }}
              >
                Nommer admin
              </Button>
            )}
            {p.role === "admin" && (
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  if (!window.confirm(`Retirer le rôle admin de ${p.firstName} ?`)) return;
                  await setStaffRole({ data: { userId: p.userId, role: "user" } });
                  onChange();
                }}
              >
                Retirer admin
              </Button>
            )}
          </>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={async () => {
            const recipientQuery = window.prompt(
              "Prénom de la personne à qui suggérer ce profil :",
            );
            if (!recipientQuery) return;
            const note = window.prompt("Note (optionnelle) :") ?? "";
            try {
              await sendCuratedSuggestion({
                data: { recipientQuery, suggestedUserId: p.userId, note },
              });
              window.alert("Suggestion envoyée.");
            } catch (err) {
              window.alert(err instanceof Error ? err.message : "Échec de l'envoi");
            }
          }}
        >
          ✨ Suggérer
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(p.userId);
              window.alert("user_id copié : " + p.userId);
            } catch {
              window.prompt("Copiez le user_id :", p.userId);
            }
          }}
        >
          Copier ID
        </Button>
      </div>
    </div>
  );
}
