import test from "node:test";
import assert from "node:assert/strict";
import {
  scoreUniverse,
  sanitizeUniverseData,
  parseUniverseData,
  loveReasons,
  fieldsFor,
  loveDealbreaker,
  travelIncompatible,
  cleanText,
} from "../src/lib/universe-match.ts";

const base = { country: "CI", city: "Abidjan", ageBand: "30-34", languages: ["fr"], proDomain: "tech", loveLanguage: null, weekendStyle: null, universeData: {} };
const P = (o) => ({ ...base, ...o, universeData: o.universeData ?? {} });

test("Pro : objectifs complémentaires > objectifs identiques non complémentaires", () => {
  const me = P({ universeData: { proGoal: "mentor_cherche" } });
  const mentor = P({ universeData: { proGoal: "mentor_offre" } });
  const peer = P({ universeData: { proGoal: "mentor_cherche" } });
  const a = scoreUniverse("professionnel", me, mentor);
  const b = scoreUniverse("professionnel", me, peer);
  assert.ok(a.score > b.score);
  assert.ok(a.reasons.includes("r_complement"));
  assert.ok(!b.reasons.includes("r_complement"));
});

test("Pro : recruteur ↔ candidat, associé ↔ associé", () => {
  const rec = P({ universeData: { proGoal: "recrute" } });
  const cand = P({ universeData: { proGoal: "emploi" } });
  assert.ok(scoreUniverse("professionnel", rec, cand).reasons.includes("r_complement"));
  const a1 = P({ universeData: { proGoal: "associe" } });
  assert.ok(scoreUniverse("professionnel", a1, a1).reasons.includes("r_complement"));
});

test("Friends : plus d'intérêts communs → meilleur score", () => {
  const me = P({ universeData: { interests: ["sport", "musique", "cuisine"] } });
  const close = P({ universeData: { interests: ["sport", "musique"] } });
  const far = P({ universeData: { interests: ["tech"] } });
  assert.ok(scoreUniverse("amitie", me, close).score > scoreUniverse("amitie", me, far).score);
  assert.ok(scoreUniverse("amitie", me, close).reasons.includes("r_sharedInterests"));
});

test("Travel : destinations, styles et période", () => {
  const me = P({ universeData: { travelStyles: ["culture", "aventure"], travelDestinations: ["MA", "SN"], travelWhen: "3m" } });
  const twin = P({ universeData: { travelStyles: ["culture"], travelDestinations: ["MA"], travelWhen: "3m" } });
  const other = P({ universeData: { travelStyles: ["detente"], travelDestinations: ["FR"], travelWhen: "annee" } });
  const s = scoreUniverse("voyage", me, twin);
  assert.ok(s.score > scoreUniverse("voyage", me, other).score);
  assert.deepEqual(s.reasons.sort(), ["r_destinations", "r_timing", "r_travelStyle"]);
});

test("Projects : porteur ↔ rejoindre, compétences croisées", () => {
  const me = P({ universeData: { projectRole: "porteur", skillsWant: ["tech"] } });
  const dev = P({ universeData: { projectRole: "rejoindre", skillsOffer: ["tech"] } });
  const r = scoreUniverse("projets", me, dev);
  assert.ok(r.reasons.includes("r_complement") && r.reasons.includes("r_skills"));
  const mentor = P({ universeData: { projectRole: "transmettre" } });
  const learner = P({ universeData: { projectRole: "apprendre" } });
  assert.ok(scoreUniverse("projets", mentor, learner).reasons.includes("r_complement"));
});

test("scores bornés 24–98 et profils sans données = score de base", () => {
  const s = scoreUniverse("professionnel", P({}), P({ country: "FR", city: "Paris", languages: ["en"], proDomain: "sante" }));
  assert.ok(s.score >= 24 && s.score <= 98);
});

test("Love : raisons issues du langage de l'amour et du rythme de vie", () => {
  const a = P({ loveLanguage: "temps", weekendStyle: "maison" });
  const r = loveReasons(a, P({ loveLanguage: "temps", weekendStyle: "maison" }));
  assert.deepEqual(r.reasons.slice(0, 2), ["r_loveLang", "r_weekend"]);
});

