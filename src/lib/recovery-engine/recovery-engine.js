// ============================================================================
// PayResolve — Deterministic Recovery Engine
// The source of financial truth. AI can recommend. This engine controls.
// ============================================================================

const RETRYABLE_FAILURES = ['timeout', 'bank_issue', 'network_error', 'processor_error', 'pending_review'];
const NON_RETRYABLE_FAILURES = ['insufficient_funds', 'declined', 'expired_card'];
const MAX_RETRIES = 3;
const MAX_AGE_DAYS = 30;

// Fixed "now" so metrics are reproducible across reloads (matches timeAgo helper).
const NOW = new Date('2026-09-04T18:00:00.000Z').getTime();
const DAY_MS = 86400000;

const METHOD_WEIGHTS = { upi: 12, card: 10, netbanking: 8, wallet: 6 };

function ageDays(createdAt) {
  if (!createdAt) return 0;
  return Math.max(0, Math.floor((NOW - new Date(createdAt).getTime()) / DAY_MS));
}

// ---------------------------------------------------------------------------
// Layer 1 — Eligibility (deterministic)
// ---------------------------------------------------------------------------
export function checkEligibility(payment) {
  const blockingReasons = [];
  if (payment.status !== 'failed') blockingReasons.push('Payment is not in a failed state');
  if (payment.recovered) blockingReasons.push('Payment has already been recovered');
  if (payment.refund_status === 'full' || payment.refund_status === 'partial')
    blockingReasons.push('Payment has already been refunded');
  if ((payment.retry_count || 0) >= MAX_RETRIES) blockingReasons.push('Retry limit exceeded');
  if (NON_RETRYABLE_FAILURES.includes(payment.failure_category))
    blockingReasons.push(`Failure type "${payment.failure_category}" is non-retryable`);
  if (ageDays(payment.created_at) > MAX_AGE_DAYS)
    blockingReasons.push('Payment exceeds maximum age for recovery');
  return { eligible: blockingReasons.length === 0, blockingReasons };
}

// ---------------------------------------------------------------------------
// Layer 1 — Recovery Score (deterministic, explainable, 0–100)
// ---------------------------------------------------------------------------
export function calculateScore(payment) {
  const breakdown = [];

  // Factor 1 — Retryable failure (30)
  const retryable = RETRYABLE_FAILURES.includes(payment.failure_category);
  breakdown.push({
    factor: 'Retryable Failure',
    score: retryable ? 30 : 0,
    weight: 30,
    detail: retryable ? 'Failure category is retryable' : 'Failure category is non-retryable',
  });

  // Factor 2 — Recent transaction (18)
  const age = ageDays(payment.created_at);
  let recentScore = 0;
  if (age <= 1) recentScore = 18;
  else if (age <= 3) recentScore = 15;
  else if (age <= 7) recentScore = 11;
  else if (age <= 14) recentScore = 7;
  else if (age <= MAX_AGE_DAYS) recentScore = 3;
  breakdown.push({
    factor: 'Recent Transaction',
    score: recentScore,
    weight: 18,
    detail: `${age} day${age === 1 ? '' : 's'} old`,
  });

  // Factor 3 — No prior successful retry (15)
  const noPriorSuccess = payment.previous_retry_result !== 'successful';
  breakdown.push({
    factor: 'No Prior Success',
    score: noPriorSuccess ? 15 : 0,
    weight: 15,
    detail: noPriorSuccess ? 'No successful retry on record' : 'Previously retried successfully',
  });

  // Factor 4 — Payment method (12)
  const methodScore = METHOD_WEIGHTS[payment.payment_method] || 6;
  breakdown.push({
    factor: 'Payment Method',
    score: methodScore,
    weight: 12,
    detail: `${(payment.payment_method || '').toUpperCase()} recovery likelihood`,
  });

  // Factor 5 — Transaction value (15)
  const amt = payment.amount || 0;
  let valueScore = 3;
  if (amt >= 5000) valueScore = 15;
  else if (amt >= 2000) valueScore = 12;
  else if (amt >= 500) valueScore = 9;
  else if (amt >= 100) valueScore = 6;
  breakdown.push({
    factor: 'Transaction Value',
    score: valueScore,
    weight: 15,
    detail: `\u20B9${amt.toLocaleString('en-IN')} at risk`,
  });

  // Factor 6 — Customer data quality (10)
  let dataScore = 0;
  if (payment.customer_email) dataScore += 5;
  if (payment.customer_name) dataScore += 5;
  breakdown.push({
    factor: 'Customer Data',
    score: dataScore,
    weight: 10,
    detail: 'Contact information available for outreach',
  });

  const score = breakdown.reduce((sum, b) => sum + b.score, 0);
  return { score, breakdown };
}

export function getScoreGrade(score) {
  if (score >= 80) return { label: 'High Recovery Potential', grade: 'A', color: 'text-success' };
  if (score >= 60) return { label: 'Moderate Recovery Potential', grade: 'B', color: 'text-primary' };
  if (score >= 40) return { label: 'Low Recovery Potential', grade: 'C', color: 'text-warning' };
  return { label: 'Minimal Recovery Potential', grade: 'D', color: 'text-destructive' };
}

