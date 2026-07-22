import { usePayments, useMarkReady } from '@/api/hooks'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/PageHeader'
import { useAuthStore } from '@/store/authStore'
import { Home } from 'lucide-react'
import { CountdownHero } from './CountdownHero'
import { PaymentCard } from './PaymentCard'

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const { data: payments, isLoading, error } = usePayments()
  const markReady = useMarkReady()
  const firstName = user?.name?.split(' ')[0]

  if (isLoading) {
    return (
      <>
        <PageHeader eyebrow="Overview" title="Dashboard" description="Loading your cheque schedule…" />
        <Skeleton className="h-56 rounded-3xl mb-8" />
        <Skeleton className="h-14 mb-2 rounded-2xl" />
        <Skeleton className="h-14 mb-2 rounded-2xl" />
        <Skeleton className="h-14 rounded-2xl" />
      </>
    )
  }

  if (error || !payments) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <div className="surface-card p-8 text-center text-neutral-500">
          Unable to load your payment schedule. Please try again.
        </div>
      </>
    )
  }

  if (payments.length === 0) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <div className="surface-card text-center py-20 px-6">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-primary-50 ring-1 ring-primary-100 grid place-items-center mb-4">
            <Home size={20} className="text-primary-700" />
          </div>
          <h3 className="text-base font-semibold text-neutral-900">No lease set up yet</h3>
          <p className="text-sm text-neutral-500 mt-1.5 max-w-sm mx-auto">
            Complete onboarding to generate your post-dated cheque schedule.
          </p>
        </div>
      </>
    )
  }

  const nextPayment = payments.find((p) => p.status !== 'completed') || payments[payments.length - 1]
  const completed = payments.filter((p) => p.status === 'completed').length
  const total = payments.length
  const remainingTotal = payments
    .filter((p) => p.status !== 'completed')
    .reduce((s, p) => s + Number(p.amount || 0), 0)

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title={firstName ? `Hello, ${firstName}` : 'Dashboard'}
        description="Your post-dated cheque schedule, with a heads-up before every due date."
      />

      <CountdownHero
        payment={nextPayment}
        onMarkReady={(id) => markReady.mutate(id)}
        isMarking={markReady.isPending}
      />

      <div className="grid sm:grid-cols-3 gap-4 mt-6">
        <div className="surface-card px-5 py-4">
          <div className="eyebrow">Cheques completed</div>
          <div className="text-2xl font-semibold tracking-tight num mt-1.5">
            {completed}<span className="text-neutral-400 font-normal text-base">/{total}</span>
          </div>
        </div>
        <div className="surface-card px-5 py-4">
          <div className="eyebrow">Remaining due</div>
          <div className="text-2xl font-semibold tracking-tight num mt-1.5">
            AED {remainingTotal.toLocaleString()}
          </div>
        </div>
        <div className="surface-card px-5 py-4">
          <div className="eyebrow">Schedule</div>
          <div className="text-2xl font-semibold tracking-tight num mt-1.5">
            {total} cheque{total === 1 ? '' : 's'}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-10 mb-3">
        <h2 className="text-sm font-semibold tracking-tight text-neutral-900">Payment schedule</h2>
        <span className="eyebrow">{completed} of {total} done</span>
      </div>

      <div className="surface-card divide-y divide-neutral-100">
        {payments.map((payment) => (
          <PaymentCard key={payment.id} payment={payment} />
        ))}
      </div>
    </>
  )
}