test("formulaire adaptatif : les champs changent selon l'objectif", () => {
  const keys = (d) => fieldsFor("professionnel", d).map((f) => f.key);
  assert.deepEqual(keys({}), ["meetFormat"]);
  assert.deepEqual(keys({ proGoal: "recrute" }), ["meetFormat", "focusDomains", "contractTypes"]);
  assert.deepEqual(keys({ proGoal: "associe" }), ["meetFormat", "focusDomains", "proStage", "proNeed"]);
  assert.deepEqual(keys({ proGoal: "mentor_offre" }), ["meetFormat", "focusDomains", "proExperience"]);
  assert.ok(fieldsFor("voyage", { travelGoal: "guide" }).some((f) => f.label === "lbl_destGuideOffer"));
  assert.ok(fieldsFor("voyage", { travelGoal: "chercher_guide" }).some((f) => f.label === "lbl_destGuideWanted"));
  assert.deepEqual(fieldsFor("projets", { projectRole: "apprendre" }).map((f) => f.key), ["projectCause", "skillsWant", "learnFormat"]);
  assert.ok(fieldsFor("mariage", {}).some((f) => f.key === "religion") && !fieldsFor("mariage", {}).some((f) => f.key === "polygamy"));
});

test("sanitize : changer d'objectif retire les réponses devenues sans objet", () => {
  const opts = { domains: ["tech", "finance"], countries: ["MA", "CI"], universes: ["professionnel", "voyage"] };
  const out = sanitizeUniverseData(
    { proGoal: "recrute", focusDomains: ["tech"], contractTypes: ["cdi"], proStage: "idee", proNeed: ["reseau"], travelGoal: "guide", travelDestinations: ["CI"], travelWhen: "3m", travelBudget: "eco", interests: ["sport"] },
    opts,
  );
  assert.equal(out.proStage, undefined);
  assert.equal(out.proNeed, undefined);
  assert.deepEqual(out.contractTypes, ["cdi"]);
  assert.equal(out.travelWhen, undefined);
  assert.equal(out.travelBudget, undefined);
  assert.deepEqual(out.travelDestinations, ["CI"]);
  assert.equal(out.interests, undefined); // univers Friends non choisi
});

test("Pro : recruteur ↔ candidat avec contrat compatible", () => {
  const rec = P({ universeData: { proGoal: "recrute", focusDomains: ["tech"], contractTypes: ["freelance"] } });
  const ok = P({ universeData: { proGoal: "emploi", focusDomains: ["tech"], contractTypes: ["freelance", "cdi"] } });
  const ko = P({ universeData: { proGoal: "emploi", focusDomains: ["sante"], contractTypes: ["stage"] } });
  const a = scoreUniverse("professionnel", rec, ok);
  assert.ok(a.score > scoreUniverse("professionnel", rec, ko).score);
  assert.ok(a.reasons.includes("r_contract") && a.reasons.includes("r_sameDomain"));
});

test("Pro : mentor cherché ↔ mentor offert sur le même domaine", () => {
  const me = P({ universeData: { proGoal: "mentor_cherche", focusDomains: ["tech"] } });
  const mentor = P({ universeData: { proGoal: "mentor_offre", focusDomains: ["tech", "finance"] } });
  const other = P({ universeData: { proGoal: "mentor_offre", focusDomains: ["sante"] } });
  assert.ok(scoreUniverse("professionnel", me, mentor).score > scoreUniverse("professionnel", me, other).score);
});

test("Travel : un guide local pour MA correspond au voyageur qui cherche un guide pour MA", () => {
  const traveller = P({ universeData: { travelGoal: "chercher_guide", travelDestinations: ["MA"] } });
  const guide = P({ universeData: { travelGoal: "guide", travelDestinations: ["MA", "SN"] } });
  const wrongPlace = P({ universeData: { travelGoal: "guide", travelDestinations: ["FR"] } });
  const buddy = P({ universeData: { travelGoal: "compagnon", travelDestinations: ["MA"] } });
  const g = scoreUniverse("voyage", traveller, guide);
  assert.ok(g.reasons.includes("r_guide"));
  assert.ok(g.score > scoreUniverse("voyage", traveller, wrongPlace).score);
  assert.ok(g.score > scoreUniverse("voyage", traveller, buddy).score);
});

