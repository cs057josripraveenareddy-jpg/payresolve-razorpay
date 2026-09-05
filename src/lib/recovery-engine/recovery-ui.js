export function getStatusBadgeClass(status) {
  const map = {
    successful: 'bg-success/15 text-success border-success/30',
    failed: 'bg-destructive/15 text-destructive border-destructive/30',
    pending: 'bg-warning/15 text-warning border-warning/30',
    refunded: 'bg-muted text-muted-foreground border-border',
    allowed: 'bg-success/15 text-success border-success/30',
    blocked: 'bg-destructive/15 text-destructive border-destructive/30',
    identified: 'bg-accent/15 text-accent border-accent/30',
    recommended: 'bg-accent/15 text-accent border-accent/30',
    safety_validated: 'bg-primary/15 text-primary border-primary/30',
    approved: 'bg-primary/15 text-primary border-primary/30',
    executed: 'bg-primary/15 text-primary border-primary/30',
    recovered: 'bg-success/15 text-success border-success/30',
    stopped: 'bg-muted text-muted-foreground border-border',
    none: 'bg-muted text-muted-foreground border-border',
  };
  return map[status] || 'bg-muted text-muted-foreground border-border';
}

export function getScoreBadgeClass(score) {
  if (score >= 80) return 'bg-success/15 text-success border-success/30';
  if (score >= 60) return 'bg-primary/15 text-primary border-primary/30';
  if (score >= 40) return 'bg-warning/15 text-warning border-warning/30';
  return 'bg-destructive/15 text-destructive border-destructive/30';
}

export function getMethodLabel(method) {
  const labels = { upi: 'UPI', card: 'Card', netbanking: 'Netbanking', wallet: 'Wallet' };
  return labels[method] || method;
}

export function getFailureLabel(category) {
  const labels = {
    timeout: 'Timeout',
    bank_issue: 'Bank Issue',
    insufficient_funds: 'Insufficient Funds',
    network_error: 'Network Error',
    declined: 'Declined',
    expired_card: 'Expired Card',
    processor_error: 'Processor Error',
    pending_review: 'Pending Review',
    none: '—',
  };
  return labels[category] || category;
}