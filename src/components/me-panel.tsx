import { ImpactSection } from "@/components/impact-panel";
import { UniverseFacts } from "@/components/universe-form";
import { useRef, useState } from "react";
import { ShieldCheck, Sparkles } from "lucide-react";
import type { Profile } from "@/lib/dating";
import {
  getProfileCoachTips,
  reportProfile,
  setFeaturedOk,
  submitIdDocument,
  submitSelfie,
} from "@/lib/dating";
import { countryName, languageName } from "@/lib/i18n";
import { useLang } from "@/lib/lang";
import { UserButton } from "@/lib/auth/gates";
import { fileToResizedDataUrl } from "@/lib/image-resize";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LanguageSwitch } from "@/components/language-switch";
import { ProfilePhoto } from "@/components/profile-photo";

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
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [tips, setTips] = useState<string[] | null>(null);
  const [tipsBusy, setTipsBusy] = useState(false);
  const [referralCopied, setReferralCopied] = useState(false);
  const selfieInput = useRef<HTMLInputElement>(null);
  const idInput = useRef<HTMLInputElement>(null);

  const onPickId = async (file: File | undefined) => {
    if (!file) return;
    setVerifyBusy(true);
    try {
      const dataUrl = await fileToResizedDataUrl(file, { maxSize: 1600, quality: 0.85 });
      await submitIdDocument({ data: { documentUrl: dataUrl } });
      onReload();
    } finally {
      setVerifyBusy(false);
    }
  };

  const onPickSelfie = async (file: File | undefined) => {
    if (!file) return;
    setVerifyBusy(true);
    try {
      const dataUrl = await fileToResizedDataUrl(file, { maxSize: 900 });
      await submitSelfie({ data: { selfieUrl: dataUrl } });
      onReload();
    } finally {
      setVerifyBusy(false);
    }
  };

  return (
    <div className="page-panel">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl font-medium">{t("navProfile")}</h1>
        <div className="flex items-center gap-2">
          <LanguageSwitch compact />
          <UserButton />
        </div>
      </div>
      <div className="flex flex-col items-center text-center">
        <ProfilePhoto
          name={me.firstName}
          seed={me.userId}
          photoUrl={me.photoUrl}
          className="size-28 rounded-full"
          textClassName="text-4xl"
        />
        <h2 className="mt-4 font-display text-3xl font-medium">{me.firstName}</h2>
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
          {me.universes.map((u, i) => (
            <Badge key={u} tone={i === 0 ? "primary" : undefined}>
              {t(u)}
            </Badge>
          ))}
          <Badge>{t(me.familyStatus)}</Badge>
          {me.isPremium && <Badge tone="ok">{t("prestige")}</Badge>}
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
          {me.idDocumentStatus === "en_revue" && <Badge>{t("idInReview")}</Badge>}
        </div>
        {me.universes.map((u) => (
          <div key={`facts-${u}`} className="mt-2 flex flex-col items-center">
            <UniverseFacts universe={u} data={me.universeData} />
          </div>
        ))}
        {me.languages.length > 0 && (
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {me.languages.map((code) => (
              <Badge key={code}>{languageName(lang, code)}</Badge>
            ))}
          </div>
        )}
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-foreground/85">
          {me.bio}
        </p>
        <p className="mt-3 text-xs tabular-nums text-muted-foreground">
          {t("reliability")} {me.reliabilityScore}
        </p>

        {(me.verificationStatus === "non_soumis" || me.verificationStatus === "refuse") && (
          <div className="mt-5 w-full rounded-2xl border border-border bg-card p-4 text-left">
            <p className="flex items-center gap-1.5 text-sm font-medium">
              <ShieldCheck className="size-4 text-primary" /> {t("verifyTitle")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{t("verifyLead")}</p>
            <input
              ref={selfieInput}
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={(e) => onPickSelfie(e.target.files?.[0])}
            />
            <Button
              size="sm"
              variant="outline"
              className="mt-3"
              disabled={verifyBusy}
              onClick={() => selfieInput.current?.click()}
            >
              {verifyBusy ? t("loading") : t("verifyCta")}
            </Button>
          </div>
        )}

        {(me.idDocumentStatus === "non_soumis" || me.idDocumentStatus === "refuse") && (
          <div className="mt-3 w-full rounded-2xl border border-border bg-card p-4 text-left">
            <p className="flex items-center gap-1.5 text-sm font-medium">
              <ShieldCheck className="size-4 text-primary" /> {t("idVerifyTitle")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{t("idVerifyLead")}</p>
            <input
              ref={idInput}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => onPickId(e.target.files?.[0])}
            />
            <Button
              size="sm"
              variant="outline"
              className="mt-3"
              disabled={verifyBusy}
              onClick={() => idInput.current?.click()}
            >
              {verifyBusy ? t("loading") : t("idVerifyCta")}
            </Button>
          </div>
        )}

        {me.universes.includes("projets") && <ImpactSection initial={me.impactStories} />}

        {me.referralCode && (
          <div className="mt-3 w-full rounded-2xl border border-border bg-card p-4 text-left">
            <p className="text-sm font-medium">{t("referralTitle")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("referralLead")}</p>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 truncate rounded-lg bg-secondary px-3 py-2 text-xs">
                {typeof window !== "undefined" ? window.location.origin : ""}/login?ref=
                {me.referralCode}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard?.writeText(
                    `${window.location.origin}/login?ref=${me.referralCode}`,
                  );
                  setReferralCopied(true);
                  setTimeout(() => setReferralCopied(false), 2000);
                }}
              >
                {referralCopied ? t("copied") : t("copy")}
              </Button>
            </div>
          </div>
        )}
        <label className="mt-3 flex w-full items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left">
          <input
            type="checkbox"
            checked={me.featuredOk}
            onChange={async (e) => {
              await setFeaturedOk({ data: { featuredOk: e.target.checked } });
              onReload();
            }}
            className="mt-1 size-4 accent-[var(--color-primary)]"
          />
          <span>
            <span className="block text-sm font-medium">{t("featuredTitle")}</span>
            <span className="block text-xs text-muted-foreground">{t("featuredLead")}</span>
          </span>
        </label>
        <div className="mt-3 w-full rounded-2xl border border-border bg-card p-4 text-left">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <Sparkles className="size-4 text-accent" /> {t("coachTitle")}
          </p>
          {tips === null ? (
            <Button
              size="sm"
              variant="outline"
              className="mt-3"
              disabled={tipsBusy}
              onClick={async () => {
                setTipsBusy(true);
                try {
                  const res = await getProfileCoachTips({ data: { lang } });
                  setTips(res.tips);
                } finally {
                  setTipsBusy(false);
                }
              }}
            >
              {tipsBusy ? t("loading") : t("coachCta")}
            </Button>
          ) : tips.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">{t("coachEmpty")}</p>
          ) : (
            <ul className="mt-2 space-y-1.5 text-sm text-foreground/85">
              {tips.map((tip) => (
                <li key={tip}>• {tip}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-3 w-full rounded-2xl border border-border bg-card p-4 text-left">
          <p className="text-sm font-medium">{t("universesManageTitle")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("universesManageLead")}</p>
          <ul className="mt-3 space-y-2">
            {me.universes.map((u, i) => (
              <li
                key={u}
                className="flex items-center justify-between rounded-xl bg-secondary/40 px-3 py-2"
              >
                <span className="text-sm font-medium">
                  {t(u)}
                  {i === 0 && (
                    <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-primary">
                      {t("universePrimary")}
                    </span>
                  )}
                  {i > 0 && (
                    <span className="ml-2 text-[10px] font-medium text-muted-foreground">
                      {t("universeSubProfile")}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">{t("universesDisableHint")}</p>
          <Button size="sm" variant="outline" className="mt-3 w-full" onClick={onEdit}>
            {me.universes.length < 5 ? t("universesAddSub") : t("universesManageCta")}
          </Button>
        </div>
      </div>
      <div className="mt-8 grid gap-2">
        <Button onClick={onEdit}>{t("editProfile")}</Button>
      </div>
    </div>
  );
}

export async function hideProfile(userId: string) {
  await reportProfile({ data: { userId, reason: "masquer" } });
}