test("Friends : même objectif communauté + même type de communauté", () => {
  const far = { country: "SN", city: "Dakar", languages: ["en"] };
  const a = P({ universeData: { friendGoal: "communaute", communityType: "diaspora", interests: ["sport", "musique", "tech"] } });
  const same = P({ ...far, universeData: { friendGoal: "communaute", communityType: "diaspora", interests: ["sport", "jeux", "lecture"] } });
  const diff = P({ ...far, universeData: { friendGoal: "communaute", communityType: "foi", interests: ["sport", "jeux", "lecture"] } });
  assert.ok(scoreUniverse("amitie", a, same).reasons.includes("r_community"));
  assert.ok(scoreUniverse("amitie", a, same).score > scoreUniverse("amitie", a, diff).score);
});

test("Love : même horizon de vie → bonus et raison", () => {
  const a = P({ universeData: { loveHorizon: "1an" } });
  const r = loveReasons(a, P({ universeData: { loveHorizon: "1an" } }));
  assert.equal(r.score, 6);
  assert.equal(r.reasons[0], "r_horizon");
  assert.equal(loveReasons(a, P({ universeData: { loveHorizon: "3ans" } })).score, 0);
});

test("Love : modèle d'annonce (religion, polygamie, âge, taille, valeurs)", () => {
  const her = P({ ageBand: "30-34", heightCm: 170, universeData: { loveGoal: "mariage", religion: "protestant", faithPractice: "pratiquant", religionImportance: "essentiel", polygamy: "non", partnerAgeMin: 34, partnerAgeMax: 38, partnerMinHeight: 172, partnerValues: ["foi", "fidelite"], hasChildren: "none", wantsChildren: "yes" } });
  const good = P({ ageBand: "35-39", heightCm: 178, universeData: { loveGoal: "mariage", religion: "protestant", faithPractice: "pratiquant", polygamy: "non", values: ["foi", "famille"], wantsChildren: "yes" } });
  const r = loveReasons(her, good);
  assert.ok(r.score >= 25, "bonus élevé pour un profil qui coche toutes les cases : " + r.score);
  assert.ok(r.reasons.includes("r_sameFaith"));
  assert.equal(loveDealbreaker(her, good), false);
  // trop jeune + trop petit → malus
  const young = P({ ageBand: "25-29", heightCm: 165, universeData: { religion: "protestant", polygamy: "non" } });
  assert.ok(loveReasons(her, young).score < r.score - 15);
});

test("Love : incompatibilités rédhibitoires (polygamie, religion essentielle)", () => {
  const no = P({ universeData: { polygamy: "non" } });
  const yes = P({ universeData: { polygamy: "oui" } });
  assert.equal(loveDealbreaker(no, yes), true);
  assert.equal(loveDealbreaker(yes, no), true);
  assert.equal(loveDealbreaker(no, P({ universeData: { polygamy: "discuter" } })), false);
  const ess = P({ universeData: { religion: "musulman", religionImportance: "essentiel" } });
  assert.equal(loveDealbreaker(ess, P({ universeData: { religion: "protestant" } })), true);
  assert.equal(loveDealbreaker(ess, P({ universeData: { religion: "musulman" } })), false);
  assert.equal(loveDealbreaker(ess, P({ universeData: {} })), false); // religion non renseignée : pas de blocage
  const soft = P({ universeData: { religion: "musulman", religionImportance: "souhaite" } });
  assert.equal(loveDealbreaker(soft, P({ universeData: { religion: "protestant" } })), false);
});

test("Love : désaccord sur les enfants → malus", () => {
  const a = P({ universeData: { wantsChildren: "yes" } });
  assert.ok(loveReasons(a, P({ universeData: { wantsChildren: "no" } })).score < 0);
});

