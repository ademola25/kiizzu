import type { ReactNode } from 'react'

interface Props {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
}

export function PageHeader({ eyebrow, title, description, action }: Props) {
  return (
    <div className="flex items-end justify-between gap-6 mb-8 flex-wrap">
      <div>
        {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-neutral-500 mt-1.5 max-w-xl">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
