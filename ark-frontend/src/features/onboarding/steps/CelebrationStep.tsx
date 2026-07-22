import { ArrowRight, PartyPopper } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  onContinue: () => void
}

export function CelebrationStep({ onContinue }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 grid place-items-center text-white shadow-[0_10px_30px_-10px_rgba(34,197,94,0.6)]">
          <PartyPopper size={28} strokeWidth={2} />
        </div>

        <h2 className="text-3xl font-semibold tracking-tight text-neutral-950 mt-6">
          You're all set
        </h2>
        <p className="text-neutral-500 mt-3 max-w-sm mx-auto">
          Ark will remind you before every cheque on WhatsApp and email — long before the bank does.
        </p>

        <Button
          onClick={onContinue}
          className="mt-8 h-11 bg-primary-600 hover:bg-primary-700 text-white shadow-[0_1px_2px_rgba(0,0,0,0.06)] px-6"
        >
          Go to dashboard <ArrowRight size={15} className="ml-1.5" />
        </Button>
      </div>
    </div>
  )
}
