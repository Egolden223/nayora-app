import { useRef, useState, type ReactNode } from "react";
import { UserButton } from "@/lib/auth/gates";
import {
  COUNTRY_CODES,
  FAMILY_STATUSES,
  GENDERS,
  INTENTIONS,
  LANGUAGE_CODES,
  LOOKING_FOR,
  LOVE_LANGUAGES,
  PRO_DOMAINS,
  UNIVERSES_WITH_DOMAIN,
  WEEKEND_STYLES,
} from "@/lib/constants";
import type { Profile, ProfileInput } from "@/lib/dating";
import { ageBandFromBirthDate } from "@/lib/privacy";
import { useLang } from "@/lib/lang";
import { countryName, languageName, sortedCountryCodes, sortedLanguageCodes } from "@/lib/i18n";
import { fileToResizedDataUrl, makeBlurDataUrl } from "@/lib/image-resize";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FieldSelect } from "@/components/field-select";
import { ProfilePhoto } from "@/components/profile-photo";
import { LanguageSwitch } from "@/components/language-switch";
import { Wordmark } from "@/components/wordmark";
import { Camera } from "lucide-react";
import { UniverseProfileForm } from "@/components/universe-form";
import { UNIVERSE_ICONS } from "@/lib/universe-icons";
import type { UniverseData } from "@/lib/universe-match";
import { cn } from "@/lib/utils";

