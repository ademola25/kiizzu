import { Button } from '@/components/ui/button'
import { Check, AlertTriangle, Calendar } from 'lucide-react'
import { formatAED } from '@/utils/formatCurrency'
import { formatDate, daysUntil } from '@/utils/formatDate'
import type { PaymentSchedule } from '@/api/hooks'

interface Props {
  payment: PaymentSchedule
  onMarkReady: (id: number) => void
  isMarking: boolean
}

export function CountdownHero({ payment, onMarkReady, isMarking }: Props) {
  const days = daysUntil(payment.due_date)
  const isUrgent = days <= 7 && payment.status === 'pending'
  const isReady = payment.status === 'ready'
  const isCompleted = payment.status === 'completed'

  const tone = isUrgent
    ? { ring: 'ring-warning-500/20', accent: 'text-warning-700', dot: 'bg-warning-500', halo: 'from-warning-500/10 to-transparent', chip: 'bg-warning-50 text-warning-700 ring-warning-500/20' }
    : { ring: 'ring-primary-500/20', accent: 'text-primary-700', dot: 'bg-primary-500', halo: 'from-primary-500/10 to-transparent', chip: 'bg-primary-50 text-primary-700 ring-primary-500/20' }

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-white ring-1 ${tone.ring} shadow-[0_4px_24px_-12px_rgba(15,23,42,0.12)]`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${tone.halo}`} />
      <div className="absolute -right-24 -top-24 w-72 h-72 rounded-full bg-gradient-to-br from-primary-100/40 to-transparent blur-3xl" />

      <div className="relative grid lg:grid-cols-[1.4fr_1fr] gap-8 p-8 lg:p-10">
        {/* Left: countdown */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] px-2.5 py-1 rounded-full ring-1 ${tone.chip}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${tone.dot} animate-pulse`} />
              {isUrgent ? 'Action soon' : isReady ? 'Funds ready' : isCompleted ? 'Cleared' : 'Upcoming'}
            </span>
            <span className="text-[11px] text-neutral-500">Cheque #{payment.cheque_number}</span>
          </div>

          <div className="text-[12px] text-neutral-500 mb-1">Next cheque due in</div>
          <div className="flex items-baseline gap-3">
            <span className={`text-7xl lg:text-8xl font-semibold tracking-tighter num leading-none ${tone.accent}`}>
              {Math.max(days, 0)}
            </span>
            <span className="text-base text-neutral-500 font-medium">
              day{days === 1 ? '' : 's'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-neutral-600 mt-5">
            <Calendar size={14} className="text-neutral-400" />
            <span>{formatDate(payment.due_date)}</span>
          </div>
        </div>

        {/* Right: amount + action */}
        <div className="lg:border-l lg:border-neutral-100 lg:pl-8 flex flex-col justify-between gap-6">
          <div>
            <div className="eyebrow">Amount</div>
            <div className="text-3xl font-semibold tracking-tight num mt-1.5">
              {formatAED(payment.amount)}
            </div>
            <p className="text-xs text-neutral-500 mt-1.5">
              Make sure this is in your bank account before the due date.
            </p>
          </div>

          {payment.status === 'pending' && (
            <Button
              onClick={() => onMarkReady(payment.id)}
              disabled={isMarking}
              className="w-full h-11 bg-primary-600 hover:bg-primary-700 text-white shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
            >
              {isMarking ? (
                'Saving…'
              ) : (
                <>
                  <Check size={15} className="mr-1.5" />
                  Mark funds ready
                </>
              )}
            </Button>
          )}

          {isReady && (
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-primary-700 bg-primary-50 ring-1 ring-primary-500/20 rounded-xl py-3">
              <Check size={15} /> Funds marked ready
            </div>
          )}

          {isCompleted && (
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-neutral-600 bg-neutral-100 rounded-xl py-3">
              <Check size={15} /> Cheque cleared
            </div>
          )}

          {isUrgent && payment.status === 'pending' && (
            <div className="flex items-start gap-2 text-xs text-warning-700 bg-warning-50 ring-1 ring-warning-500/20 rounded-xl px-3 py-2.5">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>Less than a week to go — confirm the funds are in your account.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
