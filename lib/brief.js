/*
  Call-prep brief — deterministic generator + payload validation.

  generateBrief() is the rule-based fallback used when no Anthropic API key is
  configured or the LLM call fails (see app/api/brief/route.ts). It is also the
  client-side last resort if the /api/brief request itself can't be reached.

  validateBriefPayload() guards the API route: the brief endpoint must confirm
  the posted object matches the expected (synthetic) client shape before any
  data is sent to the model.
*/

// Fields the brief depends on, with the type each must have. `null` is allowed
// for the optional event/task fields (a client may legitimately have neither).
const FIELD_TYPES = {
  preferredName: "string",
  riskActual: "number",
  riskTarget: "number",
  riskGap: "number",
  riskTrend: "string",
  lastActivityType: "string",
  lastActivity: "string",
  lastActivitySubject: "string",
  lastActivityNotes: "string",
  openTasks: "number",
  taskDaysOverdue: "number",
  oldestTaskSubject: "string|null",
  lifeEvent: "string|null",
  lifeEventDate: "string|null",
  lifeGoal: "string",
  probSuccess: "number",
};

/**
 * Validate that a posted payload matches the expected synthetic-client shape
 * before it is forwarded to the model.
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateBriefPayload(body) {
  const errors = [];
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { valid: false, errors: ["payload must be a JSON object"] };
  }
  for (const [field, spec] of Object.entries(FIELD_TYPES)) {
    const allowed = spec.split("|");
    const value = body[field];
    const nullable = allowed.includes("null");
    if (value === null || value === undefined) {
      if (nullable && value === null) continue;
      errors.push(`missing field: ${field}`);
      continue;
    }
    if (!allowed.includes(typeof value)) {
      errors.push(`field ${field} must be ${spec}, got ${typeof value}`);
    }
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Pick only the fields the brief uses — keeps anything extraneous (and any
 * non-synthetic field a caller might attach) out of what reaches the model.
 */
export function pickBriefFields(body) {
  const out = {};
  for (const field of Object.keys(FIELD_TYPES)) out[field] = body[field];
  return out;
}

/** Deterministic, rule-based call-prep brief. Unchanged from the v3 prototype. */
export function generateBrief(c) {
  const p = [];
  if (c.riskGap > 10) p.push(`${c.preferredName}'s portfolio Risk Number has drifted to ${c.riskActual} against a target of ${c.riskTarget} (gap: ${c.riskGap} points, trend: ${c.riskTrend.toLowerCase()}). This warrants a rebalancing conversation.`);
  else if (c.riskGap > 3) p.push(`Minor risk drift detected: portfolio at ${c.riskActual} vs target ${c.riskTarget}. Worth monitoring but not urgent.`);
  else p.push(`Portfolio risk is well-aligned at ${c.riskActual} (target: ${c.riskTarget}).`);
  if (c.lastActivityNotes) p.push(`Last ${c.lastActivityType.toLowerCase()} (${c.lastActivity}): ${c.lastActivitySubject}. ${c.lastActivityNotes.split('.').slice(0,2).join('.')}.`);
  if (c.openTasks > 0) p.push(`Open commitment: "${c.oldestTaskSubject}" — ${c.taskDaysOverdue > 0 ? `${c.taskDaysOverdue} days overdue` : "due soon"}.`);
  if (c.lifeEvent) p.push(`Upcoming: ${c.lifeEvent} on ${c.lifeEventDate}.`);
  p.push(`Goal: ${c.lifeGoal}. Probability of success: ${c.probSuccess}%.`);
  return p.join(" ");
}
