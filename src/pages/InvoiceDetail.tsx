import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, CheckCircle2, Download, FileCode2, FileText, Mail, Paperclip, RefreshCw, Send, Sparkles, XCircle } from 'lucide-react'
import { Button, Card, CardHeader, ConfidenceBadge, Modal, PageHeader, SourceBadge, StatusBadge, inputClass } from '@/components/ui'
import { InvoicePaper } from '@/components/invoice/InvoicePaper'
import { SiigoModal, SiigoMark } from '@/components/invoice/SiigoModal'
import { useInvoice, useStore, useSupplier } from '@/store/useStore'
import type { InvoiceFields } from '@/data/types'
import { cn, downloadDummy, fmtDateTime, money } from '@/lib/utils'

type FieldKey = keyof InvoiceFields
const FIELDS: Array<{ key: FieldKey; label: string; type: 'text' | 'money' | 'date' }> = [
  { key: 'supplierName', label: 'Razón social', type: 'text' },
  { key: 'supplierNit', label: 'NIT', type: 'text' },
  { key: 'number', label: 'Número de factura', type: 'text' },
  { key: 'issueDate', label: 'Fecha de emisión', type: 'date' },
  { key: 'subtotal', label: 'Subtotal', type: 'money' },
  { key: 'iva', label: 'IVA', type: 'money' },
  { key: 'retefuente', label: 'Retención en la fuente', type: 'money' },
  { key: 'total', label: 'Total', type: 'money' },
]

