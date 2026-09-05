// Deterministic Action Selection
// Given eligibility + score, pick the best recovery action.

export function selectAction(eligibility, score) {
  if (!eligibility.eligible) {
    return {
      action: "manual_followup",
      label: "Manual Customer Follow-up",
      reason: "Automated retry is not permitted. Recommend manual customer support outreach.",
    };
  }

  if (score.score >= 60) {
    return {
      action: "retry",
      label: "Retry Payment",
      reason: "High recovery score and eligible — automated retry is the optimal action.",
    };
  }

  if (score.score >= 40) {
    return {
      action: "customer_outreach",
      label: "Customer Outreach + Retry",
      reason: "Medium recovery score — contact customer to confirm payment method, then retry.",
    };
  }

  return {
    action: "manual_followup",
    label: "Manual Review",
    reason: "Low recovery score — recommend manual review before any action.",
  };
}