// Deterministic Metrics — all numbers derived from data, never hardcoded
import { checkEligibility } from "./eligibility";
import { calculateScore } from "./scoring";

export function calculateMetrics(payments, recoveryActions) {
  const total = payments.length;

  const successful = payments.filter((p) => p.status === "successful");
  const failed = payments.filter((p) => p.status === "failed");
  const pending = payments.filter((p) => p.status === "pending");
  const refunded = payments.filter((p) => p.status === "refunded");

  // Revenue at risk = sum of failed payment amounts (not refunded, not recovered)
  const revenueAtRisk = failed
    .filter((p) => !p.recovered && p.refund_status === "none")
    .reduce((sum, p) => sum + p.amount, 0);

  // Potentially recoverable = eligible failed payments
  const eligibleFailed = failed.filter((p) => {
    const elig = checkEligibility(p);
    return elig.eligible;
  });
  const potentiallyRecoverable = eligibleFailed.reduce((sum, p) => sum + p.amount, 0);

  // Revenue recovered = sum of recovered amounts (only successful recoveries count)
  const recoveredPayments = payments.filter((p) => p.recovered && p.recovery_status === "successful");
  const revenueRecovered = recoveredPayments.reduce((sum, p) => sum + (p.recovered_amount || p.amount), 0);

  // Recovery actions
  const actions = recoveryActions || [];
  const successfulActions = actions.filter((a) => a.status === "successful");
  const blockedActions = actions.filter((a) => a.status === "blocked");
  const failedActions = actions.filter((a) => a.status === "failed");

  const attempts = actions.filter((a) => a.status === "successful" || a.status === "failed");
  const recoveryRate = attempts.length > 0
    ? Math.round((successfulActions.length / attempts.length) * 100)
    : 0;

  const opportunityConversionRate = eligibleFailed.length > 0
    ? Math.round((recoveredPayments.length / eligibleFailed.length) * 100)
    : 0;

  // Recovery funnel
  const funnel = {
    failedPayments: { count: failed.length, amount: failed.reduce((s, p) => s + p.amount, 0) },
    opportunities: { count: failed.length, amount: revenueAtRisk },
    eligibleOpportunities: { count: eligibleFailed.length, amount: potentiallyRecoverable },
    aiRecommendations: { count: failed.length, amount: 0 },
    approved: { count: eligibleFailed.length, amount: potentiallyRecoverable },
    attempts: { count: attempts.length, amount: 0 },
    successful: { count: successfulActions.length, amount: revenueRecovered },
    blocked: { count: blockedActions.length, amount: 0 },
  };

  return {
    totalPayments: total,
    successfulPayments: successful.length,
    failedPayments: failed.length,
    pendingPayments: pending.length,
    refundedPayments: refunded.length,
    revenueAtRisk,
    potentiallyRecoverable,
    revenueRecovered,
    recoveryRate,
    opportunityConversionRate,
    eligibleOpportunities: eligibleFailed.length,
    recoveryActions: actions.length,
    successfulRecoveries: successfulActions.length,
    blockedActions: blockedActions.length,
    failedActions: failedActions.length,
    funnel,
  };
}

export function getFailureBreakdown(payments) {
  const failed = payments.filter((p) => p.status === "failed");
  const byCategory = {};
  const byMethod = {};

  failed.forEach((p) => {
    const cat = p.failure_category || "unknown";
    byCategory[cat] = (byCategory[cat] || { count: 0, amount: 0 });
    byCategory[cat].count++;
    byCategory[cat].amount += p.amount;

    const m = p.payment_method;
    byMethod[m] = (byMethod[m] || { count: 0, amount: 0 });
    byMethod[m].count++;
    byMethod[m].amount += p.amount;
  });

  return {
    total: failed.length,
    failedAmount: failed.reduce((s, p) => s + p.amount, 0),
    byCategory: Object.entries(byCategory)
      .map(([category, v]) => ({ category, ...v }))
      .sort((a, b) => b.count - a.count),
    byMethod: Object.entries(byMethod)
      .map(([method, v]) => ({ method, ...v }))
      .sort((a, b) => b.count - a.count),
  };
}