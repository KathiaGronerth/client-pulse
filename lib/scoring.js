/*
  Client Pulse — Health Score engine.

  Health Score = 100 + Engagement + Risk + Task + Life-Event penalties.
  Each penalty is derived deterministically from structured Redtail/Nitrogen
  fields so every number on screen traces back to a specific input — no ML,
  no black box. Rules were reverse-engineered from the original hardcoded
  prototype values and reproduce all eight fixture clients exactly (see
  lib/scoring.test.mjs).

  Penalty weights (max magnitude per signal): Engagement 35, Risk 30,
  Task 20, Life Event 15.
*/

// Priority thresholds applied to the final score.
export const THRESHOLDS = { URGENT: 35, ATTENTION: 55 };
//   score < 35        → Urgent
//   35 <= score < 55  → Attention
//   score >= 55       → Healthy

// Max penalty magnitude per signal (the documented 35/30/20/15 weights).
export const WEIGHTS = { ENGAGEMENT: 35, RISK: 30, TASK: 20, LIFE: 15 };

/**
 * Engagement penalty — how overdue contact is vs. the client's cadence target.
 * A -1 floor applies even when within cadence (a relationship is never "free").
 */
export function engagementPenalty(client) {
  const daysOver = client.daysSince - client.contactCadenceTarget;
  if (daysOver <= 0) return -1;
  if (daysOver <= 10) return -5;
  if (daysOver <= 30) return -25;
  return -35;
}

/**
 * Risk penalty — linear in the gap between portfolio risk and client tolerance.
 * ~1.8 points per gap point, capped at the 30-point risk weight.
 */
export function riskPenalty(client) {
  const gap = Math.abs(client.riskActual - client.riskTarget);
  return -Math.min(Math.round(1.8 * gap), WEIGHTS.RISK);
}

/**
 * Task penalty — 5 points per open task plus 0.4 per overdue day, capped at 20.
 * No open tasks means no penalty.
 */
export function taskPenalty(client) {
  if (client.openTasks === 0) return 0;
  const raw = 5 * client.openTasks + Math.round(0.4 * client.taskDaysOverdue);
  return -Math.min(raw, WEIGHTS.TASK);
}

/**
 * Life-event penalty — an upcoming event (birthday, review milestone) is an
 * outreach *opportunity*, so it carries a light -3. Its absence carries -12:
 * there's no natural hook to reach out on.
 */
export function lifeEventPenalty(client) {
  return client.lifeEvent ? -3 : -12;
}

/**
 * Compute the full health score and its penalty breakdown for a client.
 * @returns {{ score:number, engPenalty:number, riskPenalty:number,
 *             taskPenalty:number, lifePenalty:number }}
 */
export function computeHealthScore(client) {
  const engPenalty = engagementPenalty(client);
  const riskPen = riskPenalty(client);
  const taskPen = taskPenalty(client);
  const lifePenalty = lifeEventPenalty(client);
  const score = 100 + engPenalty + riskPen + taskPen + lifePenalty;
  return { score, engPenalty, riskPenalty: riskPen, taskPenalty: taskPen, lifePenalty };
}

/** Priority bucket for a score: "urgent" | "attention" | "healthy". */
export function priorityLevel(score) {
  if (score < THRESHOLDS.URGENT) return "urgent";
  if (score < THRESHOLDS.ATTENTION) return "attention";
  return "healthy";
}
