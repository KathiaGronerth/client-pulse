/*
  Regression test for the Health Score engine.

  Asserts that each fixture client reproduces the exact score + penalty
  breakdown the prototype originally shipped with hardcoded values. These
  fixtures ARE the contract: if a scoring rule changes, this fails loudly.

  Run:  node lib/scoring.test.mjs
*/

import { computeHealthScore } from "./scoring.js";

// Minimal fields each rule depends on, plus the originally-hardcoded expected
// outputs. Kept in sync with app/ClientPulse.jsx.
const FIXTURES = [
  { name: "Thomas R. Bradley",  daysSince: 73,  contactCadenceTarget: 60, riskActual: 61, riskTarget: 50, openTasks: 2, taskDaysOverdue: 32, lifeEvent: null,                expect: { score: 23, engPenalty: -25, riskPenalty: -20, taskPenalty: -20, lifePenalty: -12 } },
  { name: "Robert T. Chen",     daysSince: 128, contactCadenceTarget: 90, riskActual: 58, riskTarget: 55, openTasks: 3, taskDaysOverdue: 22, lifeEvent: "Retirement review", expect: { score: 37, engPenalty: -35, riskPenalty: -5,  taskPenalty: -20, lifePenalty: -3  } },
  { name: "Margaret A. Johnson",daysSince: 93,  contactCadenceTarget: 90, riskActual: 62, riskTarget: 45, openTasks: 2, taskDaysOverdue: 12, lifeEvent: "Birthday",          expect: { score: 47, engPenalty: -5,  riskPenalty: -30, taskPenalty: -15, lifePenalty: -3  } },
  { name: "Diana L. Morales",   daysSince: 54,  contactCadenceTarget: 60, riskActual: 51, riskTarget: 35, openTasks: 1, taskDaysOverdue: 5,  lifeEvent: null,                expect: { score: 51, engPenalty: -1,  riskPenalty: -29, taskPenalty: -7,  lifePenalty: -12 } },
  { name: "Carlos & Maria Reyes",daysSince: 80, contactCadenceTarget: 90, riskActual: 59, riskTarget: 52, openTasks: 1, taskDaysOverdue: 46, lifeEvent: "Birthday",          expect: { score: 63, engPenalty: -1,  riskPenalty: -13, taskPenalty: -20, lifePenalty: -3  } },
  { name: "William J. Thompson",daysSince: 18,  contactCadenceTarget: 90, riskActual: 44, riskTarget: 40, openTasks: 1, taskDaysOverdue: 0,  lifeEvent: null,                expect: { score: 75, engPenalty: -1,  riskPenalty: -7,  taskPenalty: -5,  lifePenalty: -12 } },
  { name: "Elena M. Gutierrez", daysSince: 10,  contactCadenceTarget: 90, riskActual: 56, riskTarget: 55, openTasks: 0, taskDaysOverdue: 0,  lifeEvent: null,                expect: { score: 85, engPenalty: -1,  riskPenalty: -2,  taskPenalty: 0,   lifePenalty: -12 } },
  { name: "David & Lisa Kim",   daysSince: 3,   contactCadenceTarget: 90, riskActual: 48, riskTarget: 48, openTasks: 0, taskDaysOverdue: 0,  lifeEvent: null,                expect: { score: 87, engPenalty: -1,  riskPenalty: 0,   taskPenalty: 0,   lifePenalty: -12 } },
];

const KEYS = ["score", "engPenalty", "riskPenalty", "taskPenalty", "lifePenalty"];

let failures = 0;
for (const f of FIXTURES) {
  const got = computeHealthScore(f);
  const diffs = KEYS.filter((k) => got[k] !== f.expect[k]);
  if (diffs.length === 0) {
    console.log(`  ✓ ${f.name} — score ${got.score}`);
  } else {
    failures++;
    console.log(`  ✗ ${f.name}`);
    for (const k of diffs) console.log(`      ${k}: expected ${f.expect[k]}, got ${got[k]}`);
  }
}

if (failures > 0) {
  console.error(`\n${failures} fixture(s) failed.`);
  process.exit(1);
}
console.log(`\nAll ${FIXTURES.length} fixtures reproduce their expected scores exactly.`);
