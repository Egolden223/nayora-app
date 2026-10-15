import { ImpactSection } from "@/components/impact-panel";
import { UniverseFacts } from "@/components/universe-form";
import { useEffect, useRef, useState } from "react";
import { Camera, Crown, ShieldAlert, ShieldCheck, Sparkles } from "lucide-react";
import type { Profile } from "@/lib/dating";
import { getMyStaffRole } from "@/lib/admin";
import {
  getProfileCoachTips,
  reportProfile,
  setFeaturedOk,
  submitIdDocument,
  submitSelfie,
  upsertProfile,
} from "@/lib/dating";
import { countryName, languageName } from "@/lib/i18n";
import { useLang } from "@/lib/lang";
import { UserButton } from "@/lib/auth/gates";
import { fileToResizedDataUrl, makeBlurDataUrl } from "@/lib/image-resize";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LanguageSwitch } from "@/components/language-switch";
import { ProfilePhoto } from "@/components/profile-photo";
import { ActiveUniversePicker } from "@/components/active-universe-picker";

export function MePanel({
  me,
  onEdit,
  onReload,
}: {
  me: Profile;
  onEdit: () => void;
  onReload: () => void;
}) {
  const { t, lang } = useLang();
  const [staffRole, setStaffRole] = useState<"user" | "moderator" | "admin">("user");
  useEffect(() => {
    void getMyStaffRole()
      .then((r) => setStaffRole(r.role))
      .catch(() => setStaffRole("user"));
  }, []);
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [tips, setTips] = useState<string[] | null>(null);
  const [idBusy, setIdBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const idInput = useRef<HTMLInputElement>(null);
  const selfieInput = useRef<HTMLInputElement>(null);
  const photoInput = useRef<HTMLInputElement>(null);

  const primaryUniverse = (me.universes ?? [])[0] ?? me.intention ?? "mariage";
  const otherUniverses = (me.universes ?? []).slice(1);

  const changePhoto = async (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    if (!me.birthDate) {
      onEdit();
      return;
    }
    setPhotoBusy(true);
    try {
      const photoUrl = await fileToResizedDataUrl(file);
      const photoBlurUrl = await makeBlurDataUrl(photoUrl);
      await upsertProfile({
        data: {
          firstName: me.firstName,
          ageBand: me.ageBand,
          birthDate: me.birthDate,
          gender: me.gender,
          lookingFor: me.lookingFor,
          city: me.city,
          country: me.country,
          familyStatus: me.familyStatus,
          intention: primaryUniverse,
          universes: me.universes ?? [primaryUniverse],
          universeData: me.universeData,
          proDomain: me.proDomain,
          bio: me.bio,
          phone: me.phone,
          photoUrl,
          photoBlurUrl,
          blurPhotos: me.blurPhotos,
          heightCm: me.heightCm,
          weightKg: me.weightKg,
          profession: me.profession ?? "",
          languages: me.languages ?? [],
          loveLanguage: me.loveLanguage,
          weekendStyle: me.weekendStyle,
          emergencyName: me.emergencyName,
          emergencyPhone: me.emergencyPhone,
          referredBy: null,
          charterAccepted: true,
        },
      });
      onReload();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : t("authError"));
    } finally {
      setPhotoBusy(false);
      if (photoInput.current) photoInput.current.value = "";
    }
  };

  return (
    <div className="page-panel page-panel-top">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-medium">{t("navProfile")}</h1>
        <div className="flex items-center gap-2">
          <LanguageSwitch compact />
          <UserButton />
        </div>
      </div>
      <div className="flex flex-col items-center text-center">
        <div className="relative">
          <ProfilePhoto
            name={me.firstName}
            seed={me.userId}
            photoUrl={me.photoUrl}
            className="size-28 rounded-full"
            textClassName="text-4xl"
          />
          <input
            ref={photoInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void changePhoto(e.target.files?.[0])}
          />
          <button
            type="button"
            disabled={photoBusy}
            onClick={() => photoInput.current?.click()}
            className="absolute bottom-0 right-0 grid size-9 place-items-center rounded-full border border-border bg-card text-primary shadow-sm"
            aria-label={t("photo")}
          >
            <Camera className="size-4" />
          </button>
        </div>
        <h2 className="mt-4 flex items-center gap-2 font-display text-3xl font-medium">
          {me.firstName}
          {me.isPremium && (
            <span className="inline-flex text-primary" title={t("prestige")} aria-label={t("prestige")}>
              <Crown className="size-6" strokeWidth={1.8} />
            </span>
          )}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {me.ageBand} · {me.city || countryName(lang, me.country)}
        </p>
        {(me.profession || me.heightCm || me.weightKg) && (
          <p className="mt-1 text-sm text-muted-foreground">
            {[
              me.profession,
              me.heightCm ? `${me.heightCm} cm` : null,
              me.weightKg ? `${me.weightKg} kg` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}

        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          {me.familyStatus ? <Badge>{t(me.familyStatus)}</Badge> : null}
          {me.verificationStatus === "verifie" && (
            <Badge tone="ok">
              <ShieldCheck className="mr-1 size-3" />
              {t("verified")}
            </Badge>
          )}
          {me.verificationStatus === "en_revue" && <Badge>{t("inReview")}</Badge>}
          {me.idDocumentStatus === "verifie" && (
            <Badge tone="ok">
              <ShieldCheck className="mr-1 size-3" />
              {t("idVerified")}
            </Badge>
          )}
        </div>

        <ActiveUniversePicker me={me} onReload={onReload} />

        <div className="mt-3 w-full max-w-sm">
          <UniverseFacts universe={primaryUniverse} data={me.universeData} />
        </div>

        {otherUniverses.length > 0 && (
          <div className="mt-3 w-full max-w-sm space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {t("universeSubProfile")}
            </p>
            {otherUniverses.map((u) => (
              <div key={`facts-${u}`} className="flex flex-col items-center">
                <UniverseFacts universe={u} data={me.universeData} />
              </div>
            ))}
          </div>
        )}

        {(me.languages ?? []).length > 0 && (
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {(me.languages ?? []).map((code) => (
              <Badge key={code}>{languageName(lang, code)}</Badge>
            ))}
          </div>
        )}
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-foreground/85">{me.bio}</p>
        <div className="mt-6 flex w-full max-w-sm flex-col gap-2">
          <Button onClick={onEdit}>{t("editProfile")}</Button>
          {(staffRole === "admin" || staffRole === "moderator") && (
            <Button
              variant="outline"
              onClick={() => {
                window.location.href = "/admin";
              }}
            >
              <ShieldAlert className="mr-2 size-4" />
              {t("staffPanel")}
            </Button>
          )}
        </div>
      </div>

      <div className="mt-10 space-y-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <h3 className="font-medium">{t("coachTips")}</h3>
          </div>
          {tips === null ? (
            <Button
              size="sm"
              variant="outline"
              className="mt-3"
              onClick={async () => {
                setTips(await getProfileCoachTips());
              }}
            >
              {t("showTips")}
            </Button>
          ) : (
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {(tips ?? []).map((tip) => (
                <li key={tip}>• {tip}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="font-medium">{t("verifyTitle")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t("verifyLead")}</p>
          <input
            ref={selfieInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setVerifyBusy(true);
              try {
                const dataUrl = await fileToResizedDataUrl(file);
                await submitSelfie({ data: { selfieUrl: dataUrl } });
                onReload();
              } finally {
                setVerifyBusy(false);
              }
            }}
          />
          <Button
            size="sm"
            variant="outline"
            className="mt-3"
            disabled={verifyBusy || me.verificationStatus === "verifie"}
            onClick={() => selfieInput.current?.click()}
          >
            {verifyBusy ? t("loading") : t("submitSelfie")}
          </Button>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="font-medium">{t("idTitle")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t("idLead")}</p>
          <input
            ref={idInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setIdBusy(true);
              try {
                const dataUrl = await fileToResizedDataUrl(file);
                await submitIdDocument({ data: { idDocumentUrl: dataUrl } });
                onReload();
              } finally {
                setIdBusy(false);
              }
            }}
          />
          <Button
            size="sm"
            variant="outline"
            className="mt-3"
            disabled={idBusy || me.idDocumentStatus === "verifie"}
            onClick={() => idInput.current?.click()}
          >
            {idBusy ? t("loading") : t("submitId")}
          </Button>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-1 size-4 accent-[var(--color-primary)]"
              checked={me.featuredOk}
              onChange={async (e) => {
                await setFeaturedOk({ data: { featuredOk: e.target.checked } });
                onReload();
              }}
            />
            <span>
              <span className="block font-medium">{t("featuredTitle")}</span>
              <span className="block text-xs text-muted-foreground">{t("featuredLead")}</span>
            </span>
          </label>
        </div>

        <ImpactSection initial={me.impactStories ?? []} />

        <Button
          size="sm"
          variant="ghost"
          className="text-destructive"
          onClick={async () => {
            const reason = window.prompt(t("reportReason"));
            if (!reason) return;
            await reportProfile({ data: { userId: me.userId, reason } });
          }}
        >
          {t("reportSelf")}
        </Button>
      </div>
    </div>
  );
}
