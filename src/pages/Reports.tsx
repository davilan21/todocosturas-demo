import { Bar, BarChart, CartesianGrid, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Clock, Percent, Receipt, TrendingUp } from 'lucide-react'
import { Card, CardHeader, PageHeader } from '@/components/ui'
import { useStore } from '@/store/useStore'
import { money } from '@/lib/utils'
import { NOW } from '@/data/seed'

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#0ea5e9', '#64748b']
const tooltipStyle = { fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }
const short = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)} M` : n >= 1000 ? `${Math.round(n / 1000)} k` : String(n))

export default function Reports() {
  const invoices = useStore((s) => s.invoices)
  const suppliers = useStore((s) => s.suppliers)

  // Por mes (últimos 6, incluyendo histórico ficticio para meses sin semilla)
  const months = Array.from({ length: 6 }, (_, k) => {
    const d = new Date(NOW.getFullYear(), NOW.getMonth() - (5 - k), 1)
    const key = d.toISOString().slice(0, 7)
    const mine = invoices.filter((i) => i.receivedAt.slice(0, 7) === key)
    const fake = [38, 41, 45, 39, 47][k] ?? 0
    return {
      mes: d.toLocaleDateString('es-CO', { month: 'short' }),
      facturas: mine.length || fake,
      monto: mine.reduce((s, i) => s + i.fields.total, 0) || fake * 2_150_000,
    }
  })

  const bySupplier = suppliers
    .map((s) => ({ name: s.name.split(' ').slice(0, 2).join(' '), value: invoices.filter((i) => i.supplierId === s.id).reduce((a, i) => a + i.fields.total, 0) }))
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)
    .map((x, i) => ({ ...x, fill: COLORS[i % COLORS.length] }))

  const iva = invoices.filter((i) => i.status !== 'rechazada').reduce((s, i) => s + i.fields.iva, 0)
  const rete = invoices.filter((i) => i.status !== 'rechazada').reduce((s, i) => s + i.fields.retefuente, 0)
  const total = invoices.filter((i) => i.status !== 'rechazada').reduce((s, i) => s + i.fields.total, 0)
  const sent = invoices.filter((i) => i.sentAt)
  const avgHours = sent.length ? sent.reduce((s, i) => s + (new Date(i.sentAt!).getTime() - new Date(i.receivedAt).getTime()) / 3_600_000, 0) / sent.length : 0
  const ocrShare = Math.round((invoices.filter((i) => i.source === 'pdf_ocr').length / invoices.length) * 100)

  const kpis = [
    { label: 'Total facturado (periodo)', value: money(total), icon: Receipt, hint: `${invoices.length} facturas` },
    { label: 'IVA descontable', value: money(iva), icon: Percent, hint: `Retefuente ${money(rete)}` },
    { label: 'Recepción → Siigo', value: `${avgHours.toFixed(1)} h`, icon: Clock, hint: 'Promedio, antes: 4–6 días' },
    { label: 'Lectura directa del XML', value: `${100 - ocrShare}%`, icon: TrendingUp, hint: `${ocrShare}% pasó por OCR + IA` },
  ]

  return (
    <>
      <PageHeader title="Reportes" subtitle="Indicadores del flujo de facturas de proveedores" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map(({ label, value, icon: Icon, hint }) => (
          <Card key={label} className="p-5">
            <div className="flex items-center justify-between text-sm font-medium text-slate-500">
              {label} <Icon className="h-4 w-4 text-slate-400" />
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
            <p className="mt-1 text-xs text-slate-500">{hint}</p>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Facturas por mes" subtitle="Cantidad recibida" />
          <div className="h-64 px-2 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={months} margin={{ left: -20, right: 12 }}>
                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="facturas" name="Facturas" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Monto por mes" subtitle="Total facturado (COP)" />
          <div className="h-64 px-2 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={months} margin={{ left: -10, right: 12 }}>
                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} tickFormatter={short} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f1f5f9' }} formatter={(v) => money(Number(v))} />
                <Bar dataKey="monto" name="Monto" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Top proveedores" subtitle="Participación por monto" />
          <div className="h-72 px-2 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={bySupplier} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => money(Number(v))} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Impuestos del periodo" subtitle="Base para la declaración" />
          <div className="divide-y divide-slate-100 px-5">
            {[
              ['Subtotal (base gravable)', total - iva + rete],
              ['IVA 19% descontable', iva],
              ['Retención en la fuente practicada', rete],
              ['Total pagado a proveedores', total],
            ].map(([l, v]) => (
              <div key={String(l)} className="flex items-center justify-between py-3 text-sm">
                <span className="text-slate-600">{l}</span>
                <span className="font-medium tabular-nums text-slate-900">{money(Number(v))}</span>
              </div>
            ))}
          </div>
          <p className="px-5 pb-4 pt-2 text-xs text-slate-400">Excluye facturas rechazadas. Exportable a Excel para el contador.</p>
        </Card>
      </div>
    </>
  )
}
