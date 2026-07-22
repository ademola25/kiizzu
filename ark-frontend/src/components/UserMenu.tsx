import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, LogOut, Settings as SettingsIcon, User as UserIcon } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

function initials(name?: string) {
  if (!name) return '·'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('')
}

export function UserMenu() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  if (!user) return null

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`group flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-full transition-all ring-1 ${
          open
            ? 'bg-white ring-neutral-200 shadow-[0_4px_16px_-8px_rgba(15,23,42,0.15)]'
            : 'bg-white/70 ring-neutral-200/70 hover:bg-white hover:ring-neutral-200 hover:shadow-[0_1px_2px_rgba(15,23,42,0.04)]'
        }`}
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 grid place-items-center text-white text-[12px] font-semibold ring-2 ring-white shadow-[0_2px_6px_-2px_rgba(34,197,94,0.5)]">
          {initials(user.name)}
        </div>
        <div className="hidden sm:flex flex-col items-start min-w-0 mr-1">
          <span className="text-[13px] font-medium text-neutral-900 leading-tight truncate max-w-[140px]">
            {user.name}
          </span>
          <span className="text-[11px] text-neutral-500 leading-tight truncate max-w-[140px]">
            {user.email}
          </span>
        </div>
        <ChevronDown size={14} className={`text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-72 rounded-2xl bg-white ring-1 ring-neutral-200/70 shadow-[0_12px_32px_-8px_rgba(15,23,42,0.18)] z-50 overflow-hidden"
        >
          <div className="px-4 pt-4 pb-3 border-b border-neutral-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 grid place-items-center text-white text-sm font-semibold shadow-[0_4px_12px_-4px_rgba(34,197,94,0.6)]">
                {initials(user.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-neutral-950 truncate">{user.name}</div>
                <div className="text-xs text-neutral-500 truncate">{user.email}</div>
                {user.phone && (
                  <div className="text-[11px] text-neutral-400 num truncate mt-0.5">{user.phone}</div>
                )}
              </div>
            </div>
            {user.whatsapp_opted_in && (
              <div className="mt-3 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary-50 ring-1 ring-primary-500/20 text-[11px] font-medium text-primary-700">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                WhatsApp reminders on
              </div>
            )}
          </div>

          <div className="py-1.5">
            <button
              role="menuitem"
              onClick={() => { setOpen(false); navigate('/settings') }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <UserIcon size={15} className="text-neutral-400" />
              Profile
            </button>
            <button
              role="menuitem"
              onClick={() => { setOpen(false); navigate('/settings') }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <SettingsIcon size={15} className="text-neutral-400" />
              Account settings
            </button>
          </div>

          <div className="border-t border-neutral-100 py-1.5">
            <button
              role="menuitem"
              onClick={() => { setOpen(false); logout() }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-danger-700 hover:bg-danger-50 transition-colors"
            >
              <LogOut size={15} />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
