import { useState } from 'react'
import { Smartphone, Mail, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import api from '@/api/client'

interface Props {
  onBack: () => void
  onComplete: () => void
}

function Toggle({ on, onChange }: { on: boolean; onChange?: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`shrink-0 w-11 h-6 rounded-full relative transition-colors ${on ? 'bg-primary-500' : 'bg-neutral-200'}`}
    >
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${on ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
    </button>
  )
}

export function RemindersStep({ onBack: _onBack, onComplete }: Props) {
  void _onBack
  const [whatsapp, setWhatsapp] = useState(true)
  const [t30, setT30] = useState(true)
  const [t7, setT7] = useState(true)
  const [t1, setT1] = useState(true)
  const [loading, setLoading] = useState(false)

  const handleComplete = async () => {
    setLoading(true)
    try {
      await api.patch('/auth/me/', { whatsapp_opted_in: whatsapp })
      onComplete()
    } catch {
      onComplete()
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">How should we remind you?</h2>
      <p className="text-sm text-neutral-500 mt-1.5">Pick channels and timings — you can change these anytime.</p>

      {/* Channels */}
      <div className="mt-7 space-y-3">
        {/* WhatsApp */}
        <div className={`rounded-2xl p-5 transition-colors ${whatsapp ? 'ring-2 ring-primary-500 bg-primary-50/40' : 'ring-1 ring-neutral-200 bg-white'}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-primary-50 ring-1 ring-primary-100 grid place-items-center">
                <Smartphone size={16} className="text-primary-700" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-neutral-900">WhatsApp</span>
                  <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded-full bg-primary-100 text-primary-700">
                    Recommended
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-1">Faster delivery, with read receipts.</p>
              </div>
            </div>
            <Toggle on={whatsapp} onChange={() => setWhatsapp(!whatsapp)} />
          </div>

          {/* Preview bubble */}
          <div className="mt-4 ml-13 max-w-[280px]">
            <div className="bg-[#dcf8c6] rounded-xl rounded-tl-sm px-3.5 py-2.5 text-[13px] leading-relaxed text-neutral-900 relative">
              <div className="font-semibold text-[12px] mb-0.5">🏠 Ark Reminder</div>
              Your rent cheque of <strong>AED 30,000</strong> is due on <strong>1 May 2026</strong> — 30 days away. Make sure funds are ready.
              <span className="absolute bottom-1 right-2 text-[10px] text-[#53bdeb]">✓✓</span>
            </div>
          </div>
        </div>

        {/* Email */}
        <div className="rounded-2xl ring-1 ring-neutral-200 bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-neutral-100 grid place-items-center">
                <Mail size={16} className="text-neutral-600" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-neutral-900">Email</span>
                  <span className="text-[11px] text-neutral-500">Always included</span>
                </div>
                <p className="text-xs text-neutral-500 mt-1">Your fallback channel.</p>
              </div>
            </div>
            <Toggle on />
          </div>
        </div>
      </div>

      {/* Timings */}
      <div className="mt-6">
        <div className="eyebrow mb-2.5">Remind me before</div>
        <div className="surface-card divide-y divide-neutral-100">
          {[
            { label: '30 days before', desc: 'A heads-up so you can move funds', value: t30, set: setT30 },
            { label: '7 days before',  desc: 'A second nudge as it gets closer', value: t7,  set: setT7  },
            { label: '1 day before',   desc: 'The final reminder',                value: t1,  set: setT1  },
          ].map(({ label, desc, value, set }) => (
            <div key={label} className="flex items-center justify-between gap-3 px-5 py-4">
              <div>
                <div className="text-sm font-medium text-neutral-900">{label}</div>
                <div className="text-xs text-neutral-500 mt-0.5">{desc}</div>
              </div>
              <Toggle on={value} onChange={() => set(!value)} />
            </div>
          ))}
        </div>
      </div>

      <Button
        onClick={handleComplete}
        disabled={loading}
        className="w-full mt-8 h-11 bg-primary-600 hover:bg-primary-700 text-white shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
      >
        {loading ? 'Saving…' : (
          <><Check size={15} className="mr-1.5" /> Complete setup</>
        )}
      </Button>
    </div>
  )
}
