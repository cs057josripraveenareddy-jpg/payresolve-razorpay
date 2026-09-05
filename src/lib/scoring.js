// Deterministic Recovery Score (0-100)
// Reproducible — same payment always produces the same score.

const WEIGHTS = {
  failureRetryability: 30,
  paymentAge: 20,
  previousRetry: 20,
  paymentMethod: 10,
  transactionValue: 10,
  customerContext: 10,
};

const METHOD_SCORES = { upi: 10, card: 7, netbanking: 5, wallet: 8 };

export function calculateScore(payment, eligibility) {
  const breakdown = [];

  // 1. Failure retryability (30)
  const retryable = eligibility.checks.find((c) => c.rule === "failure_must_be_retryable");
  const retryabilityScore = retryable?.passed ? WEIGHTS.failureRetryability : 0;
  breakdown.push({
    factor: "Failure Retryability",
    weight: WEIGHTS.failureRetryability,
    score: retryabilityScore,
    detail: retryable?.passed ? "Retryable failure type" : "Non-retryable failure type",
  });

  // 2. Payment age (20) — newer is better
  const ageDays = eligibility.ageDays;
  let ageScore;
  if (ageDays <= 1) ageScore = 20;
  else if (ageDays <= 3) ageScore = 18;
  else if (ageDays <= 7) ageScore = 14;
  else if (ageDays <= 14) ageScore = 10;
  else if (ageDays <= 30) ageScore = 6;
  else ageScore = 0;
  breakdown.push({
    factor: "Payment Age",
    weight: WEIGHTS.paymentAge,
    score: ageScore,
    detail: `${ageDays} day(s) old`,
  });

  // 3. Previous retry behaviour (20) — no prior retry is best, prior failed retry is lower
  let retryBehaviourScore;
  if (payment.retry_count === 0) retryBehaviourScore = 20;
  else if (payment.retry_count === 1 && payment.previous_retry_result === "failed") retryBehaviourScore = 14;
  else if (payment.retry_count === 2 && payment.previous_retry_result === "failed") retryBehaviourScore = 8;
  else retryBehaviourScore = 4;
  breakdown.push({
    factor: "Previous Retry Behaviour",
    weight: WEIGHTS.previousRetry,
    score: retryBehaviourScore,
    detail: payment.retry_count === 0 ? "No previous retries" : `${payment.retry_count} prior failed retry(s)`,
  });

  // 4. Payment method (10)
  const methodScore = METHOD_SCORES[payment.payment_method] || 5;
  breakdown.push({
    factor: "Payment Method",
    weight: WEIGHTS.paymentMethod,
    score: methodScore,
    detail: payment.payment_method.toUpperCase(),
  });

  // 5. Transaction value (10) — higher value = higher priority
  let valueScore;
  if (payment.amount >= 10000) valueScore = 10;
  else if (payment.amount >= 5000) valueScore = 8;
  else if (payment.amount >= 2000) valueScore = 6;
  else if (payment.amount >= 1000) valueScore = 4;
  else valueScore = 2;
  breakdown.push({
    factor: "Transaction Value",
    weight: WEIGHTS.transactionValue,
    score: valueScore,
    detail: `₹${payment.amount.toLocaleString("en-IN")}`,
  });

  // 6. Customer/payment context (10) — deterministic heuristic
  let contextScore = 6;
  if (payment.customer_email && payment.customer_email.includes("@")) contextScore += 2;
  if (payment.payment_method === "upi") contextScore = Math.min(contextScore + 2, 10);
  contextScore = Math.min(contextScore, 10);
  breakdown.push({
    factor: "Customer Context",
    weight: WEIGHTS.customerContext,
    score: contextScore,
    detail: "Verified customer profile",
  });

  const total = breakdown.reduce((sum, b) => sum + b.score, 0);

  return {
    score: Math.min(total, 100),
    breakdown,
    weights: WEIGHTS,
  };
}

export function getScoreGrade(score) {
  if (score >= 80) return { grade: "A", label: "High Recovery Potential", color: "text-success" };
  if (score >= 60) return { grade: "B", label: "Medium Recovery Potential", color: "text-primary" };
  if (score >= 40) return { grade: "C", label: "Low Recovery Potential", color: "text-warning" };
  return { grade: "D", label: "Minimal Recovery Potential", color: "text-destructive" };
}