import { useQuery } from '@tanstack/react-query'
import { Bell, Smartphone, Mail, Check, AlertTriangle } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Skeleton } from '@/components/ui/skeleton'
import api from '@/api/client'

interface ReminderLog {
  id: number
  channel: 'whatsapp' | 'email'
  reminder_type: string
  status: 'sent' | 'delivered' | 'failed'
  sent_at: string
}

const STATUS = {
  delivered: { text: 'text-primary-700', bg: 'bg-primary-50',  ring: 'ring-primary-500/20', dot: 'bg-primary-500',  icon: Check,          label: 'Delivered' },
  sent:      { text: 'text-warning-700', bg: 'bg-warning-50',  ring: 'ring-warning-500/20', dot: 'bg-warning-500',  icon: Check,          label: 'Sent' },
  failed:    { text: 'text-danger-700',  bg: 'bg-danger-50',   ring: 'ring-danger-500/20',  dot: 'bg-danger-500',   icon: AlertTriangle,  label: 'Failed' },
} as const

export function NotificationsPage() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['reminders'],
    queryFn: async () => {
      const { data } = await api.get('/reminders/')
      return data.results as ReminderLog[]
    },
  })

  const grouped = (logs || []).reduce<Record<string, ReminderLog[]>>((acc, log) => {
    const date = new Date(log.sent_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    ;(acc[date] ??= []).push(log)
    return acc
  }, {})

  return (
    <>
      <PageHeader
        eyebrow="Activity"
        title="Notifications"
        description="Every reminder Ark has sent, with delivery status."
      />

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
      ) : !logs?.length ? (
        <div className="surface-card text-center py-20 px-6">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-neutral-100 grid place-items-center mb-4">
            <Bell size={20} className="text-neutral-400" />
          </div>
          <h3 className="text-base font-semibold text-neutral-900">No notifications yet</h3>
          <p className="text-sm text-neutral-500 mt-1.5 max-w-sm mx-auto">
            You'll see WhatsApp and email reminder history here as soon as we send the first one.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([date, items]) => (
            <section key={date}>
              <div className="eyebrow mb-3">{date}</div>
              <div className="surface-card divide-y divide-neutral-100">
                {items.map((log) => {
                  const s = STATUS[log.status] ?? STATUS.failed
                  const Icon = log.channel === 'whatsapp' ? Smartphone : Mail
                  return (
                    <div key={log.id} className="flex items-center gap-4 px-5 py-4 first:rounded-t-2xl last:rounded-b-2xl">
                      <div className="shrink-0 w-10 h-10 rounded-xl bg-primary-50 ring-1 ring-primary-100 grid place-items-center">
                        <Icon size={16} className="text-primary-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-neutral-900">
                          {log.channel === 'whatsapp' ? 'WhatsApp' : 'Email'} reminder
                          <span className="text-neutral-400 mx-1.5">·</span>
                          <span className="text-neutral-500 font-normal">{log.reminder_type} before due</span>
                        </div>
                        <div className="text-xs text-neutral-500 mt-0.5 num">
                          {new Date(log.sent_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-full ring-1 ${s.bg} ${s.ring} ${s.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                        {s.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  )
}
