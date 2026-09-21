import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  Bell,
  FileText,
  History,
  Inbox,
  LayoutDashboard,
  LogOut,
  Plug,
  RotateCcw,
  Search,
  Scissors,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/useStore'
import { currentUser } from '@/data/seed'
import { Toaster } from '@/components/ui'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/facturas', label: 'Facturas', icon: FileText },
  { to: '/buzones', label: 'Buzones', icon: Inbox },
  { to: '/integraciones', label: 'Integraciones', icon: Plug },
  { to: '/proveedores', label: 'Proveedores y reglas', icon: Users },
  { to: '/auditoria', label: 'Auditoría', icon: History },
  { to: '/reportes', label: 'Reportes', icon: BarChart3 },
]

export default function AppShell() {
  const pending = useStore((s) => s.invoices.filter((i) => i.status === 'nueva').length)
  const errors = useStore((s) => s.invoices.filter((i) => i.status === 'error').length)
  const reset = useStore((s) => s.reset)
  const logout = useStore((s) => s.logout)
  const toast = useStore((s) => s.toast)
  const navigate = useNavigate()

  return (
    <div className="flex h-full">
      <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="flex h-14 items-center gap-2.5 border-b border-slate-100 px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Scissors className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-slate-900">Todocosturas</p>
            <p className="text-[11px] text-slate-500">Facturas de proveedores</p>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 p-3">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition',
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                )
              }
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1">{label}</span>
              {to === '/facturas' && pending > 0 && (
                <span className="rounded-full bg-brand-600 px-1.5 text-[10px] font-semibold text-white">{pending}</span>
              )}
              {to === '/integraciones' && errors > 0 && (
                <span className="rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white">{errors}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-100 p-3">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Conexión Siigo</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Activa · NIT 800.155.209-1
            </p>
          </div>
          <button
            onClick={() => {
              reset()
              navigate('/')
              toast({ kind: 'info', title: 'Demo reiniciada', description: 'Datos restaurados al estado inicial.' })
            }}
            className="mt-2 flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-slate-500 hover:bg-slate-100"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reiniciar demo
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-6">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none"
              placeholder="Buscar factura, proveedor, NIT…"
              onKeyDown={(e) => {
                if (e.key === 'Enter') navigate(`/facturas?q=${encodeURIComponent((e.target as HTMLInputElement).value)}`)
              }}
            />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button className="relative rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label="Notificaciones" onClick={() => navigate('/integraciones')}>
              <Bell className="h-4 w-4" />
              {errors > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />}
            </button>
            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                {currentUser.initials}
              </div>
              <div className="leading-tight">
                <p className="text-sm font-medium text-slate-900">{currentUser.name}</p>
                <p className="text-[11px] text-slate-500">{currentUser.role}</p>
              </div>
              <button onClick={logout} className="ml-1 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Salir">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
      <Toaster />
    </div>
  )
}
