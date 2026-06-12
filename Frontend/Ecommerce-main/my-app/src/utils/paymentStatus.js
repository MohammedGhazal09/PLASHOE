export const PAYMENT_STATUS_LABELS = {
  requires_payment: 'Payment required',
  payment_pending: 'Payment pending',
  paid: 'Paid',
  payment_failed: 'Payment failed',
  payment_canceled: 'Payment canceled',
  refunded: 'Refunded',
  partially_refunded: 'Partially refunded',
  not_required: 'Payment not required',
};

export const getPaymentStatusLabel = (status) =>
  PAYMENT_STATUS_LABELS[status] || PAYMENT_STATUS_LABELS.not_required;

export const isPaymentCancellationLocked = (status) =>
  ['paid', 'refunded', 'partially_refunded'].includes(status);
