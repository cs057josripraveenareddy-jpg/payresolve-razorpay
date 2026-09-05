// Opportunity Detection — identifies failed payments that represent revenue at risk
import { checkEligibility } from "./eligibility";
import { calculateScore } from "./scoring";
import { selectAction } from "./action-selection";
import { validateSafety } from "./safety-validation";

export function buildOpportunity(payment) {
  if (payment.status !== "failed") return null;

  const eligibility = checkEligibility(payment);
  const score = calculateScore(payment, eligibility);
  const action = selectAction(eligibility, score);
  const safety = validateSafety(payment, eligibility, action.action);

  return {
    payment,
    eligibility,
    score,
    action,
    safety,
    revenueAtRisk: payment.amount,
    recoverable: eligibility.eligible && safety.allowed,
  };
}

export function detectOpportunities(payments) {
  return payments
    .map((p) => buildOpportunity(p))
    .filter((o) => o !== null)
    .sort((a, b) => b.score.score - a.score.score);
}