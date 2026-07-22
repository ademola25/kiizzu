import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PropertyStep } from './steps/PropertyStep'
import { LeaseStep } from './steps/LeaseStep'
import { ConfirmStep } from './steps/ConfirmStep'
import { RemindersStep } from './steps/RemindersStep'
import { CelebrationStep } from './steps/CelebrationStep'

export interface LeaseFormData {
  building_name: string
  area: string
  unit_number: string
  address: string
  cheque_pattern: number
  start_date: string
  rent_amount: string
}

export interface PaymentScheduleItem {
  id: number
  cheque_number: number
  due_date: string
  amount: string
  status: string
}

const STEPS = [
  { n: 1, label: 'Property' },
  { n: 2, label: 'Lease' },
  { n: 3, label: 'Confirm' },
  { n: 4, label: 'Reminders' },
] as const

export function OnboardingWizard() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<LeaseFormData>({
    building_name: '',
    area: '',
    unit_number: '',
    address: '',
    cheque_pattern: 0,
    start_date: '',
    rent_amount: '',
  })
  const [showCelebration, setShowCelebration] = useState(false)

  const updateData = (data: Partial<LeaseFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }

  if (showCelebration) {
    return <CelebrationStep onContinue={() => navigate('/dashboard')} />
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl">
        {/* Brand mark */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-primary-500 grid place-items-center text-white font-bold shadow-[0_4px_12px_-2px_rgba(34,197,94,0.5)]">
            A
          </div>
          <span className="font-semibold tracking-tight text-lg">Ark</span>
        </div>

        <div className="surface-card p-8 md:p-10">
          {/* Stepper */}
          <div className="flex items-center justify-between mb-2">
            <span className="eyebrow">Setup</span>
            <span className="text-[11px] text-neutral-500 num">Step {step} of {STEPS.length}</span>
          </div>
          <div className="flex gap-2 mb-8">
            {STEPS.map(({ n, label }) => (
              <div key={n} className="flex-1">
                <div
                  className={`h-1.5 rounded-full transition-colors ${
                    n <= step ? 'bg-primary-500' : 'bg-neutral-200'
                  }`}
                />
                <div className={`mt-2 text-[11px] tracking-wide ${
                  n === step ? 'text-neutral-900 font-medium' : n < step ? 'text-primary-700 font-medium' : 'text-neutral-400'
                }`}>
                  {label}
                </div>
              </div>
            ))}
          </div>

          {step === 1 && (
            <PropertyStep
              data={formData}
              onUpdate={updateData}
              onNext={() => setStep(2)}
            />
          )}
          {step === 2 && (
            <LeaseStep
              data={formData}
              onUpdate={updateData}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}
          {step === 3 && (
            <ConfirmStep
              data={formData}
              onBack={() => setStep(2)}
              onConfirm={() => setStep(4)}
            />
          )}
          {step === 4 && (
            <RemindersStep
              onBack={() => setStep(3)}
              onComplete={() => setShowCelebration(true)}
            />
          )}
        </div>
      </div>
    </div>
  )
}