test("Travel : cercle réservé aux femmes", () => {
  const w = P({ gender: "femme", universeData: { companionGender: "femmes" } });
  assert.equal(travelIncompatible(w, P({ gender: "homme", universeData: {} })), true);
  assert.equal(travelIncompatible(P({ gender: "homme", universeData: {} }), w), true);
  assert.equal(travelIncompatible(w, P({ gender: "femme", universeData: {} })), false);
  assert.equal(travelIncompatible(P({ gender: "homme", universeData: {} }), P({ gender: "homme", universeData: {} })), false);
});

test("textes libres : liens, e-mails et téléphones retirés", () => {
  assert.equal(cleanText("Écris-moi sur https://wa.me/22670000000 ou a@b.com, 70 12 34 56 78 merci", 240), "Écris-moi sur ou merci");
  assert.equal(cleanText("x".repeat(500), 240).length, 240);
  assert.equal(cleanText(42, 10), "");
});

test("sanitize : champs numériques et texte du formulaire Love", () => {
  const opts = { domains: [], countries: [], universes: ["mariage"] };
  const out = sanitizeUniverseData(
    { loveGoal: "mariage", religion: "protestant", partnerAgeMin: "38", partnerAgeMax: 34, partnerMinHeight: 300, lookingForText: "Un homme sérieux https://x.y", polygamy: "non", wantsChildren: "yes", values: ["foi", "foi", "zzz"] },
    opts,
  );
  assert.equal(out.partnerAgeMin, 34); // min/max réordonnés
  assert.equal(out.partnerAgeMax, 38);
  assert.equal(out.partnerMinHeight, undefined); // hors bornes
  assert.equal(out.lookingForText, "Un homme sérieux");
  assert.deepEqual(out.values, ["foi"]);
  assert.equal(out.polygamy, "non");
  const serieuse = sanitizeUniverseData({ loveGoal: "serieuse", polygamy: "non", wantsChildren: "yes", religion: "musulman" }, opts);
  assert.equal(serieuse.polygamy, undefined); // propre au mariage
  assert.equal(serieuse.wantsChildren, undefined);
  assert.equal(serieuse.religion, "musulman");
});

test("formulaire Love : groupes ordonnés et polygamie seulement pour le mariage", () => {
  const groups = (d) => fieldsFor("mariage", d).map((f) => f.group);
  const order = groups({ loveGoal: "mariage" });
  assert.deepEqual([...new Set(order)], ["lbl_g_about", "lbl_g_values", "lbl_g_seeking"]);
  const keys = fieldsFor("mariage", { loveGoal: "mariage" }).map((f) => f.key);
  assert.ok(keys.includes("polygamy") && keys.includes("wantsChildren"));
  assert.ok(!fieldsFor("mariage", { loveGoal: "serieuse" }).some((f) => f.key === "polygamy"));
  assert.ok(keys.indexOf("polygamy") < keys.indexOf("loveHorizon"), "polygamie dans le groupe Foi & valeurs, avant « recherché »");
});

test("sanitizeUniverseData : listes blanches et limites", () => {
  const out = sanitizeUniverseData(
    { proGoal: "hack", interests: ["sport", "sport", "x", "musique", "cuisine", "culture", "tech", "nature", "jeux"], travelGoal: "compagnon", travelDestinations: ["MA", "ZZ", "SN", "FR", "CI"], projectRole: "rejoindre", skillsOffer: ["tech", "nope"] },
    { domains: ["tech", "sante"], countries: ["MA", "SN", "FR", "CI"] },
  );
  assert.equal(out.proGoal, undefined);
  assert.equal(out.interests.length, 6);
  assert.deepEqual(out.travelDestinations, ["MA", "SN", "FR"]);
  assert.deepEqual(out.skillsOffer, ["tech"]);
  assert.equal(out.projectRole, "rejoindre");
});

test("parseUniverseData : tolère chaîne JSON, objet, null", () => {
  assert.deepEqual(parseUniverseData('{"proGoal":"associe"}'), { proGoal: "associe" });
  assert.deepEqual(parseUniverseData(null), {});
  assert.deepEqual(parseUniverseData("oops"), {});
});
