/*
  Pure transforms that turn raw adapter data into the flat client view-model
  the dashboard renders. No I/O and no JSON imports here, so the same code can
  be exercised directly by the round-trip test (lib/data/data.test.mjs).

  - resolveContacts(): joins Redtail contacts to the lookup tables (advisor /
    category / status names), the way a live RedtailAdapter would after fetching
    the lookup endpoints.
  - buildDashboardClients(): merges resolved Redtail contacts with Nitrogen risk
    records into the exact flat shape the UI consumes (Redtail + Nitrogen +
    derived fields). Health scores are NOT added here — scoring stays a separate
    concern (lib/scoring.js), applied by the component.
*/

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "1960-04-30" -> "04/30/1960" (string-only; no Date, so no timezone drift).
function usDate(iso) {
  const [y, m, d] = iso.split("-");
  return `${m}/${d}/${y}`;
}

// "2026-02-01" -> "Feb 1, 2026"
function longDate(iso) {
  const [y, m, d] = iso.split("-");
  return `${MONTHS[Number(m) - 1]} ${Number(d)}, ${y}`;
}

// Whole-day difference between two ISO dates, computed at UTC midnight.
function dayDiff(fromIso, toIso) {
  const a = Date.parse(`${fromIso}T00:00:00Z`);
  const b = Date.parse(`${toIso}T00:00:00Z`);
  return Math.round((b - a) / 86400000);
}

// -208700 -> "-$208,700"
function negMoney(n) {
  return `-$${Math.abs(n).toLocaleString("en-US")}`;
}

/** Resolve numeric *_id foreign keys into their display names. */
export function resolveContacts(contacts, lookups) {
  return contacts.map((c) => ({
    ...c,
    servicing_advisor: lookups.servicing_advisors[c.servicing_advisor_id],
    category: lookups.categories[c.category_id],
    status: lookups.statuses[c.status_id],
  }));
}

/**
 * Merge resolved Redtail contacts with Nitrogen risk records into the flat
 * client objects the dashboard renders.
 * @param {object[]} contacts  resolved Redtail contacts (see resolveContacts)
 * @param {object[]} riskRecords  Nitrogen risk records (joined by client_external_id)
 * @param {string} asOf  ISO snapshot date the day-counts are measured against
 */
export function buildDashboardClients(contacts, riskRecords, asOf) {
  const riskById = new Map(riskRecords.map((r) => [r.client_external_id, r]));

  return contacts.map((c) => {
    const r = riskById.get(c.id);
    const engagement = c.activities.find((a) => a.completed);
    const openTasks = c.activities.filter((a) => a.activity_type === "Task" && !a.completed);
    const oldestTask = openTasks
      .slice()
      .sort((a, b) => (a.start_date < b.start_date ? -1 : 1))[0] || null;
    const udf = (name) => {
      const found = c.udfs.find((u) => u.name === name);
      return found ? found.value : null;
    };

    const riskTarget = r.risk_number;
    const riskActual = r.portfolio.risk_number;

    return {
      id: c.id,
      name: c.full_name,
      preferredName: c.nickname,
      status: c.status,
      category: c.category,
      dateOfBirth: usDate(c.dob),
      maritalStatus: c.marital_status,
      servicingAdvisor: c.servicing_advisor,
      clientSince: usDate(c.client_since),
      nextReview: c.header.next_review,
      lastActivity: longDate(engagement.start_date),
      pastDueActivities: c.header.past_due_activities,
      activeWorkflows: c.header.active_workflows,
      portfolioBalance: c.accounts.reduce((sum, a) => sum + a.balance, 0),
      lastActivityType: engagement.activity_type,
      lastActivitySubject: engagement.subject,
      lastActivityNotes: engagement.description,
      daysSince: dayDiff(engagement.start_date, asOf),
      contactCadenceTarget: Number(udf("Contact Cadence Target")),
      clientTier: udf("Client Tier"),
      lifeGoal: udf("Life Goal"),
      openTasks: c.header.open_tasks,
      taskDaysOverdue: oldestTask ? Math.max(0, dayDiff(oldestTask.start_date, asOf)) : 0,
      oldestTaskSubject: oldestTask ? oldestTask.subject : null,
      riskTarget,
      riskActual,
      riskGap: Math.abs(riskActual - riskTarget),
      riskStatus: r.risk_status,
      downside6mo: negMoney(r.portfolio.six_month_range.downside),
      probSuccess: r.probability_of_success,
      riskTrend: r.risk_trend,
      reason: udf("Priority Reason"),
      lifeEvent: udf("Life Event"),
      lifeEventDate: udf("Life Event Date"),
      advisorNote: udf("Advisor Note"),
    };
  });
}