export function Onboarding({
  initial,
  onSave,
}: {
  initial?: Profile | null;
  onSave: (data: ProfileInput) => Promise<void>;
}) {
  const { t, lang } = useLang();
  const [step, setStep] = useState(initial ? 1 : 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [charter, setCharter] = useState(initial?.charterAccepted ?? false);
  const [firstName, setFirstName] = useState(initial?.firstName ?? "");
  const [birthDate, setBirthDate] = useState(initial?.birthDate ?? "");
  const [gender, setGender] = useState(initial?.gender ?? "");
  const [lookingFor, setLookingFor] = useState(initial?.lookingFor ?? "");
  const [ageBand, setAgeBand] = useState(initial?.ageBand ?? "25-29");
  const [city, setCity] = useState(initial?.city ?? "");
  const [country, setCountry] = useState(initial?.country ?? "");
  const [profession, setProfession] = useState(initial?.profession ?? "");
  const [heightCm, setHeightCm] = useState(
    initial?.heightCm ? String(initial.heightCm) : "",
  );
  const [weightKg, setWeightKg] = useState(
    initial?.weightKg ? String(initial.weightKg) : "",
  );
  const [familyStatus, setFamilyStatus] = useState(
    initial?.familyStatus ?? "celibataire",
  );
  const isFirstSignup = !initial;
  const [universes, setUniverses] = useState<string[]>(
    initial?.universes?.length ? initial.universes : ["mariage"],
  );
  const [universeData, setUniverseData] = useState<UniverseData>(initial?.universeData ?? {});
  /**
   * Inscription : un seul univers (le principal).
   * Édition ultérieure : plusieurs sous-profils possibles ; on garde toujours au moins un.
   */
  const toggleUniverse = (key: string) =>
    setUniverses((cur) => {
      if (isFirstSignup) {
        return [key];
      }
      if (cur.includes(key)) {
        return cur.length > 1 ? cur.filter((u) => u !== key) : cur;
      }
      return [...cur, key];
    });
  const [proDomain, setProDomain] = useState(initial?.proDomain ?? "");
  const [languages, setLanguages] = useState<string[]>(initial?.languages ?? []);
  const [loveLanguage, setLoveLanguage] = useState(initial?.loveLanguage ?? "");
  const [weekendStyle, setWeekendStyle] = useState(initial?.weekendStyle ?? "");
  const [emergencyName, setEmergencyName] = useState(initial?.emergencyName ?? "");
  const [emergencyPhone, setEmergencyPhone] = useState(initial?.emergencyPhone ?? "");
  const [bio, setBio] = useState(initial?.bio ?? "");
  const [phone, setPhone] = useState(() => {
    if (initial?.phone) return initial.phone;
    try {
      return sessionStorage.getItem("nayora_pending_phone") ?? "";
    } catch {
      return "";
    }
  });
  const [photoUrl, setPhotoUrl] = useState(initial?.photoUrl ?? "");
  const [photoBlurUrl, setPhotoBlurUrl] = useState<string | null>(initial?.photoBlurUrl ?? null);
  const [blurPhotos, setBlurPhotos] = useState(initial?.blurPhotos ?? false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const toggleLanguage = (code: string) =>
    setLanguages((prev) =>
      prev.includes(code) ? prev.filter((l) => l !== code) : [...prev, code],
    );

  const onPickPhoto = async (file: File | undefined) => {
    if (!file) return;
    setPhotoError(null);
    if (!file.type.startsWith("image/")) {
      setPhotoError(t("photoInvalid"));
      return;
    }
    setPhotoBusy(true);
    try {
      const resized = await fileToResizedDataUrl(file);
      setPhotoUrl(resized);
      setPhotoBlurUrl(await makeBlurDataUrl(resized));
    } catch {
      setPhotoError(t("photoInvalid"));
    } finally {
      setPhotoBusy(false);
    }
  };

  const submit = async () => {
    setError(null);
    if (!firstName.trim() || !gender || !lookingFor) {
      setStep(1);
      setError(t("required"));
      return;
    }
    if (!firstName.trim() || !birthDate) {
      setStep(1);
      setError(t("identityRequired"));
      return;
    }
    if (!country) {
      setError(t("required"));
      return;
    }
    if (!photoUrl) {
      setError(t("photoRequired"));
      return;
    }
    setBusy(true);
    try {
      let blur = photoBlurUrl;
      if (blurPhotos && !blur) blur = await makeBlurDataUrl(photoUrl);
      await onSave({
        firstName: firstName.trim(),
        ageBand,
        birthDate,
        gender,
        lookingFor,
        city,
        country,
        profession,
        heightCm: heightCm ? Number(heightCm) : null,
        weightKg: weightKg ? Number(weightKg) : null,
        familyStatus,
        intention: universes[0] ?? "mariage",
        universes,
        universeData,
        proDomain: universes.some((u) => UNIVERSES_WITH_DOMAIN.includes(u)) ? proDomain || null : null,
        languages,
        loveLanguage: loveLanguage || null,
        weekendStyle: weekendStyle || null,
        emergencyName: emergencyName || null,
        emergencyPhone: emergencyPhone || null,
        bio,
        phone: phone || null,
        photoUrl,
        photoBlurUrl: blur,
        blurPhotos,
        referredBy:
          typeof window !== "undefined" ? localStorage.getItem("nayora:ref") : null,
        charterAccepted: true,
      });
    } catch (err) {
      const msg = err instanceof Error && err.message ? err.message : t("authError");
      setError(msg.length < 180 ? msg : t("authError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pb-16 pt-8">
      <header className="mb-8 flex items-center justify-between">
        <Wordmark compact tagline={false} markClassName="text-xl" />
        <div className="flex items-center gap-2">
          <LanguageSwitch compact />
          <UserButton />
        </div>
      </header>

      {step === 0 && (
        <section className="flex flex-1 flex-col">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
            01
          </p>
          <h1 className="mt-2 font-display text-4xl font-medium leading-tight">
            {t("charterTitle")}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {t("charterLead")}
          </p>
          <ul className="mt-8 space-y-4 text-sm leading-relaxed text-foreground/90">
            {[t("charter1"), t("charter2"), t("charter3"), t("charter4")].map(
              (line) => (
                <li
                  key={line}
                  className="rounded-2xl border border-border bg-card px-4 py-3"
                >
                  {line}
                </li>
              ),
            )}
          </ul>
          <label className="mt-8 flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={charter}
              onChange={(e) => setCharter(e.target.checked)}
              className="mt-1 size-4 accent-[var(--color-primary)]"
            />
            <span>{t("charterAccept")}</span>
          </label>
          <Button
            className="mt-8 w-full"
            disabled={!charter}
            onClick={() => setStep(1)}
          >
            {t("continue")}
          </Button>
        </section>
      )}

      {step === 1 && (
        <section className="flex flex-1 flex-col gap-5">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
              02
            </p>
            <h1 className="mt-2 font-display text-4xl font-medium">
              {t("yourProfile")}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("profileLead")}
            </p>
          </div>
          <div className="rounded-2xl border border-primary/25 bg-primary/5 p-3 text-xs leading-relaxed text-muted-foreground">
            {t("securityNoticeSignup")}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fn">{t("displayName")}</Label>
            <Input
              id="fn"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder={t("displayNamePh")}
              autoComplete="given-name"
              maxLength={40}
            />
            <p className="text-xs text-muted-foreground">{t("displayNameHint")}</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bd">{t("birthDate")}</Label>
            <Input
              id="bd"
              type="date"
              value={birthDate}
              onChange={(e) => {
                const v = e.target.value;
                setBirthDate(v);
                if (v) setAgeBand(ageBandFromBirthDate(v));
              }}
              max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().slice(0, 10)}
            />
            <p className="text-[11px] text-muted-foreground">{t("legalIdentityPrivate")}</p>
          </div>
          <div className="space-y-1.5">
            <Label>{t("ageBand")}</Label>
            <p className="text-sm text-muted-foreground">
              {birthDate ? ageBand : t("ageBandFromBirth")}
            </p>
          </div>
          <div className="space-y-2">
            <Label>{t("gender")}</Label>
            <div className="flex flex-wrap gap-2">
              {GENDERS.map((g) => (
                <Chip key={g} active={gender === g} onClick={() => setGender(g)}>
                  {t(g)}
                </Chip>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t("lookingFor")}</Label>
            <div className="flex flex-wrap gap-2">
              {LOOKING_FOR.map((g) => (
                <Chip key={g} active={lookingFor === g} onClick={() => setLookingFor(g)}>
                  {t(g)}
                </Chip>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("country")}</Label>
              <FieldSelect value={country} onChange={setCountry}>
                {sortedCountryCodes(lang, COUNTRY_CODES).map((c) => (
                  <option key={c} value={c}>
                    {countryName(lang, c)}
                  </option>
                ))}
              </FieldSelect>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="city">{t("city")}</Label>
              <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profession">{t("profession")}</Label>
            <Input
              id="profession"
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              placeholder={t("professionPh")}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="height">{t("height")}</Label>
              <Input
                id="height"
                type="number"
                inputMode="numeric"
                min={100}
                max={250}
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="weight">{t("weight")}</Label>
              <Input
                id="weight"
                type="number"
                inputMode="numeric"
                min={30}
                max={300}
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{t("family")}</Label>
            <FieldSelect value={familyStatus} onChange={setFamilyStatus}>
              {FAMILY_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(s)}
                </option>
              ))}
            </FieldSelect>
          </div>
          <Button className="mt-2 w-full" onClick={() => setStep(2)}>
            {t("continue")}
          </Button>
        </section>
      )}

      {step === 2 && (
        <section className="flex flex-1 flex-col gap-5">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
              03
            </p>
            <h1 className="mt-2 font-display text-4xl font-medium">{t("intention")}</h1>
          </div>
          <p className="-mt-2 text-sm text-muted-foreground">
            {isFirstSignup ? t("universesLeadSignup") : t("universesLeadEdit")}
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {INTENTIONS.map((key) => {
              const Icon = UNIVERSE_ICONS[key];
              const active = universes.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleUniverse(key)}
                  className={cn(
                    "flex flex-col items-start gap-3 rounded-2xl border px-4 py-4 text-left transition-colors",
                    active
                      ? "border-primary bg-accent text-accent-foreground"
                      : "border-border bg-card text-foreground hover:border-primary/40",
                  )}
                >
                  <Icon className="size-5" strokeWidth={1.6} />
                  <span className="text-sm font-medium">NAYORA {t(key)}</span>
                  <span className="text-[11px] leading-snug opacity-80">{t(`uDesc_${key}`)}</span>
                  {active && universes[0] === key && (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                      {t("universePrimary")}
                    </span>
                  )}
                  {active && !isFirstSignup && universes[0] !== key && (
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {t("universeSubProfile")}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {!isFirstSignup && (
            <p className="text-xs text-muted-foreground">{t("universesDisableHint")}</p>
          )}
          {!isFirstSignup && (
            <p className="text-xs text-muted-foreground rounded-xl border border-border bg-secondary/30 px-3 py-2">
              {t("universesSubProfileHint")}
            </p>
          )}
          {universes.some((u) => UNIVERSES_WITH_DOMAIN.includes(u)) && (
            <div className="space-y-1.5">
              <Label>{t("proDomain")}</Label>
              <FieldSelect value={proDomain} onChange={setProDomain}>
                <option value="">{t("proDomain")}</option>
                {PRO_DOMAINS.map((d) => (
                  <option key={d} value={d}>
                    {t(d)}
                  </option>
                ))}
              </FieldSelect>
            </div>
          )}
          <UniverseProfileForm universes={universes} data={universeData} onChange={setUniverseData} />
          <div className="space-y-2">
            <Label>{t("languages")}</Label>
            <div className="flex flex-wrap gap-2">
              {sortedLanguageCodes(lang, LANGUAGE_CODES).map((code) => (
                <Chip
                  key={code}
                  active={languages.includes(code)}
                  onClick={() => toggleLanguage(code)}
                >
                  {languageName(lang, code)}
                </Chip>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bio">{t("bio")}</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t("bioPh")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">{t("phone")}</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
            />
            <p className="text-xs text-muted-foreground">{t("phoneHint")}</p>
          </div>
          <Button className="mt-2 w-full" onClick={() => setStep(3)}>
            {t("continue")}
          </Button>
        </section>
      )}

      {step === 3 && (
        <section className="flex flex-1 flex-col gap-5">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
              04
            </p>
            <h1 className="mt-2 font-display text-4xl font-medium">{t("photo")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t("photoLead")}</p>
          </div>
          <div className="flex flex-col items-center gap-4">
            <ProfilePhoto
              url={blurPhotos && photoBlurUrl ? photoBlurUrl : photoUrl}
              name={firstName || "?"}
              size="lg"
            />
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void onPickPhoto(e.target.files?.[0])}
            />
            <Button
              type="button"
              variant="outline"
              disabled={photoBusy}
              onClick={() => fileInput.current?.click()}
            >
              <Camera className="mr-2 size-4" />
              {photoBusy ? t("loading") : t("addPhoto")}
            </Button>
            {photoError && <p className="text-sm text-destructive">{photoError}</p>}
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={blurPhotos}
                onChange={(e) => setBlurPhotos(e.target.checked)}
                className="mt-1 size-4 accent-[var(--color-primary)]"
              />
              <span>{t("blurUntilMatch")}</span>
            </label>
          </div>
          <div className="space-y-1.5">
            <Label>{t("loveLanguage")}</Label>
            <FieldSelect value={loveLanguage} onChange={setLoveLanguage}>
              <option value="">{t("loveLanguage")}</option>
              {LOVE_LANGUAGES.map((l) => (
                <option key={l} value={l}>
                  {t(l)}
                </option>
              ))}
            </FieldSelect>
          </div>
          <div className="space-y-1.5">
            <Label>{t("weekendStyle")}</Label>
            <FieldSelect value={weekendStyle} onChange={setWeekendStyle}>
              <option value="">{t("weekendStyle")}</option>
              {WEEKEND_STYLES.map((w) => (
                <option key={w} value={w}>
                  {t(w)}
                </option>
              ))}
            </FieldSelect>
          </div>
          <div className="space-y-1.5">
            <Label>{t("emergencyContact")}</Label>
            <p className="text-xs text-muted-foreground">{t("emergencyHint")}</p>
            <Input
              value={emergencyName}
              onChange={(e) => setEmergencyName(e.target.value)}
              placeholder={t("emergencyName")}
            />
            <Input
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
              placeholder={t("emergencyPhone")}
              inputMode="tel"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button className="mt-2 w-full" disabled={busy} onClick={() => void submit()}>
            {busy ? t("loading") : t("saveProfile")}
          </Button>
        </section>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm transition-colors",
        active
          ? "border-primary bg-accent text-accent-foreground"
          : "border-border bg-card text-muted-foreground hover:border-primary/40",
      )}
    >
      {children}
    </button>
  );
}
