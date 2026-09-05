// Deterministic Safety Validation
// AI can recommend. Safety engine controls. AI cannot override financial safety rules.

export function validateSafety(payment, eligibility, recommendedAction) {
  const blocks = [];

  // If AI recommends retry, validate all safety rules
  if (recommendedAction === "retry" || recommendedAction === "customer_outreach") {
    if (!eligibility.eligible) {
      eligibility.blockingReasons.forEach((reason) => {
        blocks.push(reason);
      });
    }
  }

  // Refund check — explicit, most important
  if (payment.refund_status === "full" || payment.refund_status === "partial") {
    if (!blocks.some((b) => b.includes("refunded"))) {
      blocks.push(`Retry is prohibited because this payment has already been refunded (${payment.refund_status}).`);
    }
  }

  const allowed = blocks.length === 0;

  return {
    status: allowed ? "allowed" : "blocked",
    allowed,
    blocks,
    alternative: allowed ? null : "Manual customer support / human review required.",
  };
}