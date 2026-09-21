import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Search } from 'lucide-react'
import { Button, Card, Empty, PageHeader, inputClass, selectClass } from '@/components/ui'
import { useStore } from '@/store/useStore'
import { cn, downloadDummy, fmtDateTime } from '@/lib/utils'

const ACTION_TONE: Record<string, string> = {
  'Factura aprobada': 'bg-emerald-500',
  'Enviada a Siigo': 'bg-slate-600',
  'Error al enviar a Siigo': 'bg-red-500',
  'Factura rechazada': 'bg-slate-400',
  'Campo corregido': 'bg-amber-500',
  'Factura detectada': 'bg-brand-500',
}

export default function Audit() {
  const audit = useStore((s) => s.audit)
  const invoices = useStore((s) => s.invoices)
  const [q, setQ] = useState('')
  const [actor, setActor] = useState('')
  const [action, setAction] = useState('')

  const actors = useMemo(() => [...new Set(audit.map((e) => e.actor))], [audit])
  const actions = useMemo(() => [...new Set(audit.map((e) => e.action))], [audit])

  const rows = audit.filter((e) => {
    if (actor && e.actor !== actor) return false
    if (action && e.action !== action) return false
    if (q) {
      const inv = invoices.find((i) => i.id === e.invoiceId)
      const hay = `${inv?.fields.number} ${inv?.fields.supplierName} ${e.action} ${e.detail ?? ''}`.toLowerCase()
      if (!hay.includes(q.toLowerCase())) return false
    }
    return true
  })

  const exportCsv = () => {
    const csv = ['fecha,factura,actor,accion,detalle']
      .concat(rows.map((e) => [e.at, invoices.find((i) => i.id === e.invoiceId)?.fields.number ?? '', e.actor, e.action, `"${e.detail ?? ''}"`].join(',')))
      .join('\n')
    downloadDummy('auditoria.csv', csv, 'text/csv')
  }

  return (
    <>
      <PageHeader
        title="Auditoría"
        subtitle="Todo lo que pasó con cada factura: quién, qué y cuándo. Inmutable."
        actions={<Button icon={<Download className="h-4 w-4" />} onClick={exportCsv}>Exportar CSV</Button>}
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative w-72">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input className={cn(inputClass, 'pl-9')} placeholder="Buscar por factura, proveedor o detalle" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className={cn(selectClass, 'w-auto')} value={actor} onChange={(e) => setActor(e.target.value)}>
          <option value="">Todos los usuarios</option>
          {actors.map((a) => <option key={a}>{a}</option>)}
        </select>
        <select className={cn(selectClass, 'w-auto')} value={action} onChange={(e) => setAction(e.target.value)}>
          <option value="">Todas las acciones</option>
          {actions.map((a) => <option key={a}>{a}</option>)}
        </select>
        <span className="ml-auto text-xs text-slate-500">{rows.length} eventos</span>
      </div>

      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <Empty>Sin eventos para ese filtro.</Empty>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-2.5 font-medium">Fecha</th>
                <th className="px-4 py-2.5 font-medium">Factura</th>
                <th className="px-4 py-2.5 font-medium">Acción</th>
                <th className="px-4 py-2.5 font-medium">Detalle</th>
                <th className="px-4 py-2.5 font-medium">Usuario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.slice(0, 200).map((e) => {
                const inv = invoices.find((i) => i.id === e.invoiceId)
                return (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-2.5 text-xs tabular-nums text-slate-500">{fmtDateTime(e.at)}</td>
                    <td className="px-4 py-2.5">
                      <Link to={`/facturas/${e.invoiceId}`} className="font-medium text-brand-700 hover:underline">{inv?.fields.number ?? e.invoiceId}</Link>
                      <div className="text-xs text-slate-400">{inv?.fields.supplierName}</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="flex items-center gap-2 text-slate-800">
                        <span className={cn('h-2 w-2 rounded-full', ACTION_TONE[e.action] ?? 'bg-slate-300')} />
                        {e.action}
                      </span>
                    </td>
                    <td className="max-w-md px-4 py-2.5 text-xs text-slate-500">{e.detail}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-600">{e.actor}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Card>
    </>
  )
}
