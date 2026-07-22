import { ArrowRight, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { LeaseFormData } from '../OnboardingWizard'

const PATTERNS = [
  { value: 1, name: 'Annual',     count: '1 cheque' },
  { value: 2, name: '6-monthly',  count: '2 cheques' },
  { value: 3, name: '4-monthly',  count: '3 cheques' },
  { value: 4, name: 'Quarterly',  count: '4 cheques' },
  { value: 6, name: 'Bi-monthly', count: '6 cheques' },
]

interface Props {
  data: LeaseFormData
  onUpdate: (data: Partial<LeaseFormData>) => void
  onBack: () => void
  onNext: () => void
}

export function LeaseStep({ data, onUpdate, onBack, onNext }: Props) {
  const isValid = data.start_date && data.rent_amount && data.cheque_pattern > 0

  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">Your lease details</h2>
      <p className="text-sm text-neutral-500 mt-1.5">We'll use this to build your cheque schedule.</p>

      <div className="grid grid-cols-2 gap-4 mt-7">
        <div>
          <label className="text-[13px] font-medium text-neutral-700 mb-1.5 block">Lease start date</label>
          <Input
            type="date"
            value={data.start_date}
            onChange={(e) => onUpdate({ start_date: e.target.value })}
            className="h-10 num"
          />
        </div>
        <div>
          <label className="text-[13px] font-medium text-neutral-700 mb-1.5 block">Annual rent (AED)</label>
          <Input
            type="number"
            value={data.rent_amount}
            onChange={(e) => onUpdate({ rent_amount: e.target.value })}
            placeholder="90,000"
            className="h-10 num"
          />
        </div>
      </div>

      <div className="mt-6">
        <label className="text-[13px] font-medium text-neutral-700 mb-2.5 block">How do you pay?</label>
        <div className="grid grid-cols-3 gap-2">
          {PATTERNS.map((p) => {
            const active = data.cheque_pattern === p.value
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => onUpdate({ cheque_pattern: p.value })}
                className={`p-3 rounded-xl text-left transition-all ${
                  active
                    ? 'ring-2 ring-primary-500 bg-primary-50'
                    : 'ring-1 ring-neutral-200 bg-white hover:ring-primary-500/40'
                }`}
              >
                <div className={`text-sm font-semibold ${active ? 'text-primary-700' : 'text-neutral-900'}`}>{p.name}</div>
                <div className="text-[11px] text-neutral-500 mt-0.5 num">{p.count}</div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={onBack} className="h-10">
          <ArrowLeft size={15} className="mr-1" /> Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!isValid}
          className="h-10 bg-primary-600 hover:bg-primary-700 text-white shadow-[0_1px_2px_rgba(0,0,0,0.06)] px-5"
        >
          Continue <ArrowRight size={15} className="ml-1" />
        </Button>
      </div>
    </div>
  )
}
