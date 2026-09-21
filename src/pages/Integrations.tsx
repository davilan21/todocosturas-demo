import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Loader2, Play, Plug, RefreshCw, Terminal, UserPlus, XCircle } from 'lucide-react'
import { Button, Card, CardHeader, Empty, PageHeader, selectClass } from '@/components/ui'
import { SiigoMark } from '@/components/invoice/SiigoModal'
import { GoogleLogo, MicrosoftLogo } from '@/pages/Mailboxes'
import { useStore } from '@/store/useStore'
import type { Invoice, Supplier } from '@/data/types'
import { cn, fmtDateTime, money } from '@/lib/utils'

/* ---------- Simulación paso a paso ---------- */

type StepState = 'pending' | 'running' | 'ok' | 'fail'
interface Step {
  id: string
  title: string
  state: StepState
  lines: string[] // consola
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const nitDigits = (nit: string) => nit.replace(/\D/g, '').slice(0, -1)

function buildSteps(): Step[] {
  return [
    { id: 'validate', title: 'Validar factura', state: 'pending', lines: [] },
    { id: 'customer', title: 'Buscar tercero en Siigo', state: 'pending', lines: [] },
    { id: 'account', title: 'Mapear cuenta contable', state: 'pending', lines: [] },
    { id: 'voucher', title: 'Crear comprobante de compra', state: 'pending', lines: [] },
    { id: 'attach', title: 'Adjuntar soporte (XML/PDF)', state: 'pending', lines: [] },
  ]
}

function StepIcon({ state }: { state: StepState }) {
  if (state === 'running') return <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
  if (state === 'ok') return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
  if (state === 'fail') return <XCircle className="h-4 w-4 text-red-500" />
  return <span className="block h-4 w-4 rounded-full border-2 border-slate-300" />
}

export default function Integrations() {
  const [params] = useSearchParams()
  const invoices = useStore((s) => s.invoices)
  const suppliers = useStore((s) => s.suppliers)
  const audit = useStore((s) => s.audit)
  const sendToSiigo = useStore((s) => s.sendToSiigo)
  const updateSupplier = useStore((s) => s.updateSupplier)
  const toast = useStore((s) => s.toast)

  const errors = invoices.filter((i) => i.status === 'error')
  const sendable = invoices.filter((i) => ['aprobada', 'error'].includes(i.status))
  const defaultId = params.get('factura') ?? errors[0]?.id ?? sendable[0]?.id ?? ''
  const [selectedId, setSelectedId] = useState(defaultId)
  // La factura recién enviada sigue en el select para que el resultado quede a la vista.
  const candidates = invoices.filter((i) => ['aprobada', 'error'].includes(i.status) || i.id === selectedId)
  useEffect(() => {
    const p = params.get('factura')
    if (p) setSelectedId(p)
  }, [params])

  const invoice = invoices.find((i) => i.id === selectedId)
  const supplier = suppliers.find((s) => s.id === invoice?.supplierId)

  const [steps, setSteps] = useState<Step[]>(buildSteps())
  const [running, setRunning] = useState(false)
  const [blocked, setBlocked] = useState<null | 'missing-customer'>(null)
  const [creating, setCreating] = useState(false)
  const [done, setDone] = useState<null | { voucher: string }>(null)
  const consoleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    consoleRef.current?.scrollTo({ top: consoleRef.current.scrollHeight })
  }, [steps])

  // Cambiar de factura reinicia el simulador
  useEffect(() => {
    setSteps(buildSteps())
    setBlocked(null)
    setDone(null)
  }, [selectedId])

  const patch = (id: string, p: Partial<Step>) => setSteps((s) => s.map((st) => (st.id === id ? { ...st, ...p, lines: p.lines ? [...st.lines, ...p.lines] : st.lines } : st)))

  const run = async (inv: Invoice, sup: Supplier) => {
    setRunning(true)
    setBlocked(null)
    setDone(null)
    setSteps(buildSteps())
    const f = inv.fields
    const nit = nitDigits(f.supplierNit)

    // 1. Validar
    patch('validate', { state: 'running', lines: [`Factura ${f.number} · ${inv.source === 'xml_dian' ? 'XML UBL 2.1 validado por DIAN' : 'PDF procesado con OCR'}`] })
    await sleep(500)
    patch('validate', { lines: [`Totales: subtotal ${money(f.subtotal)} + IVA ${money(f.iva)} − rete ${money(f.retefuente)} = ${money(f.total)} ✓`] })
    await sleep(350)
    patch('validate', { state: 'ok', lines: [`CUFE ${f.cufe.slice(0, 16)}… no registrado antes ✓`] })

    // 2. Tercero
    patch('customer', { state: 'running', lines: [`GET https://api.siigo.com/v1/customers?identification=${nit}`] })
    await sleep(900)
    if (!sup.siigoExists) {
      patch('customer', {
        state: 'fail',
        lines: [`← 404 Not Found`, `{ "Errors": [{ "Code": "not_found", "Message": "Customer with identification ${nit} does not exist" }] }`],
      })
      setBlocked('missing-customer')
      setRunning(false)
      return
    }
    patch('customer', { state: 'ok', lines: [`← 200 OK · id ${sup.id.replace('sup-', 'c-4f2e')} · "${sup.name}"`] })

    // 3. Cuenta
    patch('account', { state: 'running', lines: [`Regla proveedor @${sup.emailDomain} → cuenta ${sup.defaultAccount} (${sup.accountName})`] })
    await sleep(500)
    patch('account', { state: 'ok', lines: [`Centro de costo ${sup.costCenter} · IVA descontable 240805 · Retefuente 236540`] })

    // 4. Comprobante (acá sí cambia el estado real)
    patch('voucher', { state: 'running', lines: [`POST https://api.siigo.com/v1/purchases`, `{ "document": { "id": 24446 }, "date": "${f.issueDate}", "supplier": { "identification": "${nit}" }, "items": [${inv.items.length} ítems], "payments": [{ "value": ${f.total} }] }`] })
    await sendToSiigo([inv.id])
    const after = useStore.getState().invoices.find((i) => i.id === inv.id)
    if (after?.status !== 'enviada' || !after.siigoVoucher) {
      patch('voucher', { state: 'fail', lines: [`← error: ${after?.siigoError ?? 'respuesta inesperada'}`] })
      setRunning(false)
      return
    }
    patch('voucher', { state: 'ok', lines: [`← 201 Created · comprobante ${after.siigoVoucher}`] })

    // 5. Adjuntos
    patch('attach', { state: 'running', lines: inv.email.attachments.map((a) => `Subiendo ${a}`) })
    await sleep(600)
    patch('attach', { state: 'ok', lines: [`Soportes vinculados al comprobante ${after.siigoVoucher} ✓`] })
    setDone({ voucher: after.siigoVoucher })
    setRunning(false)
  }

  const createCustomer = async (sup: Supplier) => {
    setCreating(true)
    const nit = nitDigits(sup.nit)
    patch('customer', { state: 'running', lines: [``, `POST https://api.siigo.com/v1/customers`, `{ "type": "Supplier", "person_type": "Company", "id_type": "31", "identification": "${nit}", "name": ["${sup.name}"], "vat_responsible": true }`] })
    await sleep(1200)
    updateSupplier(sup.id, { siigoExists: true })
    patch('customer', { state: 'ok', lines: [`← 201 Created · tercero "${sup.name}" creado en Siigo`] })
    setBlocked(null)
    setCreating(false)
    toast({ kind: 'success', title: 'Tercero creado en Siigo', description: `${sup.name} · NIT ${sup.nit}. Ahora puedes reintentar el envío.` })
  }

  const sentEvents = audit.filter((e) => e.action === 'Enviada a Siigo' || e.action === 'Error al enviar a Siigo').slice(0, 8)
  const sentToday = invoices.filter((i) => i.sentAt && new Date(i.sentAt).toDateString() === new Date().toDateString()).length
  const [pinging, setPinging] = useState<string | null>(null)
  const ping = async (name: string) => {
    setPinging(name)
    await sleep(900)
    setPinging(null)
    toast({ kind: 'success', title: `${name}: conexión OK`, description: 'Credenciales válidas · latencia 180 ms' })
  }

  const connections = [
    { name: 'Siigo', kind: 'Contabilidad · API v1', logo: <SiigoMark />, detail: 'Todocosturas S.A.S. · NIT 800.155.209-1', stats: [['Comprobantes hoy', String(sentToday)], ['Errores pendientes', String(errors.length)]] },
    { name: 'Google Workspace', kind: 'Buzón · solo lectura', logo: <GoogleLogo />, detail: 'facturas@todocosturas.com', stats: [['Alcance', 'gmail.readonly'], ['Token', 'renovado hace 2 h']] },
    { name: 'Microsoft 365', kind: 'Buzón · solo lectura', logo: <MicrosoftLogo />, detail: 'compras@todocosturas.com', stats: [['Alcance', 'Mail.Read'], ['Token', 'renovado hace 1 h']] },
  ]

  return (
    <>
      <PageHeader title="Integraciones" subtitle="Conexiones activas y simulador del envío a Siigo, paso a paso y con la respuesta real de la API." />

      <div className="grid gap-4 lg:grid-cols-3">
        {connections.map((c) => (
          <Card key={c.name} className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 ring-1 ring-slate-200">{c.logo}</div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900">{c.name}</p>
                <p className="text-xs text-slate-500">{c.kind}</p>
              </div>
              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Activa</span>
            </div>
            <p className="mt-3 truncate text-xs text-slate-600">{c.detail}</p>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
              {c.stats.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-slate-400">{k}</dt>
                  <dd className={cn('mt-0.5 font-medium', k === 'Errores pendientes' && v !== '0' ? 'text-red-600' : 'text-slate-700')}>{v}</dd>
                </div>
              ))}
            </dl>
            <Button size="sm" className="mt-4" loading={pinging === c.name} icon={<Plug className="h-3.5 w-3.5" />} onClick={() => ping(c.name)}>
              Probar conexión
            </Button>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-5">
        {/* Simulador */}
        <Card className="xl:col-span-3">
          <CardHeader
            title="Simulador de envío a Siigo"
            subtitle="Ejecuta el flujo real contra la API y muestra cada paso. Si algo falla, dice exactamente por qué y deja la corrección a un clic."
          />
          <div className="border-b border-slate-100 px-5 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <select className={cn(selectClass, 'w-auto max-w-md')} value={selectedId} onChange={(e) => setSelectedId(e.target.value)} disabled={running}>
                {candidates.length === 0 && <option value="">No hay facturas aprobadas ni con error</option>}
                {candidates.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.status === 'error' ? '⚠ ' : i.status === 'enviada' ? '✓ ' : ''}{i.fields.number} · {i.fields.supplierName} · {money(i.fields.total)}
                  </option>
                ))}
              </select>
              <Button variant="primary" icon={<Play className="h-4 w-4" />} disabled={!invoice || !supplier || running || Boolean(done)} loading={running && !blocked} onClick={() => invoice && supplier && run(invoice, supplier)}>
                {invoice?.status === 'error' && !done ? 'Reintentar envío' : 'Ejecutar envío'}
              </Button>
              {invoice && (
                <Link to={`/facturas/${invoice.id}`} className="text-xs font-medium text-brand-600 hover:underline">Ver factura</Link>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-5">
            {/* Pasos */}
            <ol className="space-y-3 border-b border-slate-100 p-5 md:col-span-2 md:border-b-0 md:border-r">
              {steps.map((st, i) => (
                <li key={st.id} className="flex items-start gap-3">
                  <div className="mt-0.5"><StepIcon state={st.state} /></div>
                  <div>
                    <p className={cn('text-sm', st.state === 'pending' ? 'text-slate-400' : 'font-medium text-slate-800', st.state === 'fail' && 'text-red-700')}>
                      {i + 1}. {st.title}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            {/* Consola */}
            <div className="md:col-span-3">
              <div ref={consoleRef} className="h-72 overflow-y-auto bg-slate-900 p-4 font-mono text-[11px] leading-relaxed text-slate-300">
                <div className="mb-2 flex items-center gap-2 text-slate-500"><Terminal className="h-3.5 w-3.5" /> siigo-connector · {invoice ? invoice.fields.number : '—'}</div>
                {steps.every((s) => s.state === 'pending') && <p className="text-slate-500">Pulsa “Ejecutar envío” para ver el flujo completo.</p>}
                {steps.map((st) =>
                  st.lines.map((l, i) => (
                    <p key={st.id + i} className={cn('whitespace-pre-wrap break-all', l.startsWith('← 4') || l.startsWith('← error') ? 'text-red-400' : l.startsWith('← 2') ? 'text-emerald-400' : l.startsWith('{') ? 'text-slate-500' : l.startsWith('GET') || l.startsWith('POST') ? 'text-sky-300' : '')}>
                      {l}
                    </p>
                  )),
                )}
              </div>

              {blocked === 'missing-customer' && supplier && (
                <div className="flex items-start gap-3 border-t border-red-200 bg-red-50 p-4">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                  <div className="flex-1 text-sm">
                    <p className="font-medium text-red-800">Siigo no tiene registrado a este proveedor</p>
                    <p className="mt-0.5 text-red-700">El tercero con NIT <strong>{supplier.nit}</strong> ({supplier.name}) no existe. Sin tercero no se puede crear el comprobante.</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" variant="primary" loading={creating} icon={<UserPlus className="h-3.5 w-3.5" />} onClick={() => createCustomer(supplier)}>
                        Crear tercero en Siigo
                      </Button>
                      <Link to="/proveedores" className="inline-flex h-8 items-center text-xs font-medium text-red-700 underline">Revisar el NIT en Proveedores</Link>
                    </div>
                  </div>
                </div>
              )}

              {!blocked && !running && supplier?.siigoExists && invoice?.status === 'error' && steps.find((s) => s.id === 'customer')?.state === 'ok' && (
                <div className="flex items-center gap-3 border-t border-emerald-200 bg-emerald-50 p-4 text-sm">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <span className="flex-1 text-emerald-800">Tercero creado. Ahora sí: reintenta el envío.</span>
                  <Button size="sm" variant="success" icon={<RefreshCw className="h-3.5 w-3.5" />} onClick={() => run(invoice, supplier)}>Reintentar envío</Button>
                </div>
              )}

              {done && (
                <div className="flex items-center gap-3 border-t border-emerald-200 bg-emerald-50 p-4 text-sm">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <span className="text-emerald-800">
                    Registrada en <SiigoMark className="h-4" /> como comprobante <strong>{done.voucher}</strong>. La factura pasó a “Enviada a Siigo” y quedó en auditoría.
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Errores + historial */}
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader title="Errores pendientes" subtitle={errors.length ? `${errors.length} ${errors.length === 1 ? 'factura bloqueada' : 'facturas bloqueadas'} en Siigo` : 'Sin errores pendientes'} />
            {errors.length === 0 ? (
              <Empty>Todo lo aprobado está en Siigo.</Empty>
            ) : (
              <ul className="divide-y divide-slate-100">
                {errors.map((i) => (
                  <li key={i.id} className="flex items-start gap-3 px-5 py-3">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800">{i.fields.number} · {i.fields.supplierName}</p>
                      <p className="mt-0.5 text-xs text-red-700">{i.siigoError}</p>
                    </div>
                    <Button size="sm" onClick={() => setSelectedId(i.id)}>Resolver</Button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Historial de envíos" subtitle="Últimas respuestas de Siigo" />
            {sentEvents.length === 0 ? (
              <Empty>Sin envíos todavía.</Empty>
            ) : (
              <ul className="divide-y divide-slate-100 text-xs">
                {sentEvents.map((e) => {
                  const inv = invoices.find((i) => i.id === e.invoiceId)
                  const ok = e.action === 'Enviada a Siigo'
                  return (
                    <li key={e.id} className="flex items-start gap-3 px-5 py-2.5">
                      {ok ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" /> : <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />}
                      <div className="min-w-0 flex-1">
                        <Link to={`/facturas/${e.invoiceId}`} className="font-medium text-slate-800 hover:underline">{inv?.fields.number ?? e.invoiceId}</Link>
                        <span className="text-slate-500"> · {e.detail}</span>
                      </div>
                      <span className="shrink-0 text-slate-400">{fmtDateTime(e.at)}</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  )
}
