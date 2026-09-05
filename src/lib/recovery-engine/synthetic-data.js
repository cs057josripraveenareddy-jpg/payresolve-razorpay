// Deterministic synthetic payment dataset — 60 payments
// Same dataset produces same metrics every time. No random generation on refresh.

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(42);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const randInt = (min, max) => Math.floor(rand() * (max - min + 1)) + min;

const customerNames = [
  "Aarav Sharma", "Vicky Malhotra", "Priya Patel", "Rohan Mehta", "Ananya Iyer",
  "Karthik Nair", "Sneha Reddy", "Arjun Verma", "Kavya Singh", "Vikram Joshi",
  "Meera Krishnan", "Aditya Rao", "Pooja Gupta", "Rahul Nair", "Ishita Bose",
  "Sanjay Pillai", "Divya Menon", "Nikhil Agarwal", "Trisha Das", "Manish Saxena",
  "Lakshmi Pillai", "Harish Bhat", "Nisha Kulkarni", "Gaurav Tiwari", "Shreya Kapoor",
  "Deepak Yadav", "Anjali Mishra", "Rajesh Kumar", "Sunita Jain", "Tarun Ahuja"
];

const failureCategories = {
  retryable: [
    { category: "timeout", reason: "Payment timed out waiting for bank response" },
    { category: "bank_issue", reason: "Issuing bank temporarily unavailable" },
    { category: "network_error", reason: "Network connectivity error during payment processing" },
    { category: "processor_error", reason: "Payment processor returned a transient error" },
  ],
  nonRetryable: [
    { category: "insufficient_funds", reason: "Customer account has insufficient funds" },
    { category: "declined", reason: "Payment declined by issuing bank" },
    { category: "expired_card", reason: "Card has expired" },
  ],
};

const methods = ["upi", "card", "netbanking", "wallet"];

