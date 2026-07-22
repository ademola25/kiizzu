import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ShieldCheck, Sparkles, Bell, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/authStore'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().regex(/^\+971\d{9}$/, 'Format: +971XXXXXXXXX'),
  password: z.string().min(6, 'Minimum 6 characters'),
})

type FormData = z.infer<typeof schema>

export function RegisterPage() {
  const navigate = useNavigate()
  const register = useAuthStore((s) => s.register)
  const [error, setError] = useState('')

  const {
    register: field,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setError('')
    try {
      await register(data)
      navigate('/onboarding')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string; email?: string[] } } })?.response?.data
      setError(msg?.detail || msg?.email?.[0] || 'Registration failed. Try again.')
    }
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1.1fr_1fr]">
      <aside className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_20%,white,transparent_60%)]" />
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_70%_90%,white,transparent_50%)]" />

        <div className="relative">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur grid place-items-center font-bold ring-1 ring-white/30">A</div>
            <span className="font-semibold tracking-tight text-lg">Ark</span>
          </Link>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-4xl font-semibold tracking-tight leading-[1.1]">
            One‑time setup. Years of peace of mind.
          </h2>
          <p className="text-white/80 mt-4 text-[15px] leading-relaxed">
            Add your lease once. We'll generate the post-dated cheque schedule and remind you on
            every channel — so a missed cheque never costs you a fee again.
          </p>

          <ul className="mt-10 space-y-3.5 text-sm">
            <li className="flex items-center gap-3 text-white/90">
              <span className="grid place-items-center w-7 h-7 rounded-lg bg-white/15 ring-1 ring-white/20"><Sparkles size={14} /></span>
              Smart cheque schedule from your lease
            </li>
            <li className="flex items-center gap-3 text-white/90">
              <span className="grid place-items-center w-7 h-7 rounded-lg bg-white/15 ring-1 ring-white/20"><Bell size={14} /></span>
              WhatsApp + email reminders, ahead of time
            </li>
            <li className="flex items-center gap-3 text-white/90">
              <span className="grid place-items-center w-7 h-7 rounded-lg bg-white/15 ring-1 ring-white/20"><ShieldCheck size={14} /></span>
              Lease &amp; EJARI documents stored securely
            </li>
          </ul>
        </div>

        <div className="relative text-xs text-white/70">
          © {new Date().getFullYear()} Ark. Made for Dubai tenants.
        </div>
      </aside>

      <section className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 rounded-xl bg-primary-500 grid place-items-center text-white font-bold">A</div>
            <span className="font-semibold tracking-tight text-lg">Ark</span>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight">Create your account</h1>
          <p className="text-sm text-neutral-500 mt-1.5">
            Takes about 2 minutes. No credit card required.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-8">
            <div>
              <label className="text-[13px] font-medium text-neutral-700 mb-1.5 block">Full name</label>
              <Input {...field('name')} placeholder="Ravi Kumar" className="h-10" />
              {errors.name && <p className="text-xs text-danger-500 mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="text-[13px] font-medium text-neutral-700 mb-1.5 block">Email</label>
              <Input {...field('email')} type="email" placeholder="you@example.com" className="h-10" />
              {errors.email && <p className="text-xs text-danger-500 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="text-[13px] font-medium text-neutral-700 mb-1.5 block">Phone</label>
              <Input {...field('phone')} placeholder="+971501234567" className="h-10 num" />
              {errors.phone && <p className="text-xs text-danger-500 mt-1">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="text-[13px] font-medium text-neutral-700 mb-1.5 block">Password</label>
              <Input {...field('password')} type="password" placeholder="At least 6 characters" className="h-10" />
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
              {isSubmitting ? 'Creating account…' : (
                <>Create account <ArrowRight size={15} className="ml-1" /></>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-neutral-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-700 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </div>
  )
}
