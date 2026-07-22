import { Check } from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import { formatAED } from '@/utils/formatCurrency'
import { formatDate, daysUntil } from '@/utils/formatDate'
import type { PaymentSchedule } from '@/api/hooks'

interface Props {
  payment: PaymentSchedule
}

export function PaymentCard({ payment }: Props) {
  const days = daysUntil(payment.due_date)
  const isCompleted = payment.status === 'completed'
  const isReady = payment.status === 'ready'

  return (
    <div className="flex items-center justify-between gap-3 px-5 py-4 first:rounded-t-2xl last:rounded-b-2xl hover:bg-neutral-50/60 transition-colors">
      <div className="flex items-center gap-4 min-w-0">
        <div
          className={`shrink-0 w-9 h-9 rounded-xl grid place-items-center text-xs font-semibold transition-colors ${
            isCompleted
              ? 'bg-primary-500 text-white shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
              : isReady
              ? 'bg-primary-50 ring-1 ring-primary-500/30 text-primary-700'
              : 'bg-white ring-1 ring-neutral-200 text-neutral-500'
          }`}
        >
          {isCompleted || isReady ? <Check size={15} /> : payment.cheque_number}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-neutral-900 truncate">
            {formatDate(payment.due_date)}
          </div>
          <div className="text-xs text-neutral-500 num">{formatAED(payment.amount)}</div>
        </div>
      </div>
      <StatusBadge status={payment.status} daysUntil={payment.status === 'pending' ? days : undefined} />
    </div>
  )
}
