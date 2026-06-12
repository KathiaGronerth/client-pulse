/*
  Round-trip test for the data-source adapter layer.

  Asserts that MockAdapter's fixtures + transform reproduce the exact flat
  client objects the prototype originally shipped — same fields, same values,
  no extras. This is the guarantee that swapping the hardcoded array for the
  adapter pipeline left the UI (and the scores derived from it) unchanged.

  Run:  node lib/data/data.test.mjs
  (Reads fixtures via fs and calls the pure transform directly — no JSON-import
   attributes needed, and no dependency on the webpack bundling path.)
*/

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { resolveContacts, buildDashboardClients } from "./transform.js";

const here = dirname(fileURLToPath(import.meta.url));
const readJson = (p) => JSON.parse(readFileSync(join(here, p), "utf8"));

const contactsEnvelope = readJson("fixtures/redtail-contacts.json");
const lookups = readJson("fixtures/redtail-lookups.json");
const riskEnvelope = readJson("fixtures/nitrogen-risk.json");

const built = buildDashboardClients(
  resolveContacts(contactsEnvelope.contacts, lookups),
  riskEnvelope.data,
  contactsEnvelope.meta.as_of,
);

// Golden snapshot: the original hardcoded client objects (flat view-model),
// minus the score/penalty fields that lib/scoring.js now computes at runtime.
const GOLDEN = [
  { id: 234, name: "Thomas R. Bradley", preferredName: "Tom", status: "Active Client", category: "Client", dateOfBirth: "04/30/1960", maritalStatus: "Married", servicingAdvisor: "Carl Canga", clientSince: "06/10/2014", nextReview: "Overdue", lastActivity: "Feb 1, 2026", pastDueActivities: 2, activeWorkflows: 1, portfolioBalance: 1890000, lastActivityType: "Appointment", lastActivitySubject: "Annual Review - Tom & Joan Bradley", lastActivityNotes: "Tom concerned about inflation impact on fixed income allocation. Discussed TIPS. Need to model inflation scenarios. Joan wants to review estate documents.", daysSince: 73, contactCadenceTarget: 60, clientTier: "Platinum", lifeGoal: "Retirement income + Inflation protection", openTasks: 2, taskDaysOverdue: 32, oldestTaskSubject: "Model inflation scenarios for TIPS allocation", riskTarget: 50, riskActual: 61, riskGap: 11, riskStatus: "Misaligned", downside6mo: "-$208,700", probSuccess: 87, riskTrend: "Increasing (+6)", reason: "73 days no contact + risk drift + 2 overdue tasks", lifeEvent: null, lifeEventDate: null, advisorNote: "HNW client. Reads financial news daily. Expects proactive outreach. Prefers in-person meetings." },
  { id: 187, name: "Robert T. Chen", preferredName: "Bob", status: "Active Client", category: "Client", dateOfBirth: "11/03/1962", maritalStatus: "Married", servicingAdvisor: "Carl Canga", clientSince: "08/20/2017", nextReview: "Overdue", lastActivity: "Dec 8, 2025", pastDueActivities: 3, activeWorkflows: 1, portfolioBalance: 1250000, lastActivityType: "Appointment", lastActivitySubject: "Pre-retirement planning session", lastActivityNotes: "Reviewed pension + Social Security timing. Committed to send retirement income projection. Bob wants to retire at 63 — 18 months away.", daysSince: 128, contactCadenceTarget: 90, clientTier: "Platinum", lifeGoal: "Retirement at 63", openTasks: 3, taskDaysOverdue: 22, oldestTaskSubject: "Send retirement income projection", riskTarget: 55, riskActual: 58, riskGap: 3, riskStatus: "Aligned", downside6mo: "-$112,500", probSuccess: 85, riskTrend: "Stable", reason: "128 days no contact — retirement review imminent", lifeEvent: "Retirement review", lifeEventDate: "May 1", advisorNote: "Detail-oriented. Wants specific numbers, not general advice. Retiring in 18 months." },
  { id: 156, name: "Margaret A. Johnson", preferredName: "Margaret", status: "Active Client", category: "Client", dateOfBirth: "06/15/1958", maritalStatus: "Married", servicingAdvisor: "Carl Canga", clientSince: "03/15/2019", nextReview: "-", lastActivity: "Jan 12, 2026", pastDueActivities: 2, activeWorkflows: 0, portfolioBalance: 485000, lastActivityType: "Phone Call", lastActivitySubject: "College fund discussion - daughter Lisa", lastActivityNotes: "Discussed daughter Lisa's college fund. Agreed to review 529 allocation. Margaret concerned about market volatility after recent news.", daysSince: 93, contactCadenceTarget: 90, clientTier: "Gold", lifeGoal: "Retirement + Education", openTasks: 2, taskDaysOverdue: 12, oldestTaskSubject: "Update beneficiary forms", riskTarget: 45, riskActual: 62, riskGap: 17, riskStatus: "Misaligned", downside6mo: "-$58,200", probSuccess: 72, riskTrend: "Increasing (+5)", reason: "Risk drift 45→62 + birthday in 6 days", lifeEvent: "Birthday", lifeEventDate: "Apr 22", advisorNote: "Prefers morning calls. Conservative investor, worries about downside risk." },
  { id: 198, name: "Diana L. Morales", preferredName: "Diana", status: "Active Client", category: "Client", dateOfBirth: "03/22/1975", maritalStatus: "Single", servicingAdvisor: "Carl Canga", clientSince: "01/10/2021", nextReview: "-", lastActivity: "Feb 20, 2026", pastDueActivities: 1, activeWorkflows: 0, portfolioBalance: 320000, lastActivityType: "Phone Call", lastActivitySubject: "Post-dip reallocation discussion", lastActivityNotes: "Diana anxious about losses after Feb market dip. Discussed conservative reallocation. Committed to review bond allocation options.", daysSince: 54, contactCadenceTarget: 60, clientTier: "Silver", lifeGoal: "Wealth preservation", openTasks: 1, taskDaysOverdue: 5, oldestTaskSubject: "Review bond allocation options", riskTarget: 35, riskActual: 51, riskGap: 16, riskStatus: "Misaligned", downside6mo: "-$48,000", probSuccess: 68, riskTrend: "Increasing (+8)", reason: "Conservative client — significant risk drift (35→51)", lifeEvent: null, lifeEventDate: null, advisorNote: "Checks portfolio weekly. Needs proactive reassurance during volatility." },
  { id: 245, name: "Carlos & Maria Reyes", preferredName: "Carlos", status: "Active Client", category: "Client", dateOfBirth: "05/20/1968", maritalStatus: "Married", servicingAdvisor: "Carl Canga", clientSince: "10/12/2016", nextReview: "-", lastActivity: "Jan 25, 2026", pastDueActivities: 1, activeWorkflows: 0, portfolioBalance: 650000, lastActivityType: "Phone Call", lastActivitySubject: "Staggered retirement planning", lastActivityNotes: "Discussed Maria's part-time retirement. Agreed to model reduced income scenarios. Carlos wants to delay SS to 67.", daysSince: 80, contactCadenceTarget: 90, clientTier: "Gold", lifeGoal: "Staggered retirement", openTasks: 1, taskDaysOverdue: 46, oldestTaskSubject: "Model Maria's reduced income scenario", riskTarget: 52, riskActual: 59, riskGap: 7, riskStatus: "Minor Drift", downside6mo: "-$71,500", probSuccess: 76, riskTrend: "Increasing (+3)", reason: "Task 46 days overdue + minor risk drift", lifeEvent: "Birthday", lifeEventDate: "May 20", advisorNote: "Carlos and Maria have different retirement timelines. Maria retiring first. Complex planning." },
  { id: 301, name: "William J. Thompson", preferredName: "Bill", status: "Active Client", category: "Client", dateOfBirth: "01/28/1970", maritalStatus: "Married", servicingAdvisor: "Carl Canga", clientSince: "11/05/2018", nextReview: "-", lastActivity: "Mar 28, 2026", pastDueActivities: 0, activeWorkflows: 0, portfolioBalance: 720000, lastActivityType: "Phone Call", lastActivitySubject: "Q1 quarterly review", lastActivityNotes: "Quarterly portfolio review. Performance in line with expectations. Q1 performance summary to be sent.", daysSince: 18, contactCadenceTarget: 90, clientTier: "Gold", lifeGoal: "Retirement + Education (2 kids)", openTasks: 1, taskDaysOverdue: 0, oldestTaskSubject: "Send Q1 performance summary", riskTarget: 40, riskActual: 44, riskGap: 4, riskStatus: "Aligned", downside6mo: "-$64,800", probSuccess: 82, riskTrend: "Stable", reason: "On track — Q1 summary pending", lifeEvent: null, lifeEventDate: null, advisorNote: "Wants quarterly updates. Moderate risk. Two kids, ages 12 and 15." },
  { id: 178, name: "Elena M. Gutierrez", preferredName: "Elena", status: "Active Client", category: "Client", dateOfBirth: "12/05/1980", maritalStatus: "Single", servicingAdvisor: "Carl Canga", clientSince: "09/15/2023", nextReview: "-", lastActivity: "Apr 5, 2026", pastDueActivities: 0, activeWorkflows: 0, portfolioBalance: 210000, lastActivityType: "Phone Call", lastActivitySubject: "Index fund review", lastActivityNotes: "Reviewed new index fund investment. Elena excited about long-term growth strategy. No open items.", daysSince: 10, contactCadenceTarget: 90, clientTier: "Silver", lifeGoal: "Wealth accumulation", openTasks: 0, taskDaysOverdue: 0, oldestTaskSubject: null, riskTarget: 55, riskActual: 56, riskGap: 1, riskStatus: "Aligned", downside6mo: "-$23,100", probSuccess: 64, riskTrend: "Stable", reason: "Fully aligned", lifeEvent: null, lifeEventDate: null, advisorNote: "Younger client, growth-oriented. Comfortable with video calls." },
  { id: 312, name: "David & Lisa Kim", preferredName: "David & Lisa", status: "Active Client", category: "Client", dateOfBirth: "07/19/1972", maritalStatus: "Married", servicingAdvisor: "Carl Canga", clientSince: "02/14/2020", nextReview: "-", lastActivity: "Apr 12, 2026", pastDueActivities: 0, activeWorkflows: 0, portfolioBalance: 430000, lastActivityType: "Phone Call", lastActivitySubject: "529 contribution increase", lastActivityNotes: "Increased 529 contributions for daughter starting college 2027. All accounts aligned.", daysSince: 3, contactCadenceTarget: 90, clientTier: "Silver", lifeGoal: "Education (529) + Retirement", openTasks: 0, taskDaysOverdue: 0, oldestTaskSubject: null, riskTarget: 48, riskActual: 48, riskGap: 0, riskStatus: "Aligned", downside6mo: "-$45,200", probSuccess: 88, riskTrend: "Stable", reason: "Fully aligned — recent contact", lifeEvent: null, lifeEventDate: null, advisorNote: "Make decisions together. 529 planning is top priority for next 18 months." },
];

