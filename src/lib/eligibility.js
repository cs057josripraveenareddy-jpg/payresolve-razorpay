// Deterministic Recovery Eligibility Engine
// AI can recommend. This engine controls financial safety.

const MAX_RETRIES = 3;
const MAX_AGE_DAYS = 30;

const RETRYABLE_FAILURES = ["timeout", "bank_issue", "network_error", "processor_error"];

export function isFailureRetryable(failureCategory) {
  return RETRYABLE_FAILURES.includes(failureCategory);
}

export function getPaymentAgeDays(createdAt) {
  const now = new Date("2026-09-04T18:00:00.000Z").getTime();
  const created = new Date(createdAt).getTime();
  return Math.floor((now - created) / 86400000);
}

export function checkEligibility(payment) {
  const checks = [];

  // 1. Is payment failed?
  if (payment.status !== "failed") {
    checks.push({ rule: "payment_must_be_failed", passed: false, reason: `Payment status is "${payment.status}", not "failed". Recovery only applies to failed payments.` });
  } else {
    checks.push({ rule: "payment_must_be_failed", passed: true });
  }

  // 2. Is failure retryable?
  if (payment.status === "failed") {
    if (!isFailureRetryable(payment.failure_category)) {
      checks.push({ rule: "failure_must_be_retryable", passed: false, reason: `Failure category "${payment.failure_category}" is non-retryable.` });
    } else {
      checks.push({ rule: "failure_must_be_retryable", passed: true });
    }
  }

  // 3. Already recovered?
  if (payment.recovered) {
    checks.push({ rule: "not_already_recovered", passed: false, reason: "Payment has already been recovered." });
  } else {
    checks.push({ rule: "not_already_recovered", passed: true });
  }

  // 4. Already refunded?
  if (payment.refund_status === "full" || payment.refund_status === "partial") {
    checks.push({ rule: "not_refunded", passed: false, reason: `Payment has been refunded (${payment.refund_status}). Retry is prohibited after refund.` });
  } else {
    checks.push({ rule: "not_refunded", passed: true });
  }

  // 5. Retry limit?
  if (payment.retry_count >= MAX_RETRIES) {
    checks.push({ rule: "retry_limit_available", passed: false, reason: `Retry limit exceeded (${payment.retry_count}/${MAX_RETRIES} retries used).` });
  } else {
    checks.push({ rule: "retry_limit_available", passed: true });
  }

  // 6. Age limit?
  const ageDays = getPaymentAgeDays(payment.created_at);
  if (ageDays > MAX_AGE_DAYS) {
    checks.push({ rule: "payment_age_valid", passed: false, reason: `Payment is ${ageDays} days old (max ${MAX_AGE_DAYS} days for recovery).` });
  } else {
    checks.push({ rule: "payment_age_valid", passed: true });
  }

  const failedChecks = checks.filter((c) => !c.passed);
  const eligible = failedChecks.length === 0;
  const blockingReasons = failedChecks.map((c) => c.reason);

  return {
    eligible,
    checks,
    blockingReasons,
    maxRetries: MAX_RETRIES,
    maxAgeDays: MAX_AGE_DAYS,
    ageDays,
  };
}