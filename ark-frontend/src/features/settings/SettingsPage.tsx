import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Sparkles, Trash2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/PageHeader'
import { useAuthStore } from '@/store/authStore'
import api from '@/api/client'

interface Sub {
  tier: string
  active: boolean
}

function Toggle({ on, onChange, disabled }: { on: boolean; onChange?: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`shrink-0 w-11 h-6 rounded-full relative transition-colors ${on ? 'bg-primary-500' : 'bg-neutral-200'} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${on ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
    </button>
  )
}

export function SettingsPage() {
  const { user, loadUser } = useAuthStore()
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp_opted_in || false)
  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [saving, setSaving] = useState(false)

  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const { data } = await api.get('/billing/subscription/')
      return data as Sub
    },
  })

  useEffect(() => {
    if (user) {
      setWhatsapp(user.whatsapp_opted_in)
      setName(user.name)
      setPhone(user.phone)
    }
  }, [user])

  const savePreferences = async () => {
    setSaving(true)
    try {
      await api.patch('/auth/me/', { name, phone, whatsapp_opted_in: whatsapp })
      await loadUser()
    } catch {
      alert('Failed to save. Try again.')
    }
    setSaving(false)
  }

  const handleDeleteAccount = async () => {
    if (!confirm('This permanently deletes your account and all data. Continue?')) return
    const input = prompt('Type DELETE to confirm:')
    if (input !== 'DELETE') return
    await api.delete('/auth/me/delete/')
    window.location.href = '/login'
  }

  const isFree = !subscription || subscription.tier === 'free'

  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Manage your profile, reminder channels, and subscription."
      />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* LEFT */}
        <div className="space-y-6">
          {/* Reminders */}
          <section>
            <div className="eyebrow mb-3">Reminders</div>
            <div className="surface-card divide-y divide-neutral-100">
              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <div className="text-sm font-medium text-neutral-900">WhatsApp</div>
                  <div className="text-xs text-neutral-500 mt-0.5">Faster, with read receipts</div>
                </div>
                <Toggle on={whatsapp} onChange={() => setWhatsapp(!whatsapp)} />
              </div>
              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <div className="text-sm font-medium text-neutral-900">Email</div>
                  <div className="text-xs text-neutral-500 mt-0.5">Always on — required for billing</div>
                </div>
                <Toggle on disabled />
              </div>
            </div>
          </section>

          {/* Profile */}
          <section>
            <div className="eyebrow mb-3">Profile</div>
            <div className="surface-card p-5 space-y-4">
              <div>
                <label className="text-[13px] font-medium text-neutral-700 mb-1.5 block">Full name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="h-10" />
              </div>
              <div>
                <label className="text-[13px] font-medium text-neutral-700 mb-1.5 block">Phone</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-10 num" />
              </div>
              <Button
                onClick={savePreferences}
                disabled={saving}
                className="w-full h-10 bg-primary-600 hover:bg-primary-700 text-white shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
              >
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </section>
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
          {/* Plan */}
          <section>
            <div className="eyebrow mb-3">Plan</div>
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 text-white p-6 shadow-[0_4px_24px_-12px_rgba(34,197,94,0.5)]">
              <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_85%_15%,white,transparent_50%)]" />
              <div className="relative">
                <div className="flex items-center gap-2 text-xs text-white/80">
                  <Sparkles size={14} />
                  Current plan
                </div>
                <div className="text-2xl font-semibold tracking-tight mt-1.5">
                  {subscription?.tier ? subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1) : 'Free'}
                </div>
                {isFree ? (
                  <>
                    <p className="text-sm text-white/85 mt-2 max-w-sm">
                      Upgrade to Starter for WhatsApp reminders and SMS fallback.
                    </p>
                    <div className="flex items-baseline gap-1 mt-5">
                      <span className="text-3xl font-semibold tracking-tight num">AED 15</span>
                      <span className="text-sm text-white/70">/month</span>
                    </div>
                    <Button
                      onClick={async () => {
                        try {
                          const { data } = await api.post('/billing/checkout/', { tier: 'starter' })
                          window.location.href = data.checkout_url
                        } catch {
                          alert('Billing not available yet.')
                        }
                      }}
                      className="mt-5 h-10 bg-white text-primary-700 hover:bg-white/90 font-medium"
                    >
                      Upgrade to Starter <ArrowRight size={14} className="ml-1" />
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-white/85 mt-2">Active subscription. You're all set.</p>
                )}
              </div>
            </div>
          </section>

          {/* Danger zone */}
          <section>
            <div className="eyebrow mb-3 text-danger-700">Danger zone</div>
            <div className="surface-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-neutral-900">Delete account</div>
                  <p className="text-xs text-neutral-500 mt-1 max-w-sm">
                    Permanently removes your lease, payment schedule, documents, and reminder history. This cannot be undone.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteAccount}
                  className="text-danger-700 ring-danger-500/20 hover:bg-danger-50 hover:text-danger-700"
                >
                  <Trash2 size={14} className="mr-1" /> Delete
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