function Field({ id, fieldKey, label, type, value, confidence }: { id: string; fieldKey: FieldKey; label: string; type: 'text' | 'money' | 'date'; value: string | number; confidence?: 'alta' | 'media' | 'baja' }) {
  const update = useStore((s) => s.updateFields)
  const [draft, setDraft] = useState(String(value))
  useEffect(() => setDraft(String(value)), [value])
  const dirty = draft !== String(value)
  const commit = () => {
    if (!dirty) return
    update(id, { [fieldKey]: type === 'money' ? Number(draft.replace(/[^\d]/g, '')) || 0 : draft } as Partial<InvoiceFields>)
  }
  const warn = confidence && confidence !== 'alta'
  return (
    <div className={cn('rounded-lg p-2.5 transition', warn ? 'bg-amber-50/70 ring-1 ring-amber-200' : 'hover:bg-slate-50')}>
      <div className="mb-1 flex items-center justify-between">
        <label className="text-xs font-medium text-slate-500">{label}</label>
        {confidence && <ConfidenceBadge level={confidence} />}
      </div>
      <div className="flex items-center gap-2">
        {type === 'money' && <span className="text-sm text-slate-400">$</span>}
        <input
          className={cn(inputClass, 'h-8', type === 'money' && 'text-right tabular-nums', dirty && 'border-brand-400')}
          type={type === 'date' ? 'date' : 'text'}
          value={type === 'money' ? Number(draft).toLocaleString('es-CO') : draft}
          onChange={(e) => setDraft(type === 'money' ? e.target.value.replace(/[^\d]/g, '') : e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        />
      </div>
      {fieldKey === 'total' && warn && <p className="mt-1 text-[11px] text-amber-700">Verifica contra el documento: el OCR no leyó con certeza este valor.</p>}
    </div>
  )
}

export default function InvoiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const invoice = useInvoice(id)
  const supplier = useSupplier(invoice?.supplierId)
  const mailboxes = useStore((s) => s.mailboxes)
  const allAudit = useStore((s) => s.audit)
  const mailbox = mailboxes.find((m) => m.id === invoice?.mailboxId)
  const audit = allAudit.filter((e) => e.invoiceId === id)
  const startReview = useStore((s) => s.startReview)
  const approve = useStore((s) => s.approve)
  const reject = useStore((s) => s.reject)
  const toast = useStore((s) => s.toast)
  const [siigoOpen, setSiigoOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [reason, setReason] = useState('Duplicada — ya registrada en periodo anterior')

  useEffect(() => {
    if (id) startReview(id)
  }, [id, startReview])

  if (!invoice) {
    return (
      <div className="text-sm text-slate-500">
        Factura no encontrada. <Link to="/facturas" className="text-brand-600 underline">Volver a la bandeja</Link>
      </div>
    )
  }

  const f = invoice.fields
  const pendingFields = invoice.confidence ? Object.values(invoice.confidence).filter((c) => c !== 'alta').length : 0
  const editable = ['nueva', 'revisando', 'aprobada', 'error'].includes(invoice.status)
  const download = (kind: 'xml' | 'pdf') => {
    const name = `${f.number}.${kind}`
    downloadDummy(name, kind === 'xml' ? `<?xml version="1.0"?>\n<Invoice><ID>${f.number}</ID><UUID>${f.cufe}</UUID></Invoice>` : `PDF de demostración — ${f.number}`, kind === 'xml' ? 'application/xml' : 'application/pdf')
    toast({ kind: 'info', title: `Descargando ${name}` })
  }

  return (
    <>
      <button onClick={() => navigate(-1)} className="mb-3 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-3.5 w-3.5" /> Volver
      </button>
      <PageHeader
        title={`Factura ${f.number}`}
        subtitle={`${f.supplierName} · ${money(f.total)}`}
        actions={
          <>
            <StatusBadge status={invoice.status} />
            <SourceBadge source={invoice.source} />
            <span className="mx-1 h-6 w-px bg-slate-200" />
            <Button icon={<Download className="h-4 w-4" />} onClick={() => download('pdf')}>PDF</Button>
            {invoice.source === 'xml_dian' && <Button icon={<FileCode2 className="h-4 w-4" />} onClick={() => download('xml')}>XML</Button>}
            {['nueva', 'revisando'].includes(invoice.status) && (
              <>
                <Button variant="danger" icon={<XCircle className="h-4 w-4" />} onClick={() => setRejectOpen(true)}>Rechazar</Button>
                <Button variant="success" icon={<CheckCircle2 className="h-4 w-4" />} onClick={() => approve([invoice.id])}>Aprobar</Button>
              </>
            )}
            {invoice.status === 'aprobada' && (
              <Button variant="primary" icon={<Send className="h-4 w-4" />} onClick={() => setSiigoOpen(true)}>Enviar a Siigo</Button>
            )}
            {invoice.status === 'error' && (
              <Button variant="primary" icon={<RefreshCw className="h-4 w-4" />} onClick={() => setSiigoOpen(true)}>Reintentar envío</Button>
            )}
          </>
        }
      />

      {invoice.status === 'error' && (
        <div className="mb-4 flex items-start gap-3 rounded-lg bg-red-50 p-4 ring-1 ring-red-200">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <div className="text-sm">
            <p className="font-medium text-red-800">Siigo rechazó el comprobante</p>
            <p className="mt-0.5 text-red-700">{invoice.siigoError}</p>
            <p className="mt-2 text-xs text-red-600">
              Crea el tercero en Siigo o corrige el NIT abajo y reintenta.{' '}
              <Link to={`/integraciones?factura=${invoice.id}`} className="font-medium underline">Resolver en Integraciones</Link>
            </p>
          </div>
        </div>
      )}
      {invoice.status === 'enviada' && (
        <div className="mb-4 flex items-center gap-3 rounded-lg bg-emerald-50 p-4 text-sm ring-1 ring-emerald-200">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <span className="text-emerald-800">
            Registrada en <SiigoMark className="h-4" /> como comprobante <strong>{invoice.siigoVoucher}</strong> el {invoice.sentAt && fmtDateTime(invoice.sentAt)}.
          </span>
        </div>
      )}
      {pendingFields > 0 && editable && (
        <div className="mb-4 flex items-center gap-3 rounded-lg bg-amber-50 p-4 text-sm ring-1 ring-amber-200">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <span className="text-amber-800">
            Extracción por OCR: <strong>{pendingFields} {pendingFields === 1 ? 'campo requiere' : 'campos requieren'} verificación</strong>. Corrígelos contra el documento; al editarlos pasan a confianza alta.
          </span>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-5">
        {/* Documento */}
        <div className="xl:col-span-3">
          <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
            <FileText className="h-3.5 w-3.5" /> {invoice.source === 'xml_dian' ? 'Representación gráfica (PDF adjunto al correo)' : 'PDF escaneado adjunto al correo'}
          </div>
          <div className="rounded-xl bg-slate-200/70 p-6">
            <InvoicePaper invoice={invoice} supplier={supplier} />
          </div>
        </div>

        {/* Campos + correo + auditoría */}
        <div className="space-y-4 xl:col-span-2">
          <Card>
            <CardHeader title="Datos extraídos" subtitle={invoice.source === 'xml_dian' ? 'Tomados del XML UBL validado por la DIAN' : 'Extraídos con OCR + IA · edita los campos dudosos'} />
            <div className="space-y-1 p-3">
              {FIELDS.map((fl) => (
                <Field key={fl.key} id={invoice.id} fieldKey={fl.key} label={fl.label} type={fl.type} value={f[fl.key]} confidence={invoice.confidence?.[fl.key]} />
              ))}
              <div className="rounded-lg p-2.5">
                <label className="text-xs font-medium text-slate-500">CUFE</label>
                <p className="mt-1 break-all font-mono text-[10px] text-slate-500">{f.cufe}</p>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Contabilización sugerida" subtitle="Según regla del proveedor" />
            <dl className="grid grid-cols-2 gap-3 p-4 text-xs">
              <div><dt className="text-slate-400">Tercero</dt><dd className="mt-0.5 font-medium text-slate-800">{supplier?.name}</dd></div>
              <div><dt className="text-slate-400">Cuenta</dt><dd className="mt-0.5 font-medium text-slate-800"><span className="font-mono">{supplier?.defaultAccount}</span> · {supplier?.accountName}</dd></div>
              <div><dt className="text-slate-400">Centro de costo</dt><dd className="mt-0.5 font-medium text-slate-800">{supplier?.costCenter}</dd></div>
              <div><dt className="text-slate-400">IVA descontable</dt><dd className="mt-0.5 font-medium text-slate-800">{money(f.iva)}</dd></div>
            </dl>
          </Card>

          <Card>
            <CardHeader title="Correo de origen" />
            <div className="p-4 text-xs">
              <div className="flex items-center gap-2 text-slate-700"><Mail className="h-3.5 w-3.5 text-slate-400" /> <span className="font-medium">{invoice.email.from}</span></div>
              <p className="mt-1.5 text-slate-800">{invoice.email.subject}</p>
              <p className="mt-1 text-slate-400">{fmtDateTime(invoice.email.date)} · buzón {mailbox?.email}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {invoice.email.attachments.map((a) => (
                  <span key={a} className="flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-600"><Paperclip className="h-3 w-3" /> {a}</span>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Línea de tiempo" />
            <ol className="space-y-3 p-4 text-xs">
              {audit.map((ev, i) => (
                <li key={ev.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className={cn('mt-1 h-2 w-2 rounded-full', i === 0 ? 'bg-brand-500' : 'bg-slate-300')} />
                    {i < audit.length - 1 && <span className="mt-1 w-px flex-1 bg-slate-200" />}
                  </div>
                  <div className="pb-1">
                    <p className="font-medium text-slate-800">{ev.action}</p>
                    {ev.detail && <p className="text-slate-500">{ev.detail}</p>}
                    <p className="text-slate-400">{ev.actor} · {fmtDateTime(ev.at)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>

      <SiigoModal ids={[invoice.id]} open={siigoOpen} onClose={() => setSiigoOpen(false)} />

      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Rechazar factura"
        footer={
          <>
            <Button onClick={() => setRejectOpen(false)}>Cancelar</Button>
            <Button variant="danger" onClick={() => { reject(invoice.id, reason); setRejectOpen(false) }}>Rechazar</Button>
          </>
        }
      >
        <label className="text-xs font-medium text-slate-600">Motivo</label>
        <select className={cn(inputClass, 'mt-1')} value={reason} onChange={(e) => setReason(e.target.value)}>
          <option>Duplicada — ya registrada en periodo anterior</option>
          <option>No corresponde a Todocosturas</option>
          <option>Valores no coinciden con la orden de compra</option>
          <option>Documento ilegible / incompleto</option>
        </select>
        <p className="mt-3 text-xs text-slate-500">La factura queda archivada y auditada; no se envía a Siigo.</p>
      </Modal>
    </>
  )
}
