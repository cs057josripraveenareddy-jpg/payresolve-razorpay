import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { payment, eligibility, score, action, safety } = body;

    const blockingReasons = eligibility?.blockingReasons || [];
    const safetyStatus = safety?.status || 'unknown';

    const prompt = `You are PayResolve, an AI Revenue Recovery Agent. You analyze failed payments and recommend the best recovery action.

CRITICAL RULE: You can RECOMMEND, but the deterministic safety engine has the final say. You CANNOT override financial safety rules.

## Payment Facts
- Payment ID: ${payment.payment_id}
- Order ID: ${payment.order_id}
- Amount: ₹${payment.amount}
- Currency: ${payment.currency || 'INR'}
- Method: ${payment.payment_method}
- Status: ${payment.status}
- Customer: ${payment.customer_name} (${payment.customer_email})
- Created: ${payment.created_at}

## Failure Analysis
- Category: ${payment.failure_category}
- Reason: ${payment.failure_reason}
- Retry count: ${payment.retry_count}
- Previous retry result: ${payment.previous_retry_result}
- Refund status: ${payment.refund_status}

## Deterministic Recovery Analysis (verified by engine)
- Recovery Score: ${score}/100
- Eligible for automated recovery: ${eligibility?.eligible ? 'YES' : 'NO'}
- Eligibility blocking reasons: ${blockingReasons.length > 0 ? blockingReasons.join('; ') : 'None'}
- Deterministic recommended action: ${action?.action} (${action?.label})
- Safety validation: ${safetyStatus.toUpperCase()}
- Safety blocks: ${safety?.blocks?.length > 0 ? safety.blocks.join('; ') : 'None'}

## Your Task
Based on the verified data above, provide a recovery recommendation. You must:
1. Recommend the best action (one of: retry, customer_outreach, manual_followup, none)
2. Provide a confidence score (0-100)
3. Explain why this action was recommended
4. Explain why an alternative action was NOT selected
5. Generate a customer-safe message (polite, no financial jargon)
6. Generate merchant guidance for the operations team

RULES:
- Never invent facts not present in the data above.
- If the safety engine BLOCKED the action, you MUST recommend "manual_followup" as the alternative.
- Be concise, specific, and professional.
- The customer message must be safe to send to a real customer.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          recommended_action: { type: 'string', description: 'retry, customer_outreach, manual_followup, or none' },
          confidence: { type: 'number', description: '0-100' },
          reason: { type: 'string' },
          why_not_alternative: { type: 'string' },
          customer_message: { type: 'string' },
          merchant_guidance: { type: 'string' },
        },
        required: ['recommended_action', 'confidence', 'reason', 'why_not_alternative', 'customer_message', 'merchant_guidance'],
      },
    });

    return Response.json({ recommendation: result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}