let failures = 0;
if (built.length !== GOLDEN.length) {
  failures++;
  console.log(`  ✗ expected ${GOLDEN.length} clients, got ${built.length}`);
}

for (const expected of GOLDEN) {
  const actual = built.find((c) => c.id === expected.id);
  if (!actual) {
    failures++;
    console.log(`  ✗ ${expected.name} (id ${expected.id}) — not produced by adapter`);
    continue;
  }
  const diffs = [];
  for (const key of Object.keys(expected)) {
    if (actual[key] !== expected[key]) diffs.push(`${key}: expected ${JSON.stringify(expected[key])}, got ${JSON.stringify(actual[key])}`);
  }
  // Catch any extra keys the transform might have added.
  for (const key of Object.keys(actual)) {
    if (!(key in expected)) diffs.push(`unexpected extra field: ${key} = ${JSON.stringify(actual[key])}`);
  }
  if (diffs.length === 0) {
    console.log(`  ✓ ${expected.name}`);
  } else {
    failures++;
    console.log(`  ✗ ${expected.name}`);
    for (const d of diffs) console.log(`      ${d}`);
  }
}

if (failures > 0) {
  console.error(`\n${failures} mismatch(es) — adapter output differs from the original data.`);
  process.exit(1);
}
console.log(`\nAll ${GOLDEN.length} clients reproduced exactly from the Redtail + Nitrogen fixtures.`);
