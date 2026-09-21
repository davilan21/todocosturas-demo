import { useEffect, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from 'react'
import { AlertCircle, CheckCircle2, Info, Loader2, X } from 'lucide-react'
import { cn, STATUS_CLASS, STATUS_LABEL, SOURCE_LABEL } from '@/lib/utils'
import type { Confidence, InvoiceSource, InvoiceStatus } from '@/data/types'
import { useStore } from '@/store/useStore'

/* ---------- Button ---------- */
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
type Size = 'sm' | 'md'
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
}
const variants: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm',
  secondary: 'bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 shadow-sm',
  ghost: 'text-slate-600 hover:bg-slate-100',
  danger: 'bg-white text-red-600 ring-1 ring-red-200 hover:bg-red-50',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
}
export function Button({ variant = 'secondary', size = 'md', loading, icon, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'h-8 px-2.5 text-xs' : 'h-9 px-3.5 text-sm',
        variants[variant],
        className,
      )}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </button>
  )
}

/* ---------- Badge ---------- */
export function Badge({ className, children, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap', className)}
      {...rest}
    >
      {children}
    </span>
  )
}
export const StatusBadge = ({ status }: { status: InvoiceStatus }) => (
  <Badge className={STATUS_CLASS[status]}>{STATUS_LABEL[status]}</Badge>
)
export const SourceBadge = ({ source }: { source: InvoiceSource }) => (
  <Badge className={source === 'xml_dian' ? 'bg-violet-50 text-violet-700 ring-violet-600/20' : 'bg-orange-50 text-orange-700 ring-orange-600/20'}>
    {SOURCE_LABEL[source]}
  </Badge>
)
const confClass: Record<Confidence, string> = {
  alta: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  media: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  baja: 'bg-red-50 text-red-700 ring-red-600/20',
}
export const ConfidenceBadge = ({ level }: { level: Confidence }) => (
  <Badge className={confClass[level]} title={`Confianza ${level} de la extracción`}>
    {level === 'alta' ? '✓' : level === 'media' ? '?' : '!'} {level}
  </Badge>
)

/* ---------- Card ---------- */
export function Card({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('rounded-xl bg-white shadow-sm ring-1 ring-slate-200', className)} {...rest}>
      {children}
    </div>
  )
}
export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

/* ---------- Inputs ---------- */
export const inputClass =
  'h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20'
export const selectClass = inputClass + ' pr-8'

/* ---------- Modal ---------- */
export function Modal({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <div
        className={cn('w-full rounded-xl bg-white shadow-xl ring-1 ring-slate-200', wide ? 'max-w-2xl' : 'max-w-lg')}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Cerrar">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">{footer}</div>}
      </div>
    </div>
  )
}

/* ---------- Toasts ---------- */
export function Toaster() {
  const toasts = useStore((s) => s.toasts)
  const dismiss = useStore((s) => s.dismissToast)
  const icon = { success: <CheckCircle2 className="h-5 w-5 text-emerald-500" />, error: <AlertCircle className="h-5 w-5 text-red-500" />, info: <Info className="h-5 w-5 text-brand-500" /> }
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-80 flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto flex items-start gap-3 rounded-lg bg-white p-3 shadow-lg ring-1 ring-slate-200 animate-[slidein_.2s_ease-out]">
          {icon[t.kind]}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-900">{t.title}</p>
            {t.description && <p className="mt-0.5 text-xs text-slate-500">{t.description}</p>}
          </div>
          <button onClick={() => dismiss(t.id)} className="text-slate-400 hover:text-slate-600" aria-label="Cerrar">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}

/* ---------- Page header ---------- */
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

/* ---------- Empty ---------- */
export const Empty = ({ children }: { children: ReactNode }) => (
  <div className="px-5 py-12 text-center text-sm text-slate-500">{children}</div>
)

export const Kbd = ({ children }: { children: ReactNode }) => (
  <kbd className="rounded border border-slate-300 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">{children}</kbd>
)
