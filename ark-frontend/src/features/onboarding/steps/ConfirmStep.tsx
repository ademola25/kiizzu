import { useState } from 'react'
import { ArrowLeft, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/StatusBadge'
import api from '@/api/client'
import type { LeaseFormData, PaymentScheduleItem } from '../OnboardingWizard'

interface Props {
  data: LeaseFormData
  onBack: () => void
  onConfirm: () => void
}

function formatAED(amount: string | number) {
  return `AED ${Number(amount).toLocaleString()}`
}

export function ConfirmStep({ data, onBack, onConfirm }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<PaymentScheduleItem[] | null>(null)

  const chequeAmount = data.cheque_pattern > 0
    ? (Number(data.rent_amount) / data.cheque_pattern).toFixed(2)
    : '0'

  const handleConfirm = async () => {
    setLoading(true)
    setError('')
    try {
      const { data: resp } = await api.post('/leases/create/', {
        ...data,
        rent_amount: data.rent_amount,
      })
      setPreview(resp.payment_schedules)
      onConfirm()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: Record<string, string[]> } })?.response?.data
      setError(msg ? Object.values(msg).flat().join(' ') : 'Failed to create lease.')
      setLoading(false)
    }
  }

  const localPreview = () => {
    if (!data.cheque_pattern || !data.start_date || !data.rent_amount) return []
    const startDate = new Date(data.start_date)
    const monthsBetween = 12 / data.cheque_pattern
    const amount = (Number(data.rent_amount) / data.cheque_pattern).toFixed(2)
    const today = new Date()
    const items: { cheque_number: number; due_date: string; amount: string; status: string }[] = []

    for (let i = 0; i < data.cheque_pattern; i++) {
      const d = new Date(startDate)
      d.setMonth(d.getMonth() + i * monthsBetween)
      items.push({
        cheque_number: i + 1,
        due_date: d.toISOString().split('T')[0],
        amount,
        status: d < today ? 'completed' : 'pending',
      })
    }
    return items
  }

  const displayPayments = preview || localPreview()

  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">Your cheque schedule</h2>
      <p className="text-sm text-neutral-500 mt-1.5">
        {formatAED(data.rent_amount)} ÷ {data.cheque_pattern} cheques ={' '}
        <span className="font-medium text-neutral-900 num">{formatAED(chequeAmount)}</span> each
      </p>

      <div className="mt-6 rounded-2xl ring-1 ring-neutral-200/70 bg-white divide-y divide-neutral-100">
        {displayPayments.map((p) => {
          const isDone = p.status === 'completed'
          return (
            <div key={p.cheque_number} className="flex items-center justify-between gap-3 px-5 py-4 first:rounded-t-2xl last:rounded-b-2xl">
              <div className="flex items-center gap-4 min-w-0">
                <div
                  className={`shrink-0 w-9 h-9 rounded-xl grid place-items-center text-xs font-semibold transition-colors ${
                    isDone
                      ? 'bg-primary-500 text-white'
                      : 'bg-white ring-1 ring-neutral-200 text-neutral-500'
                  }`}
                >
                  {isDone ? <Check size={15} /> : p.cheque_number}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-neutral-900 truncate">
                    {new Date(p.due_date + 'T00:00:00').toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </div>
                  <div className="text-xs text-neutral-500 num">{formatAED(p.amount)}</div>
                </div>
              </div>
              <StatusBadge status={p.status} />
            </div>
          )
        })}
      </div>

      {error && (
        <div className="text-xs text-danger-700 bg-danger-50 ring-1 ring-danger-500/20 rounded-lg px-3 py-2 mt-4">
          {error}
        </div>
      )}

      <p className="text-sm text-center text-neutral-500 mt-6">Does this look right?</p>

      <div className="flex gap-3 mt-3">
        <Button variant="outline" onClick={onBack} className="flex-1 h-10">
          <ArrowLeft size={15} className="mr-1" /> Edit
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={loading}
          className="flex-[2] h-10 bg-primary-600 hover:bg-primary-700 text-white shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
        >
          {loading ? 'Saving…' : 'Confirm schedule'}
        </Button>
      </div>
    </div>
  )
}
