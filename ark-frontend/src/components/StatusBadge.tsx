interface Props {
  status: string
  daysUntil?: number
}

const STYLES: Record<string, { dot: string; text: string; bg: string; ring: string; label: string }> = {
  completed: { dot: 'bg-primary-500', text: 'text-primary-700', bg: 'bg-primary-50', ring: 'ring-primary-500/20', label: 'Completed' },
  ready:     { dot: 'bg-primary-500', text: 'text-primary-700', bg: 'bg-primary-50', ring: 'ring-primary-500/20', label: 'Ready' },
  pending:   { dot: 'bg-warning-500', text: 'text-warning-700', bg: 'bg-warning-50', ring: 'ring-warning-500/20', label: 'Pending' },
  future:    { dot: 'bg-neutral-300', text: 'text-neutral-600', bg: 'bg-neutral-100', ring: 'ring-neutral-200',    label: 'Future' },
}

export function StatusBadge({ status, daysUntil }: Props) {
  const s = STYLES[status] || STYLES.future
  const label =
    daysUntil !== undefined && status === 'pending'
      ? `${daysUntil} day${daysUntil === 1 ? '' : 's'}`
      : s.label

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-full ring-1 num ${s.bg} ${s.ring} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {label}
    </span>
  )
}
