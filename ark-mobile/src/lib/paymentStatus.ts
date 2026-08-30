import { todayISO } from '@/lib/schedule';
import type { DisplayStatus, PaymentSchedule } from '@/lib/types';

/**
 * What to show for a cheque.
 *
 * The server sends `display_status`, but a client can be newer than the API it
 * is talking to — a released build must not show every cheque as "Upcoming"
 * just because the backend has not been deployed yet. So this derives the same
 * answer locally when the field is absent. The rule has to stay identical to
 * PaymentSchedule.display_status in ark/payments/models.py.
 */
export function deriveDisplayStatus(payment: PaymentSchedule): DisplayStatus {
  if (payment.display_status) return payment.display_status;
  if (payment.status === 'completed') return 'paid';
  const today = todayISO();
  if (payment.due_date < today) return 'overdue';
  if (payment.due_date === today) return 'due_today';
  return 'upcoming';
}

/**
 * Label for the badge. "Funds ready" is shown in place of "Upcoming" when the
 * tenant has set the money aside — losing that would make the one action they
 * took on a future cheque invisible. Urgency wins over it: a cheque that is due
 * today or overdue says so regardless.
 */
export function statusLabel(payment: PaymentSchedule): string {
  const display = deriveDisplayStatus(payment);
  if (display === 'upcoming' && payment.status === 'ready') return 'Funds ready';
  return { paid: 'Paid', due_today: 'Due today', overdue: 'Overdue', upcoming: 'Upcoming' }[display];
}
