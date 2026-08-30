import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Check, Copy, Home, KeyRound, Loader2, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react'
import api from '@/api/client'
import { COUNTRIES, DEFAULT_COUNTRY } from '@/lib/countries'
import { composeE164, isValidPhone, phonePlaceholder } from '@/lib/phone'
import hero640 from '@/assets/hero-640.jpg'
import hero1024 from '@/assets/hero-1024.jpg'
import hero1672 from '@/assets/hero-1672.jpg'

type Audience = 'tenant' | 'expat' | 'family' | 'first_time_renter' | 'property_manager' | 'other'

type WaitlistResponse = {
  name: string
  email: string
  referral_code: string
  position: number
  referrals: number
  founding_member: boolean
}

const audienceOptions: { value: Audience; label: string }[] = [
  { value: 'tenant', label: 'Tenant' },
  { value: 'expat', label: 'Moving to Dubai' },
  { value: 'family', label: 'Couple or family' },
  { value: 'first_time_renter', label: 'First-time renter' },
  { value: 'property_manager', label: 'Property manager' },
  { value: 'other', label: 'Other' },
]

export function WaitlistPage() {
  const referral = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    return (params.get('ref') || '').trim().toUpperCase()
  }, [])

  // Guess the country from the browser's locale so most people never touch the
  // picker. Falls back to the launch market rather than to a blank selection.
  const initialCountry = useMemo(() => {
    const tags = [navigator.language, ...(navigator.languages || [])]
    for (const tag of tags) {
      const region = String(tag || '').split('-')[1]?.toUpperCase()
      if (region && COUNTRIES.some((c) => c.code === region)) return region
    }
    return DEFAULT_COUNTRY
  }, [])

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    country: initialCountry,
    audience: 'tenant' as Audience,
  })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [signup, setSignup] = useState<WaitlistResponse | null>(null)
  const [copied, setCopied] = useState(false)

  const referralLink = signup
    ? `${window.location.origin}/waitlist?ref=${signup.referral_code}`
    : ''

  async function submitWaitlist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // Phone is optional, but a number that cannot be dialled back is worse than
    // none at all — it looks like a working contact in the admin list.
    const dial = COUNTRIES.find((c) => c.code === form.country)?.dial ?? ''
    const phone = form.phone.trim() ? composeE164(dial, form.phone) : ''
    if (phone && !isValidPhone(phone)) {
      setStatus('error')
      setMessage('That phone number does not look right. Check the country and try again.')
      return
    }

    setStatus('submitting')
    setMessage('')

    try {
      const { country: _country, ...rest } = form
      const { data } = await api.post<WaitlistResponse>('/waitlist/?source=landing_page', {
        ...rest,
        phone,
        referral,
      })
      setSignup(data)
      setStatus('success')
    } catch (error: any) {
      const detail = error?.response?.data?.email?.[0] || error?.response?.data?.detail
      setMessage(detail || 'We could not add you right now. Please try again.')
      setStatus('error')
    }
  }

  async function copyReferralLink() {
    if (!referralLink) return
    await navigator.clipboard.writeText(referralLink)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <main className="min-h-svh bg-[#f7f1e8] text-[#17231b]">
      <section className="relative isolate overflow-hidden">
        <img
          src={hero1024}
          srcSet={`${hero640} 640w, ${hero1024} 1024w, ${hero1672} 1672w`}
          sizes="100vw"
          alt=""
          aria-hidden="true"
          decoding="async"
          fetchPriority="high"
          className="absolute inset-0 -z-20 size-full object-cover object-center"
        />
        {/* The 90deg scrim only makes sense once the copy sits in a left column.
            On one-column layouts it cut a hard vertical seam across the page, so
            narrow viewports get a top-down scrim instead. */}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(247,241,232,0.97)_0%,rgba(247,241,232,0.93)_45%,rgba(247,241,232,0.96)_100%)] lg:bg-[linear-gradient(90deg,rgba(247,241,232,0.98)_0%,rgba(247,241,232,0.92)_35%,rgba(247,241,232,0.52)_66%,rgba(247,241,232,0.20)_100%)]" />

        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-start gap-8 py-[clamp(1.5rem,4vw,2.5rem)] pl-[max(1.25rem,env(safe-area-inset-left))] pr-[max(1.25rem,env(safe-area-inset-right))] sm:gap-10 lg:min-h-svh lg:grid-cols-[minmax(0,1fr)_430px] lg:items-center lg:px-10">
          <div className="max-w-2xl py-[clamp(0.5rem,3vw,2.5rem)] lg:py-16">
            <div className="mb-[clamp(2rem,6vw,3rem)] flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-lg bg-[#263b2d] text-[#f7f1e8] shadow-sm">
                <KeyRound className="size-5" />
              </div>
              <div>
                <p className="text-xl font-semibold tracking-[0.01em]">Tentzu</p>
                <p className="text-sm text-[#5e665e]">Rent reminders for calmer renting</p>
              </div>
            </div>

            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#c8a46a]/45 bg-[#fffaf1]/80 px-3 py-1 text-sm font-medium text-[#7c4b2d]">
              <Sparkles className="size-4" />
              Early access waitlist now open
            </p>

            <h1 className="max-w-3xl text-balance text-[clamp(2.5rem,min(9vw,11vh),4.5rem)] font-semibold leading-[1.02] tracking-normal text-[#17231b]">
              Never let rent day catch you off guard.
            </h1>
            <p className="mt-5 max-w-xl text-pretty text-[clamp(1.0625rem,2.2vw,1.25rem)] leading-[1.6] text-[#4f5a51]">
              Tentzu keeps your rent date, amount, and obligations in view before they become stressful.
              Join the first group to get access when we launch.
            </p>

            <div className="mt-[clamp(2rem,5vw,2.5rem)] grid max-w-2xl grid-cols-[repeat(auto-fit,minmax(min(100%,13.5rem),1fr))] gap-3">
              <div className="rounded-lg border border-[#d8cab6] bg-[#fffaf3]/85 p-4">
                <Home className="mb-4 size-5 text-[#8b4f32]" />
                <p className="text-sm font-semibold">Built for renters</p>
                <p className="mt-1 text-sm leading-6 text-[#687068]">Dates, amounts, and reminders in one calm place.</p>
              </div>
              <div className="rounded-lg border border-[#d8cab6] bg-[#fffaf3]/85 p-4">
                <MessageCircle className="mb-4 size-5 text-[#8b4f32]" />
                <p className="text-sm font-semibold">Reminder-first</p>
                <p className="mt-1 text-sm leading-6 text-[#687068]">A simple message before your next rent obligation.</p>
              </div>
              <div className="rounded-lg border border-[#d8cab6] bg-[#fffaf3]/85 p-4">
                <ShieldCheck className="mb-4 size-5 text-[#8b4f32]" />
                <p className="text-sm font-semibold">Founding access</p>
                <p className="mt-1 text-sm leading-6 text-[#687068]">First 100 members receive a launch reward.</p>
              </div>
            </div>
          </div>

          <aside className="mb-8 w-full max-w-[30rem] justify-self-center rounded-lg border border-[#d8cab6] bg-[#fffdf8]/95 p-5 shadow-[0_20px_80px_rgba(38,59,45,0.16)] backdrop-blur sm:p-6 lg:mb-0 lg:max-w-none lg:justify-self-stretch">
            {signup ? (
              <div>
                <div className="mb-6 grid size-12 place-items-center rounded-lg bg-[#263b2d] text-[#f7f1e8]">
                  <Check className="size-6" />
                </div>
                <p className="text-sm font-medium uppercase tracking-[0.14em] text-[#8b4f32]">You are on the list</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-normal">Welcome, {signup.name.split(' ')[0]}.</h2>
                <p className="mt-3 text-sm leading-6 text-[#5e665e]">
                  You are position <span className="font-semibold text-[#17231b]">#{signup.position}</span>.
                  Share your link to move up before launch.
                </p>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-[#f3eadc] p-4">
                    <p className="text-2xl font-semibold">{signup.referrals}</p>
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#687068]">Referrals</p>
                  </div>
                  <div className="rounded-lg bg-[#eaf0e5] p-4">
                    <p className="text-2xl font-semibold">{signup.founding_member ? 'Yes' : 'Soon'}</p>
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#687068]">Founding slot</p>
                  </div>
                </div>

                <label className="mt-6 block text-sm font-medium text-[#303a32]">Your referral link</label>
                <div className="mt-2 flex gap-2">
                  <input
                    readOnly
                    value={referralLink}
                    className="h-11 min-w-0 flex-1 rounded-lg border border-[#d7cab7] bg-white px-3 text-sm text-[#303a32] outline-none"
                  />
                  <button
                    type="button"
                    onClick={copyReferralLink}
                    className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg bg-[#263b2d] text-[#fffaf3] transition hover:bg-[#1d2f23]"
                    aria-label="Copy referral link"
                    title="Copy referral link"
                  >
                    {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={submitWaitlist}>
                <p className="text-sm font-medium uppercase tracking-[0.14em] text-[#8b4f32]">Join the waitlist</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-normal">Get early access</h2>
                <p className="mt-3 text-sm leading-6 text-[#5e665e]">
                  Referral invites move you higher on the list. The first 100 receive founding member recognition.
                </p>

                {referral && (
                  <div className="mt-5 rounded-lg border border-[#d8cab6] bg-[#f3eadc] px-3 py-2 text-sm text-[#4f3b28]">
                    Referral code applied: <span className="font-semibold">{referral}</span>
                  </div>
                )}

                <div className="mt-6 space-y-4">
                  <label className="block">
                    <span className="text-sm font-medium text-[#303a32]">Name</span>
                    <input
                      required
                      value={form.name}
                      onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                      className="mt-2 h-11 w-full rounded-lg border border-[#d7cab7] bg-white px-3 text-base outline-none transition focus:border-[#263b2d] focus:ring-3 focus:ring-[#263b2d]/15"
                      placeholder="Your name"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-[#303a32]">Email</span>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                      className="mt-2 h-11 w-full rounded-lg border border-[#d7cab7] bg-white px-3 text-base outline-none transition focus:border-[#263b2d] focus:ring-3 focus:ring-[#263b2d]/15"
                      placeholder="you@example.com"
                    />
                  </label>
                  <div>
                    <label htmlFor="waitlist-phone" className="text-sm font-medium text-[#303a32]">
                      Phone <span className="font-normal text-[#656b61]">(optional)</span>
                    </label>
                    <div className="mt-2 flex flex-col gap-2 min-[360px]:flex-row">
                      {/* A native select, deliberately: iOS and Android give it a
                          real picker for 240 options, it is keyboard accessible
                          for free, and it needs no JavaScript to open. */}
                      <select
                        value={form.country}
                        onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))}
                        aria-label="Country calling code"
                        className="h-11 w-full shrink-0 rounded-lg border border-[#d7cab7] bg-white px-2 text-base outline-none transition focus:border-[#263b2d] focus:ring-3 focus:ring-[#263b2d]/15 min-[360px]:w-[7rem] sm:w-[9rem]"
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.flag} {c.dial} {c.name}
                          </option>
                        ))}
                      </select>
                      <input
                        id="waitlist-phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel-national"
                        value={form.phone}
                        onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                        className="h-11 min-w-0 flex-1 rounded-lg border border-[#d7cab7] bg-white px-3 text-base outline-none transition focus:border-[#263b2d] focus:ring-3 focus:ring-[#263b2d]/15"
                        placeholder={phonePlaceholder(form.country)}
                      />
                    </div>
                  </div>
                  <label className="block">
                    <span className="text-sm font-medium text-[#303a32]">I am a</span>
                    <select
                      value={form.audience}
                      onChange={(event) => setForm((current) => ({ ...current, audience: event.target.value as Audience }))}
                      className="mt-2 h-11 w-full rounded-lg border border-[#d7cab7] bg-white px-3 text-base outline-none transition focus:border-[#263b2d] focus:ring-3 focus:ring-[#263b2d]/15"
                    >
                      {audienceOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {status === 'error' && (
                  <p className="mt-4 rounded-lg bg-[#f8e9df] px-3 py-2 text-sm text-[#8b2f1b]">{message}</p>
                )}

                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#263b2d] px-4 text-base font-semibold text-[#fffaf3] shadow-sm transition hover:bg-[#1d2f23] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {status === 'submitting' && <Loader2 className="size-4 animate-spin" />}
                  Reserve my place
                </button>
                <p className="mt-4 text-center text-xs leading-5 text-[#656b61]">
                  No spam. Just early access updates and launch information.
                </p>
              </form>
            )}
          </aside>
        </div>
      </section>
    </main>
  )
}
