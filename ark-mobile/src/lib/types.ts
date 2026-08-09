// Shapes mirror the Django REST serializers — keep them in sync if the
// backend serializers change.

export type PaymentStatus = 'pending' | 'ready' | 'completed';

export type PaymentSchedule = {
  id: number;
  cheque_number: number;
  due_date: string; // YYYY-MM-DD
  amount: string; // decimal as string
  status: PaymentStatus;
  /** ISO 4217, denormalised from the lease so a payment formats standalone. */
  currency?: string;
  reminder_30d_sent: boolean;
  reminder_7d_sent: boolean;
  reminder_1d_sent: boolean;
  created_at: string;
};

export type Tier = 'free' | 'starter' | 'pro';

export type Subscription = {
  tier: Tier;
  active: boolean;
  created_at: string; // ISO datetime
};

export type DocumentType = 'lease' | 'ejari' | 'emirates_id' | 'passport' | 'license' | 'other';

export type Document = {
  id: number;
  filename: string;
  document_type: DocumentType;
  file_size: number; // bytes
  content_type: string;
  uploaded_at: string; // ISO datetime
};

export type ReminderChannel = 'whatsapp' | 'email';
export type ReminderStatus = 'sent' | 'delivered' | 'failed';
export type ReminderType = '30d' | '7d' | '1d';

export type ReminderLog = {
  id: number;
  channel: ReminderChannel;
  reminder_type: ReminderType;
  status: ReminderStatus;
  error_message: string;
  sent_at: string; // ISO datetime
  delivered_at: string | null;
};

export type ChequePattern = 1 | 2 | 3 | 4 | 6 | 12;

export type Lease = {
  id: number;
  building_name: string;
  area: string;
  city?: string;
  /** ISO 3166-1 alpha-2 */
  country?: string;
  /** ISO 4217 */
  currency?: string;
  unit_number: string;
  address: string;
  cheque_pattern: ChequePattern;
  start_date: string;
  rent_amount: string;
  payment_schedules?: PaymentSchedule[];
  created_at: string;
  updated_at: string;
};
