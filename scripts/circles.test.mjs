import test from "node:test";
import assert from "node:assert/strict";
import { circleSizes, composeCircles, venueVisible } from "../src/lib/circles.ts";

test("tailles : 4 à 6, réparties, jamais moins de 4", () => {
  assert.deepEqual(circleSizes(3), { sizes: [], leftover: 3 });
  assert.deepEqual(circleSizes(4).sizes, [4]);
  assert.deepEqual(circleSizes(6).sizes, [6]);
  assert.deepEqual(circleSizes(7).sizes, [6]);
  assert.deepEqual(circleSizes(8).sizes, [4, 4]);
  assert.deepEqual(circleSizes(11).sizes, [6, 5]);
  assert.deepEqual(circleSizes(13).sizes, [5, 4, 4]);
  for (let n = 4; n <= 60; n++) {
    const { sizes, leftover } = circleSizes(n);
    assert.ok(sizes.every((s) => s >= 4 && s <= 6), `n=${n} → ${sizes}`);
    assert.equal(sizes.reduce((a, b) => a + b, 0) + leftover, n);
    assert.ok(leftover <= 3, `n=${n} leftover=${leftover}`);
  }
});

const cand = (id, o = {}) => ({ userId: id, city: "Abidjan", country: "CI", womenOnly: false, order: Number(id.slice(1)), ...o });

test("les villes et les cercles femmes/mixtes ne se mélangent pas", () => {
  const list = [
    ...[1, 2, 3, 4].map((i) => cand("a" + i)),
    ...[5, 6, 7, 8].map((i) => cand("b" + i, { city: "Dakar", country: "SN" })),
    ...[9, 10, 11, 12].map((i) => cand("w" + i, { womenOnly: true })),
    cand("z13", { city: "Lomé", country: "TG" }),
  ];
  const { circles, waiting } = composeCircles(list, () => 50);
  assert.equal(circles.length, 3);
  assert.deepEqual(waiting, ["z13"]);
  for (const c of circles) {
    assert.ok(c.memberIds.length >= 4 && c.memberIds.length <= 6);
  }
});

test("regroupe par affinité : deux clans d'intérêts → deux cercles", () => {
  const clanA = ["a1", "a2", "a3", "a4"].map((id) => cand(id));
  const clanB = ["b5", "b6", "b7", "b8"].map((id) => cand(id));
  const list = [clanA[0], clanB[0], clanA[1], clanB[1], clanA[2], clanB[2], clanA[3], clanB[3]].map((c, i) => ({ ...c, order: i }));
  const affinity = (x, y) => (x[0] === y[0] ? 90 : 20);
  const { circles } = composeCircles(list, affinity);
  assert.equal(circles.length, 2);
  for (const c of circles) {
    assert.equal(new Set(c.memberIds.map((m) => m[0])).size, 1, "clan homogène : " + c.memberIds);
    assert.equal(c.affinity, 90);
  }
});

test("moins de 4 personnes : personne n'est placé", () => {
  const { circles, waiting } = composeCircles([cand("a1"), cand("a2"), cand("a3")], () => 50);
  assert.equal(circles.length, 0);
  assert.equal(waiting.length, 3);
});

test("le lieu n'est révélé qu'à la date prévue", () => {
  const reveal = new Date("2026-10-10T08:00:00Z");
  assert.equal(venueVisible(reveal, new Date("2026-10-10T07:59:00Z")), false);
  assert.equal(venueVisible(reveal, new Date("2026-10-10T08:00:00Z")), true);
});
