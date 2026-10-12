import test from "node:test";
import assert from "node:assert/strict";
import {
  ABUSE_PATTERN,
  containsPhoneNumber,
  SCAM_HARD_PATTERN,
  SCAM_SOFT_PATTERN,
  trustRules,
} from "../src/lib/constants.ts";
import { ageBandFromBirthDate, ageFromBirthDate, stripPrivateIdentity } from "../src/lib/privacy.ts";

test("numéros de téléphone : bloqués sous toutes les formes courantes", () => {
  for (const t of [
    "Appelle-moi 07 12 34 56 78",
    "mon num +225 07 12 34 56 78",
    "00221 77 123 45 67",
    "70123456",
    "(+33) 6.12.34.56.78",
    "écris-moi au 07-12-34-56-78",
    "+225 077 123 456",
    "0033 6 12 34 56 78",
  ])
    assert.equal(containsPhoneNumber(t), true, t);
});

test("dates et montants ne sont PAS pris pour des numéros", () => {
  for (const t of [
    "Le capital est de 5 000 000 FCFA",
    "On cherche 10 000 000 FCFA de financement",
    "Rdv le 12.10.2026 à 14h",
    "Rdv le 12-10-2026",
    "Réunion le 12/10/2026",
    "Budget : 12.500.000 pour la phase 1",
    "Le prix est de 50000000 FCFA",
    "J'ai 34 ans et 2 enfants, 1m72",
    "Je gagne 1,500,000 par an",
    "Ouverture 2026, 14h30",
    "Budget 12 500 000 FCFA, puis 3.000.000",
  ])
    assert.equal(containsPhoneNumber(t), false, t);
});

test("arnaques sans ambiguïté : bloquées ; termes ambigus : pas bloqués", () => {
  for (const t of ["Envoie-moi de l'argent par Western Union", "achète une carte cadeau iTunes card", "send me money", "paypal me", "virement urgent stp"])
    assert.equal(SCAM_HARD_PATTERN.test(t), true, t);
  for (const t of ["Mon projet : une fintech crypto pour la diaspora", "Le prix du bitcoin monte", "Besoin d'argent pour mon projet agricole", "On lève des fonds, USDT et mobile money"])
    assert.equal(SCAM_HARD_PATTERN.test(t), false, t);
  for (const t of ["Mon projet : une fintech crypto pour la diaspora", "J'ai besoin d'argent", "usdt"]) assert.equal(SCAM_SOFT_PATTERN.test(t), true, t);
});

test("insultes : bloquées sans faux positifs courants", () => {
  assert.equal(ABUSE_PATTERN.test("espèce de connard"), true);
  assert.equal(ABUSE_PATTERN.test("Bonjour, enchanté de faire ta connaissance"), false);
  assert.equal(ABUSE_PATTERN.test("Je suis pd à Dakar ?"), true);
  assert.equal(ABUSE_PATTERN.test("Le projet pédagogique avance"), false);
});

test("délais de confiance : stricts dans Love, allégés ailleurs", () => {
  assert.deepEqual(trustRules(["mariage"], ["mariage", "amitie"]), { hours: 72, minMessages: 4, strict: true });
  assert.deepEqual(trustRules(["professionnel"], ["professionnel"]), { hours: 24, minMessages: 2, strict: false });
  assert.equal(trustRules(["mariage"], ["professionnel"]).strict, false);
  assert.equal(trustRules([], []).hours, 24);
});

test("âge : calcul exact, 18 ans minimum, dates invalides rejetées", () => {
  const now = new Date("2026-10-11T12:00:00Z");
  assert.equal(ageFromBirthDate("2008-10-11", now), 18);
  assert.equal(ageFromBirthDate("2008-10-12", now), 17);
  assert.equal(ageFromBirthDate("1990-02-28", now), 36);
  assert.equal(ageFromBirthDate("2026-02-30", now), -1);
  assert.equal(ageFromBirthDate("n'importe quoi", now), -1);
  assert.equal(ageBandFromBirthDate("2000-01-01", now), "25-29");
  assert.equal(ageBandFromBirthDate("1970-01-01", now), "50+");
  assert.equal(ageBandFromBirthDate("2008-10-11", now), "18-24");
});

test("profil envoyé à un autre membre : ni téléphone ni date de naissance", () => {
  const me = { firstName: "Amina", phone: "+22507123456", birthDate: "1995-03-04", city: "Abidjan" };
  const out = stripPrivateIdentity(me);
  assert.equal(out.phone, null);
  assert.equal(out.birthDate, null);
  assert.equal(out.firstName, "Amina");
  assert.equal(me.phone, "+22507123456");
});