// ---------------------------------------------------------------------------
// Layer 1 — Action selection (deterministic)
// ---------------------------------------------------------------------------
export function selectAction(payment, eligibility, score) {
  if (!eligibility.eligible)
    return { action: 'none', label: 'No Automated Action', reason: 'Payment is not eligible for automated recovery' };
  if (score.score >= 70)
    return { action: 'retry', label: 'Retry Payment', reason: 'High recovery score — automated retry has strong expected recovery' };
  if (score.score >= 40)
    return { action: 'customer_outreach', label: 'Notify Customer', reason: 'Moderate score — customer action may unblock the payment' };
  return { action: 'manual_followup', label: 'Manual Review', reason: 'Low score — requires manual investigation by the operations team' };
}

// ---------------------------------------------------------------------------
// Layer 1 — Safety validation (deterministic — AI cannot override)
// ---------------------------------------------------------------------------
export function validateSafety(payment, action) {
  const blocks = [];
  if (payment.refund_status === 'full' || payment.refund_status === 'partial')
    blocks.push('Payment has already been refunded');
  if ((payment.retry_count || 0) >= MAX_RETRIES)
    blocks.push('Retry limit exceeded — no further automated attempts allowed');
  if (NON_RETRYABLE_FAILURES.includes(payment.failure_category))
    blocks.push(`Failure type "${payment.failure_category}" is non-retryable`);
  if (payment.recovered) blocks.push('Payment already recovered — no further action needed');
  if (ageDays(payment.created_at) > MAX_AGE_DAYS)
    blocks.push('Payment exceeds maximum age for recovery');
  if (action.action === 'none') blocks.push('No eligible recovery action available');

  if (blocks.length > 0) {
    return { allowed: false, status: 'blocked', blocks, alternative: 'Manual customer follow-up' };
  }
  return { allowed: true, status: 'allowed', blocks: [], alternative: null };
}

// ---------------------------------------------------------------------------
// Opportunity detection — assembles the full recovery picture per payment
// ---------------------------------------------------------------------------
export function detectOpportunities(payments) {
  if (!Array.isArray(payments)) return [];
  return payments
    .filter((p) => p.status === 'failed')
    .map((payment) => {
      const eligibility = checkEligibility(payment);
      const score = calculateScore(payment);
      const action = selectAction(payment, eligibility, score);
      const safety = validateSafety(payment, action);
      const recoverable = eligibility.eligible && safety.allowed;
      return { payment, eligibility, score, action, safety, recoverable };
    });
}

// ---------------------------------------------------------------------------
// Batch metrics — every number derived from data, never hardcoded
// ---------------------------------------------------------------------------
export function calculateMetrics(payments, actions) {
  const all = Array.isArray(payments) ? payments : [];
  const acts = Array.isArray(actions) ? actions : [];
  const failed = all.filter((p) => p.status === 'failed');
  const opportunities = detectOpportunities(all);
  const recoverable = opportunities.filter((o) => o.recoverable);

  const revenueAtRisk = failed.reduce((s, p) => s + (p.recovered ? 0 : p.amount || 0), 0);
  const potentiallyRecoverable = recoverable.reduce((s, o) => s + (o.payment.amount || 0), 0);

  const successfulActions = acts.filter((a) => a.status === 'successful');
  const recoveredFromActions = successfulActions.reduce((s, a) => s + (a.revenue_recovered || 0), 0);
  const recoveredFromPayments = all.filter((p) => p.recovered).reduce((s, p) => s + (p.recovered_amount || 0), 0);
  const revenueRecovered = Math.max(recoveredFromActions, recoveredFromPayments);

  const attempts = acts.filter((a) => ['executed', 'successful', 'failed'].includes(a.status));
  const successfulRecoveries = Math.max(successfulActions.length, all.filter((p) => p.recovered).length);
  const blockedActions = opportunities.filter((o) => !o.safety.allowed).length;
  const recoveryRate = attempts.length > 0 ? Math.round((successfulActions.length / attempts.length) * 100) : 0;

  const funnel = {
    failedPayments: { count: failed.length, amount: revenueAtRisk },
    eligibleOpportunities: { count: recoverable.length, amount: potentiallyRecoverable },
    aiRecommendations: { count: recoverable.length, amount: potentiallyRecoverable },
    approved: { count: recoverable.length, amount: potentiallyRecoverable },
    attempts: { count: attempts.length, amount: attempts.reduce((s, a) => s + (a.revenue_recovered || 0), 0) },
    successful: { count: successfulRecoveries, amount: revenueRecovered },
  };

  return {
    totalPayments: all.length,
    failedPayments: failed.length,
    eligibleOpportunities: recoverable.length,
    potentiallyRecoverable,
    revenueAtRisk,
    revenueRecovered,
    recoveryRate,
    successfulRecoveries,
    blockedActions,
    funnel,
  };
}

// ---------------------------------------------------------------------------
// Failure breakdown for charts
// ---------------------------------------------------------------------------
export function getFailureBreakdown(payments) {
  const failed = (Array.isArray(payments) ? payments : []).filter((p) => p.status === 'failed');
  const map = {};
  failed.forEach((p) => {
    const cat = p.failure_category || 'unknown';
    map[cat] = (map[cat] || 0) + 1;
  });
  const byCategory = Object.entries(map)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
  return { total: failed.length, byCategory };
}