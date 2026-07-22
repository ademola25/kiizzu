import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { LeaseFormData } from '../OnboardingWizard'

interface Props {
  data: LeaseFormData
  onUpdate: (data: Partial<LeaseFormData>) => void
  onNext: () => void
}

export function PropertyStep({ data, onUpdate, onNext }: Props) {
  const isValid = data.building_name && data.area && data.unit_number && data.address

  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">Where do you live?</h2>
      <p className="text-sm text-neutral-500 mt-1.5">A few details about your property.</p>

      <div className="grid grid-cols-2 gap-4 mt-7">
        <div>
          <label className="text-[13px] font-medium text-neutral-700 mb-1.5 block">Building name</label>
          <Input
            value={data.building_name}
            onChange={(e) => onUpdate({ building_name: e.target.value })}
            placeholder="e.g. Marina Heights"
            className="h-10"
          />
        </div>
        <div>
          <label className="text-[13px] font-medium text-neutral-700 mb-1.5 block">Area / district</label>
          <Input
            value={data.area}
            onChange={(e) => onUpdate({ area: e.target.value })}
            placeholder="e.g. Dubai Marina"
            className="h-10"
          />
        </div>
        <div>
          <label className="text-[13px] font-medium text-neutral-700 mb-1.5 block">Unit number</label>
          <Input
            value={data.unit_number}
            onChange={(e) => onUpdate({ unit_number: e.target.value })}
            placeholder="e.g. 1205"
            className="h-10 num"
          />
        </div>
        <div>
          <label className="text-[13px] font-medium text-neutral-700 mb-1.5 block">Full address</label>
          <Input
            value={data.address}
            onChange={(e) => onUpdate({ address: e.target.value })}
            placeholder="1 Marina Walk, Dubai"
            className="h-10"
          />
        </div>
      </div>

      <div className="flex justify-end mt-8">
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