function generatePayments() {
  const payments = [];
  const now = new Date("2026-09-04T18:00:00.000Z").getTime();

  // --- Curated scenario payments (guaranteed demo cases) ---
  const curated = [
    // High-score eligible: retryable, recent, no prior retry, UPI
    { payment_id: "pay_001", order_id: "order_001", amount: 2499, payment_method: "upi", status: "failed", failure_category: "timeout", failure_reason: "Payment timed out waiting for bank response", retry_count: 0, previous_retry_result: "none", refund_status: "none", refund_amount: 0, customer_name: "Aarav Sharma", customer_email: "aarav.sharma@example.in", daysAgo: 1 },
    // Eligible: bank issue, 1 prior failed retry
    { payment_id: "pay_002", order_id: "order_002", amount: 799, payment_method: "card", status: "failed", failure_category: "bank_issue", failure_reason: "Issuing bank temporarily unavailable", retry_count: 1, previous_retry_result: "failed", refund_status: "none", refund_amount: 0, customer_name: "Priya Patel", customer_email: "priya.patel@example.in", daysAgo: 2 },
    // BLOCKED: refunded — AI will recommend retry, safety blocks it
    { payment_id: "pay_003", order_id: "order_003", amount: 4500, payment_method: "netbanking", status: "refunded", failure_category: "processor_error", failure_reason: "Payment processor returned a transient error", retry_count: 0, previous_retry_result: "none", refund_status: "full", refund_amount: 4500, customer_name: "Rohan Mehta", customer_email: "rohan.mehta@example.in", daysAgo: 5 },
    // BLOCKED: retry limit exceeded
    { payment_id: "pay_004", order_id: "order_004", amount: 1299, payment_method: "upi", status: "failed", failure_category: "network_error", failure_reason: "Network connectivity error during payment processing", retry_count: 3, previous_retry_result: "failed", refund_status: "none", refund_amount: 0, customer_name: "Sneha Reddy", customer_email: "sneha.reddy@example.in", daysAgo: 3 },
    // BLOCKED: non-retryable failure
    { payment_id: "pay_005", order_id: "order_005", amount: 8999, payment_method: "card", status: "failed", failure_category: "insufficient_funds", failure_reason: "Customer account has insufficient funds", retry_count: 0, previous_retry_result: "none", refund_status: "none", refund_amount: 0, customer_name: "Arjun Verma", customer_email: "arjun.verma@example.in", daysAgo: 1 },
    // Already recovered
    { payment_id: "pay_006", order_id: "order_006", amount: 1599, payment_method: "upi", status: "failed", failure_category: "timeout", failure_reason: "Payment timed out waiting for bank response", retry_count: 1, previous_retry_result: "failed", refund_status: "none", refund_amount: 0, customer_name: "Kavya Singh", customer_email: "kavya.singh@example.in", daysAgo: 4, recovered: true, recovered_amount: 1599, recovery_status: "successful" },
    // Successful payment (not a recovery target)
    { payment_id: "pay_007", order_id: "order_007", amount: 599, payment_method: "upi", status: "successful", failure_category: "none", failure_reason: "", retry_count: 0, previous_retry_result: "none", refund_status: "none", refund_amount: 0, customer_name: "Vikram Joshi", customer_email: "vikram.joshi@example.in", daysAgo: 1 },
    // Pending payment
    { payment_id: "pay_008", order_id: "order_008", amount: 3200, payment_method: "netbanking", status: "pending", failure_category: "pending_review", failure_reason: "Payment is pending bank confirmation", retry_count: 0, previous_retry_result: "none", refund_status: "none", refund_amount: 0, customer_name: "Meera Krishnan", customer_email: "meera.k@example.in", daysAgo: 0 },
    // BLOCKED: too old (age limit)
    { payment_id: "pay_009", order_id: "order_009", amount: 6750, payment_method: "card", status: "failed", failure_category: "bank_issue", failure_reason: "Issuing bank temporarily unavailable", retry_count: 1, previous_retry_result: "failed", refund_status: "none", refund_amount: 0, customer_name: "Aditya Rao", customer_email: "aditya.rao@example.in", daysAgo: 35 },
    // Eligible: high value, retryable
    { payment_id: "pay_010", order_id: "order_010", amount: 12999, payment_method: "upi", status: "failed", failure_category: "processor_error", failure_reason: "Payment processor returned a transient error", retry_count: 0, previous_retry_result: "none", refund_status: "none", refund_amount: 0, customer_name: "Pooja Gupta", customer_email: "pooja.gupta@example.in", daysAgo: 2 },
  ];

  curated.forEach((p) => {
    payments.push({
      ...p,
      currency: "INR",
      created_at: new Date(now - p.daysAgo * 86400000).toISOString(),
      recovered: p.recovered || false,
      recovered_amount: p.recovered_amount || 0,
      recovery_status: p.recovery_status || (p.status === "failed" ? "identified" : "none"),
      is_synthetic: true,
    });
  });

  // --- Generated payments (50 more, deterministic) ---
  for (let i = 11; i <= 60; i++) {
    const roll = rand();
    let status, failure_category, failure_reason, retry_count, previous_retry_result, refund_status, refund_amount, recovered, recovered_amount, recovery_status;

    if (roll < 0.33) {
      status = "successful";
      failure_category = "none"; failure_reason = "";
      retry_count = 0; previous_retry_result = "none";
      refund_status = "none"; refund_amount = 0;
      recovered = false; recovered_amount = 0; recovery_status = "none";
    } else if (roll < 0.72) {
      status = "failed";
      const isRetryable = rand() > 0.4;
      const fc = isRetryable ? pick(failureCategories.retryable) : pick(failureCategories.nonRetryable);
      failure_category = fc.category; failure_reason = fc.reason;
      retry_count = randInt(0, 3);
      previous_retry_result = retry_count > 0 ? "failed" : "none";
      const isRefunded = rand() > 0.85;
      refund_status = isRefunded ? "full" : "none";
      refund_amount = isRefunded ? 0 : 0; // set below
      recovered = false; recovered_amount = 0;
      recovery_status = "identified";
    } else if (roll < 0.88) {
      status = "pending";
      failure_category = "pending_review"; failure_reason = "Payment is pending bank confirmation";
      retry_count = 0; previous_retry_result = "none";
      refund_status = "none"; refund_amount = 0;
      recovered = false; recovered_amount = 0; recovery_status = "none";
    } else {
      status = "refunded";
      const fc = pick(failureCategories.retryable);
      failure_category = fc.category; failure_reason = fc.reason;
      retry_count = randInt(0, 2); previous_retry_result = retry_count > 0 ? "failed" : "none";
      refund_status = "full";
      recovered = false; recovered_amount = 0; recovery_status = "none";
    }

    const amount = pick([499, 799, 999, 1299, 1499, 1999, 2499, 2999, 3499, 4999, 6999, 9999, 14999]);
    const method = pick(methods);
    const daysAgo = randInt(0, 40);
    const custIdx = (i - 11) % customerNames.length;
    const customer_name = customerNames[custIdx];
    const customer_email = customer_name.toLowerCase().replace(/ /g, ".") + "@example.in";

    if (refund_status === "full") refund_amount = amount;

    payments.push({
      payment_id: `pay_${String(i).padStart(3, "0")}`,
      order_id: `order_${String(i).padStart(3, "0")}`,
      amount,
      currency: "INR",
      payment_method: method,
      status,
      failure_category,
      failure_reason,
      created_at: new Date(now - daysAgo * 86400000).toISOString(),
      retry_count,
      previous_retry_result,
      refund_status,
      refund_amount,
      customer_name,
      customer_email,
      recovered,
      recovered_amount,
      recovery_status,
      is_synthetic: true,
    });
  }

  return payments;
}

export const SYNTHETIC_PAYMENTS = generatePayments();