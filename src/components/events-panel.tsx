import { useCallback, useEffect, useState } from "react";
import { Calendar, MapPin, Users } from "lucide-react";
import { listUpcomingEvents, rsvpEvent, type EventRow } from "@/lib/events";
import { createEvent, getMyStaffRole } from "@/lib/admin";
import { COUNTRY_CODES, INTENTIONS } from "@/lib/constants";
import { countryName, sortedCountryCodes } from "@/lib/i18n";
import { useLang } from "@/lib/lang";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FieldSelect } from "@/components/field-select";
import { CirclesSection } from "@/components/circles-panel";

export function EventsPanel() {
  const { t, lang } = useLang();
  const [events, setEvents] = useState<EventRow[] | null>(null);
  const [isStaff, setIsStaff] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [universeFilter, setUniverseFilter] = useState<string>("all");

  const load = useCallback(async () => {
    setEvents(await listUpcomingEvents());
  }, []);

  useEffect(() => {
    void load();
    getMyStaffRole()
      .then((r) => setIsStaff(r.role !== "user"))
      .catch(() => setIsStaff(false));
  }, [load]);

  return (
    <div className="page-panel">
      <CirclesSection />
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium">{t("eventsTitle")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("eventsLead")}</p>
        </div>
        {isStaff && (
          <Button size="sm" variant="outline" onClick={() => setShowForm((v) => !v)}>
            {t("eventsCreate")}
          </Button>
        )}
      </div>

      {showForm && <CreateEventForm onCreated={() => { setShowForm(false); void load(); }} />}

      <div className="mb-4 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setUniverseFilter("all")}
          className={`rounded-full border px-3 py-1.5 text-xs min-h-[2.5rem] ${
            universeFilter === "all" ? "border-primary bg-primary/10 text-primary" : "border-border"
          }`}
        >
          {t("all")}
        </button>
        {INTENTIONS.map((u) => (
          <button
            key={u}
            type="button"
            onClick={() => setUniverseFilter(u)}
            className={`rounded-full border px-3 py-1.5 text-xs min-h-[2.5rem] ${
              universeFilter === u ? "border-primary bg-primary/10 text-primary" : "border-border"
            }`}
          >
            {t(u)}
          </button>
        ))}
      </div>

      {events === null ? (
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      ) : events.filter((ev) => universeFilter === "all" || ev.universe === universeFilter || (!ev.universe && universeFilter === "all")).length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("eventsEmpty")}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {events
            .filter((ev) => universeFilter === "all" || ev.universe === universeFilter)
            .map((e) => (
            <div key={e.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display text-xl">{e.title}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Calendar className="size-3.5" />
                    {new Date(e.startsAt).toLocaleString(lang, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="size-3.5" />
                    {e.city}, {countryName(lang, e.country)}
                  </p>
                </div>
                <Badge tone="primary">
                  <Users className="mr-1 size-3" />
                  {e.attendeeCount}
                  {e.capacity ? `/${e.capacity}` : ""}
                </Badge>
              </div>
              {e.universe && (
                <Badge className="mt-2">{t(e.universe)}</Badge>
              )}
              {e.description && (
                <p className="mt-2 text-sm text-foreground/85">{e.description}</p>
              )}
              <Button
                size="sm"
                className="mt-3"
                variant={e.going ? "outline" : "default"}
                onClick={async () => {
                  await rsvpEvent({ data: { eventId: e.id, going: !e.going } });
                  await load();
                }}
              >
                {e.going ? t("eventsCancel") : t("eventsJoin")}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateEventForm({ onCreated }: { onCreated: () => void }) {
  const { t, lang } = useLang();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("CI");
  const [startsAt, setStartsAt] = useState("");
  const [capacity, setCapacity] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="mb-5 flex flex-col gap-3 rounded-2xl border border-border bg-card p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!title.trim() || !city.trim() || !startsAt) return;
        setBusy(true);
        try {
          await createEvent({
            data: {
              title,
              description,
              city,
              country,
              startsAt: new Date(startsAt).toISOString(),
              capacity: capacity ? Number(capacity) : null,
            },
          });
          setTitle("");
          setDescription("");
          setCity("");
          setStartsAt("");
          setCapacity("");
          onCreated();
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="space-y-1.5">
        <Label>{t("eventsTitleField")}</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>{t("bio")}</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>{t("city")}</Label>
          <Input value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
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
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>{t("eventsWhen")}</Label>
          <Input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t("eventsCapacity")}</Label>
          <Input
            type="number"
            inputMode="numeric"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          />
        </div>
      </div>
      <Button type="submit" disabled={busy}>
        {busy ? t("loading") : t("eventsPublish")}
      </Button>
    </form>
  );
}
