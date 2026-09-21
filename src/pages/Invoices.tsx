import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Download, Filter, Send, X } from 'lucide-react'
import { Button, Card, Empty, PageHeader, SourceBadge, StatusBadge, selectClass } from '@/components/ui'
import { SiigoModal } from '@/components/invoice/SiigoModal'
import { useStore } from '@/store/useStore'
import type { InvoiceStatus } from '@/data/types'
import { cn, downloadDummy, fmtDate, fmtDateTime, money, relTime, STATUS_LABEL } from '@/lib/utils'
import { NOW } from '@/data/seed'

const STATUSES: InvoiceStatus[] = ['nueva', 'revisando', 'aprobada', 'enviada', 'error', 'rechazada']

export default function Invoices() {
  const [params, setParams] = useSearchParams()
  const invoices = useStore((s) => s.invoices)
  const suppliers = useStore((s) => s.suppliers)
  const mailboxes = useStore((s) => s.mailboxes)
  const approve = useStore((s) => s.approve)
  const toast = useStore((s) => s.toast)

  const estado = params.get('estado') ?? ''
  const proveedor = params.get('proveedor') ?? ''
  const origen = params.get('origen') ?? ''
  const buzon = params.get('buzon') ?? ''
  const q = params.get('q') ?? ''
  const rango = params.get('rango') ?? ''

  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams(params)
    if (v) next.set(k, v)
    else next.delete(k)
    setParams(next, { replace: true })
  }
  const hasFilters = Boolean(estado || proveedor || origen || buzon || q || rango)

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase()
    const minDate = rango ? new Date(NOW.getTime() - Number(rango) * 86_400_000).toISOString() : ''
    return invoices.filter((i) => {
      if (estado && i.status !== estado) return false
      if (proveedor && i.supplierId !== proveedor) return false
      if (origen && i.source !== origen) return false
      if (buzon && i.mailboxId !== buzon) return false
      if (minDate && i.receivedAt < minDate) return false
      if (qq) {
        const hay = `${i.fields.number} ${i.fields.supplierName} ${i.fields.supplierNit} ${i.email.subject}`.toLowerCase()
        if (!hay.includes(qq)) return false
      }
      return true
    })
  }, [invoices, estado, proveedor, origen, buzon, q, rango])

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [siigoOpen, setSiigoOpen] = useState(false)
  const selectedList = [...selected].filter((id) => filtered.some((i) => i.id === id))
  const allSelected = filtered.length > 0 && filtered.every((i) => selected.has(i.id))
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(filtered.map((i) => i.id)))
  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })

  const selInvoices = invoices.filter((i) => selectedList.includes(i.id))
  const canApprove = selInvoices.filter((i) => ['nueva', 'revisando'].includes(i.status)).length
  const canSend = selInvoices.filter((i) => ['aprobada', 'error'].includes(i.status)).length

  const downloadSelected = () => {
    const csv = ['numero,proveedor,nit,fecha,subtotal,iva,retefuente,total,estado']
      .concat(selInvoices.map((i) => [i.fields.number, `"${i.fields.supplierName}"`, i.fields.supplierNit, i.fields.issueDate, i.fields.subtotal, i.fields.iva, i.fields.retefuente, i.fields.total, i.status].join(',')))
      .join('\n')
    downloadDummy(`facturas-${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv')
    toast({ kind: 'info', title: `Descargando ${selInvoices.length} facturas`, description: 'CSV + adjuntos originales en ZIP (demo: solo CSV).' })
  }

  const counts = STATUSES.map((st) => [st, invoices.filter((i) => i.status === st).length] as const)

  return (
    <>
      <PageHeader title="Facturas" subtitle={`${filtered.length} de ${invoices.length} facturas`} />

      {/* Tabs de estado */}
      <div className="mb-4 flex flex-wrap gap-1 border-b border-slate-200">
        <button onClick={() => setParam('estado', '')} className={cn('border-b-2 px-3 py-2 text-sm font-medium', !estado ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-800')}>
          Todas <span className="ml-1 text-xs text-slate-400">{invoices.length}</span>
        </button>
        {counts.map(([st, n]) => (
          <button key={st} onClick={() => setParam('estado', st)} className={cn('border-b-2 px-3 py-2 text-sm font-medium', estado === st ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-800')}>
            {STATUS_LABEL[st]} <span className="ml-1 text-xs text-slate-400">{n}</span>
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-slate-400" />
        <select className={cn(selectClass, 'w-auto')} value={proveedor} onChange={(e) => setParam('proveedor', e.target.value)}>
          <option value="">Todos los proveedores</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <select className={cn(selectClass, 'w-auto')} value={origen} onChange={(e) => setParam('origen', e.target.value)}>
          <option value="">Cualquier origen</option>
          <option value="xml_dian">XML DIAN</option>
          <option value="pdf_ocr">PDF · OCR</option>
        </select>
        <select className={cn(selectClass, 'w-auto')} value={buzon} onChange={(e) => setParam('buzon', e.target.value)}>
          <option value="">Todos los buzones</option>
          {mailboxes.map((m) => (
            <option key={m.id} value={m.id}>{m.email}</option>
          ))}
        </select>
        <select className={cn(selectClass, 'w-auto')} value={rango} onChange={(e) => setParam('rango', e.target.value)}>
          <option value="">Cualquier fecha</option>
          <option value="1">Últimas 24 h</option>
          <option value="7">Últimos 7 días</option>
          <option value="30">Últimos 30 días</option>
        </select>
        {q && (
          <span className="flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs text-brand-700">
            “{q}” <button onClick={() => setParam('q', '')}><X className="h-3 w-3" /></button>
          </span>
        )}
        {hasFilters && (
          <button onClick={() => setParams({}, { replace: true })} className="text-xs text-slate-500 hover:text-slate-800">
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Barra de acciones en lote */}
      {selectedList.length > 0 && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-brand-50 px-4 py-2 ring-1 ring-brand-200">
          <span className="text-sm font-medium text-brand-800">{selectedList.length} seleccionadas</span>
          <div className="ml-auto flex gap-2">
            <Button size="sm" icon={<Download className="h-3.5 w-3.5" />} onClick={downloadSelected}>Descargar</Button>
            <Button size="sm" variant="success" disabled={!canApprove} icon={<CheckCircle2 className="h-3.5 w-3.5" />} onClick={() => { approve(selectedList); setSelected(new Set()) }}>
              Aprobar {canApprove > 0 && `(${canApprove})`}
            </Button>
            <Button size="sm" variant="primary" disabled={!canSend} icon={<Send className="h-3.5 w-3.5" />} onClick={() => setSiigoOpen(true)}>
              Enviar a Siigo {canSend > 0 && `(${canSend})`}
            </Button>
          </div>
        </div>
      )}

      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <Empty>No hay facturas con esos filtros.</Empty>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="w-10 px-4 py-2.5"><input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded border-slate-300" /></th>
                <th className="px-4 py-2.5 font-medium">Factura</th>
                <th className="px-4 py-2.5 font-medium">Proveedor</th>
                <th className="px-4 py-2.5 font-medium">Origen</th>
                <th className="px-4 py-2.5 font-medium">Emitida</th>
                <th className="px-4 py-2.5 font-medium">Recibida</th>
                <th className="px-4 py-2.5 text-right font-medium">Total</th>
                <th className="px-4 py-2.5 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((inv) => {
                const needsFix = inv.confidence && Object.values(inv.confidence).some((c) => c !== 'alta')
                return (
                  <tr key={inv.id} className={cn('hover:bg-slate-50', selected.has(inv.id) && 'bg-brand-50/40')}>
                    <td className="px-4 py-3"><input type="checkbox" checked={selected.has(inv.id)} onChange={() => toggle(inv.id)} className="rounded border-slate-300" /></td>
                    <td className="px-4 py-3">
                      <Link to={`/facturas/${inv.id}`} className="font-medium text-brand-700 hover:underline">{inv.fields.number}</Link>
                      {needsFix && inv.status !== 'enviada' && <span className="ml-2 text-[10px] font-medium uppercase text-amber-600">Revisar campos</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-800">{inv.fields.supplierName}</div>
                      <div className="text-xs text-slate-400">NIT {inv.fields.supplierNit}</div>
                    </td>
                    <td className="px-4 py-3"><SourceBadge source={inv.source} /></td>
                    <td className="px-4 py-3 text-slate-600">{fmtDate(inv.fields.issueDate)}</td>
                    <td className="px-4 py-3 text-slate-500" title={fmtDateTime(inv.receivedAt)}>{relTime(inv.receivedAt, Math.max(NOW.getTime(), Date.now()))}</td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums text-slate-900">{money(inv.fields.total)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={inv.status} />
                      {inv.siigoVoucher && <div className="mt-0.5 text-[11px] text-slate-400">{inv.siigoVoucher}</div>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Card>

      <SiigoModal ids={selInvoices.filter((i) => ['aprobada', 'error'].includes(i.status)).map((i) => i.id)} open={siigoOpen} onClose={() => { setSiigoOpen(false); setSelected(new Set()) }} />
    </>
  )
}
