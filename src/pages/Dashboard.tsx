import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, CheckCircle2, Clock, Inbox, Send } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardHeader, PageHeader, SourceBadge, StatusBadge } from '@/components/ui'
import { useStore } from '@/store/useStore'
import { fmtDateTime, money, relTime } from '@/lib/utils'
import { NOW } from '@/data/seed'
import { MailboxCard } from '@/pages/Mailboxes'

function Kpi({ label, value, hint, icon: Icon, tone, to }: { label: string; value: number | string; hint: string; icon: typeof Clock; tone: string; to: string }) {
  return (
    <Link to={to} className="group">
      <Card className="p-5 transition group-hover:ring-brand-300">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <div className={`rounded-md p-1.5 ${tone}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
        <p className="mt-1 text-xs text-slate-500">{hint}</p>
      </Card>
    </Link>
  )
}

export default function Dashboard() {
  const invoices = useStore((s) => s.invoices)
  const mailboxes = useStore((s) => s.mailboxes)
  const suppliers = useStore((s) => s.suppliers)

  const count = (st: string) => invoices.filter((i) => i.status === st).length
  const pending = count('nueva') + count('revisando')
  const sentTotal = invoices.filter((i) => i.status === 'enviada').reduce((s, i) => s + i.fields.total, 0)

  // Serie últimos 30 días: recibidas por día
  const series = Array.from({ length: 30 }, (_, k) => {
    const d = new Date(NOW)
    d.setDate(d.getDate() - (29 - k))
    const key = d.toISOString().slice(0, 10)
    return {
      day: d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }),
      recibidas: invoices.filter((i) => i.receivedAt.slice(0, 10) === key).length,
      enviadas: invoices.filter((i) => i.sentAt?.slice(0, 10) === key).length,
    }
  })

  const recent = invoices.slice(0, 7)

  return (
    <>
      <PageHeader title="Dashboard" subtitle={`Resumen al ${NOW.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}`} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Pendientes de revisión" value={pending} hint={`${count('nueva')} nuevas · ${count('revisando')} en revisión`} icon={Clock} tone="bg-blue-50 text-blue-600" to="/facturas?estado=nueva" />
        <Kpi label="Aprobadas" value={count('aprobada')} hint="Listas para enviar a Siigo" icon={CheckCircle2} tone="bg-emerald-50 text-emerald-600" to="/facturas?estado=aprobada" />
        <Kpi label="Enviadas a Siigo" value={count('enviada')} hint={`${money(sentTotal)} este periodo`} icon={Send} tone="bg-slate-100 text-slate-600" to="/facturas?estado=enviada" />
        <Kpi label="Con error" value={count('error')} hint="Requieren acción en Siigo" icon={AlertTriangle} tone="bg-red-50 text-red-600" to="/facturas?estado=error" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Actividad últimos 30 días" subtitle="Facturas recibidas por correo vs. enviadas a Siigo" />
          <div className="h-64 px-2 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ left: -20, right: 12 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} interval={4} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Area type="monotone" dataKey="recibidas" name="Recibidas" stroke="#2563eb" fill="url(#g1)" strokeWidth={2} />
                <Area type="monotone" dataKey="enviadas" name="Enviadas a Siigo" stroke="#10b981" fill="transparent" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Inbox className="h-4 w-4 text-slate-400" /> Buzones
            </h3>
            <Link to="/buzones" className="text-xs font-medium text-brand-600 hover:underline">
              Ver todos
            </Link>
          </div>
          {mailboxes.map((m) => (
            <MailboxCard key={m.id} mailbox={m} compact />
          ))}
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Últimas facturas recibidas"
          action={
            <Link to="/facturas" className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline">
              Ir a la bandeja <ArrowRight className="h-3 w-3" />
            </Link>
          }
        />
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
            <tr className="border-b border-slate-100">
              <th className="px-5 py-2.5 font-medium">Factura</th>
              <th className="px-5 py-2.5 font-medium">Proveedor</th>
              <th className="px-5 py-2.5 font-medium">Origen</th>
              <th className="px-5 py-2.5 font-medium">Recibida</th>
              <th className="px-5 py-2.5 text-right font-medium">Total</th>
              <th className="px-5 py-2.5 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {recent.map((inv) => (
              <tr key={inv.id} className="hover:bg-slate-50">
                <td className="px-5 py-3">
                  <Link to={`/facturas/${inv.id}`} className="font-medium text-brand-700 hover:underline">
                    {inv.fields.number}
                  </Link>
                </td>
                <td className="px-5 py-3 text-slate-700">{suppliers.find((s) => s.id === inv.supplierId)?.name}</td>
                <td className="px-5 py-3"><SourceBadge source={inv.source} /></td>
                <td className="px-5 py-3 text-slate-500" title={fmtDateTime(inv.receivedAt)}>{relTime(inv.receivedAt, Math.max(NOW.getTime(), Date.now()))}</td>
                <td className="px-5 py-3 text-right font-medium tabular-nums text-slate-900">{money(inv.fields.total)}</td>
                <td className="px-5 py-3"><StatusBadge status={inv.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  )
}
