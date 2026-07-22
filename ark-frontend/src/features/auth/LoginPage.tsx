import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ShieldCheck, Bell, Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/authStore'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})

type FormData = z.infer<typeof schema>

const DEMO_ACCOUNTS = [
  { label: 'Admin',           sub: 'Superuser, full access',  email: 'admin@ark.test',  password: 'Test1234!' },
  { label: 'Tenant',          sub: 'Onboarded, dashboard',    email: 'tenant@ark.test', password: 'Test1234!' },
  { label: 'New tenant',      sub: 'Lands in onboarding',     email: 'new@ark.test',    password: 'Test1234!' },
]

export function LoginPage() {
  const { login } = useAuthStore()
  const [error, setError] = useState('')
  const [demoLoadingEmail, setDemoLoadingEmail] = useState<string | null>(null)

  const {
    register: field,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const doLogin = async (email: string, password: string) => {
    await login(email, password)
    const user = useAuthStore.getState().user
    const dest = user?.onboarding_complete ? '/dashboard' : '/onboarding'
    window.location.assign(dest)
  }

  const loginAsDemo = async (email: string, password: string) => {
    setError('')
    setValue('email', email)
    setValue('password', password)
    setDemoLoadingEmail(email)
    try {
      await doLogin(email, password)
    } catch (e) {
      console.error('[demo-login] failed', e)
      setError('Demo login failed: ' + (e instanceof Error ? e.message : String(e)))
      setDemoLoadingEmail(null)
    }
  }

  const onSubmit = async (data: FormData) => {
    setError('')
    try {
      await doLogin(data.email, data.password)
    } catch {
      setError('Invalid email or password.')
    }
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel — left */}
      <aside className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 text-white relative overflow-hidden">
        {/* Background hero video — autoplays muted+looping for visitors */}
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src="/landing.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
        />
        {/* Legibility overlay so the white copy stays readable over the video */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/80 via-primary-800/65 to-primary-700/55" />
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_20%,white,transparent_60%)]" />
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_70%_90%,white,transparent_50%)]" />

        <div className="relative">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur grid place-items-center font-bold ring-1 ring-white/30">A</div>
            <span className="font-semibold tracking-tight text-lg">Ark</span>
          </div>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-4xl font-semibold tracking-tight leading-[1.1]">
            Never miss a rent cheque again.
          </h2>
          <p className="text-white/80 mt-4 text-[15px] leading-relaxed">
            Ark watches your post-dated cheque schedule and reminds you on WhatsApp,
            email, and SMS — long before the bank does.
          </p>

          <ul className="mt-10 space-y-3.5 text-sm">
            <li className="flex items-center gap-3 text-white/90">
              <span className="grid place-items-center w-7 h-7 rounded-lg bg-white/15 ring-1 ring-white/20"><Bell size={14} /></span>
              Multi-channel reminders 30, 7 and 1 day before
            </li>
            <li className="flex items-center gap-3 text-white/90">
              <span className="grid place-items-center w-7 h-7 rounded-lg bg-white/15 ring-1 ring-white/20"><ShieldCheck size={14} /></span>
              EJARI &amp; lease docs encrypted on AWS S3
            </li>
            <li className="flex items-center gap-3 text-white/90">
              <span className="grid place-items-center w-7 h-7 rounded-lg bg-white/15 ring-1 ring-white/20"><Sparkles size={14} /></span>
              Built for the Dubai post-dated cheque flow
            </li>
          </ul>
        </div>

        <div className="relative text-xs text-white/70">
          © {new Date().getFullYear()} Ark. Made for Dubai tenants.
        </div>
      </aside>

      {/* Form panel — right */}
      <section className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 rounded-xl bg-primary-500 grid place-items-center text-white font-bold">A</div>
            <span className="font-semibold tracking-tight text-lg">Ark</span>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-sm text-neutral-500 mt-1.5">
            Sign in to see your cheque schedule.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-8">
            <div>
              <label className="text-[13px] font-medium text-neutral-700 mb-1.5 block">Email</label>
              <Input {...field('email')} type="email" placeholder="you@example.com" className="h-10" />
              {errors.email && <p className="text-xs text-danger-500 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[13px] font-medium text-neutral-700">Password</label>
                <Link to="/forgot-password" className="text-[12px] text-neutral-500 hover:text-primary-700 transition-colors">
                  Forgot?
                </Link>
              </div>
              <Input {...field('password')} type="password" placeholder="••••••••" className="h-10" />
              {errors.password && <p className="text-xs text-danger-500 mt-1">{errors.password.message}</p>}
            </div>

            {error && (
              <div className="text-xs text-danger-700 bg-danger-50 ring-1 ring-danger-500/20 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 bg-primary-600 hover:bg-primary-700 text-white shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
            >
              {isSubmitting ? 'Signing in…' : (
                <>Sign in <ArrowRight size={15} className="ml-1" /></>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-neutral-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-700 font-medium hover:underline">
              Create one
            </Link>
          </p>

          {/* Test credentials */}
          <div className="mt-10 pt-6 border-t border-dashed border-neutral-200">
            <div className="flex items-center justify-between mb-3">
              <span className="eyebrow">Test mode · click to log in</span>
            </div>
            <ul className="space-y-1.5">
              {DEMO_ACCOUNTS.map((a) => {
                const loading = demoLoadingEmail === a.email
                const anyLoading = demoLoadingEmail !== null || isSubmitting
                return (
                  <li key={a.email}>
                    <button
                      type="button"
                      disabled={anyLoading}
                      onClick={() => loginAsDemo(a.email, a.password)}
                      className="group w-full text-left flex items-center justify-between gap-4 px-3 py-2.5 rounded-xl ring-1 ring-neutral-200/70 bg-white hover:ring-primary-500/40 hover:bg-primary-50/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-neutral-900">
                          {a.label}
                          {loading && <span className="text-neutral-500 font-normal ml-1.5">— signing in…</span>}
                        </div>
                        <div className="text-[11px] text-neutral-500 num truncate">
                          {a.email} · {a.password}
                        </div>
                      </div>
                      <ArrowRight size={14} className="text-neutral-300 group-hover:text-primary-600 transition-colors shrink-0" />
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
