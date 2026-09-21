import type {
  AuditEvent,
  Confidence,
  Invoice,
  InvoiceItem,
  InvoiceStatus,
  Mailbox,
  Rule,
  Supplier,
} from './types'

// PRNG determinista: la demo se ve igual en cada recarga.
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(20260921)
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]
const between = (a: number, b: number) => a + Math.floor(rand() * (b - a + 1))

export const NOW = new Date('2026-09-21T10:30:00-05:00')

const iso = (d: Date) => d.toISOString()
const daysAgo = (n: number, hour = 9, min = 0) => {
  const d = new Date(NOW)
  d.setDate(d.getDate() - n)
  d.setHours(hour, min, 0, 0)
  return d
}

export const mailboxes: Mailbox[] = [
  {
    id: 'mb-google',
    email: 'facturas@todocosturas.com',
    provider: 'google',
    status: 'conectado',
    lastSync: iso(daysAgo(0, 10, 12)),
    emailsRead: 1284,
    invoicesFound: 312,
  },
  {
    id: 'mb-ms',
    email: 'compras@todocosturas.com',
    provider: 'microsoft',
    status: 'conectado',
    lastSync: iso(daysAgo(0, 10, 5)),
    emailsRead: 863,
    invoicesFound: 141,
  },
]

export const suppliers: Supplier[] = [
  { id: 'sup-1', nit: '900.123.456-7', name: 'Textiles Lafayette S.A.', defaultAccount: '620505', accountName: 'Compra de telas', costCenter: 'CC-01 Producción', emailDomain: 'lafayette.com.co', siigoExists: true },
  { id: 'sup-2', nit: '860.002.541-3', name: 'Coats Cadena Andina S.A.', defaultAccount: '620510', accountName: 'Hilos e insumos', costCenter: 'CC-01 Producción', emailDomain: 'coats.com', siigoExists: true },
  { id: 'sup-3', nit: '830.045.112-9', name: 'Botones y Herrajes El Dorado Ltda.', defaultAccount: '620515', accountName: 'Botones y accesorios', costCenter: 'CC-01 Producción', emailDomain: 'botoneseldorado.co', siigoExists: true },
  { id: 'sup-4', nit: '901.334.876-1', name: 'Maquinaria Industrial Juki Colombia', defaultAccount: '152005', accountName: 'Maquinaria y equipo', costCenter: 'CC-02 Mantenimiento', emailDomain: 'jukicolombia.com', siigoExists: true },
  { id: 'sup-5', nit: '800.987.654-2', name: 'Distribuidora de Cremalleras YKK', defaultAccount: '620515', accountName: 'Botones y accesorios', costCenter: 'CC-01 Producción', emailDomain: 'ykk.com.co', siigoExists: true },
  { id: 'sup-6', nit: '901.556.210-4', name: 'Empaques Flexibles del Norte S.A.S.', defaultAccount: '620520', accountName: 'Empaques y etiquetas', costCenter: 'CC-03 Logística', emailDomain: 'empaquesnorte.com', siigoExists: true },
  { id: 'sup-7', nit: '830.112.998-5', name: 'Transportes Rápido Ochoa', defaultAccount: '523550', accountName: 'Fletes y acarreos', costCenter: 'CC-03 Logística', emailDomain: 'rapidoochoa.com', siigoExists: true },
  { id: 'sup-8', nit: '901.778.334-0', name: 'Servicios Eléctricos Bogotá S.A.S.', defaultAccount: '513535', accountName: 'Servicios públicos', costCenter: 'CC-04 Administración', emailDomain: 'selectricos.co', siigoExists: true },
  { id: 'sup-9', nit: '900.445.667-8', name: 'Tintorería Industrial Colortex', defaultAccount: '620525', accountName: 'Servicios de tintura', costCenter: 'CC-01 Producción', emailDomain: 'colortex.com.co', siigoExists: false },
  { id: 'sup-10', nit: '811.223.445-6', name: 'Papelería y Suministros Office Max', defaultAccount: '519530', accountName: 'Útiles y papelería', costCenter: 'CC-04 Administración', emailDomain: 'officemax.com.co', siigoExists: true },
]

export const rules: Rule[] = suppliers.slice(0, 8).map((s, i) => ({
  id: `rule-${i + 1}`,
  match: `@${s.emailDomain}`,
  supplierId: s.id,
  account: s.defaultAccount,
  enabled: true,
}))

const itemCatalog: Record<string, InvoiceItem[]> = {
  'sup-1': [
    { description: 'Tela dril 100% algodón, ancho 1.50 m', quantity: 120, unit: 'm', unitPrice: 18500 },
    { description: 'Tela popelina poliéster/algodón', quantity: 200, unit: 'm', unitPrice: 12800 },
    { description: 'Lino stretch color crudo', quantity: 60, unit: 'm', unitPrice: 31000 },
  ],
  'sup-2': [
    { description: 'Hilo Epic 120 cono 5000 m, negro', quantity: 48, unit: 'un', unitPrice: 9800 },
    { description: 'Hilo Epic 120 cono 5000 m, blanco', quantity: 48, unit: 'un', unitPrice: 9800 },
    { description: 'Hilo Nylbond 40 cono 3000 m', quantity: 24, unit: 'un', unitPrice: 15400 },
  ],
  'sup-3': [
    { description: 'Botón 4 huecos 18L poliéster, gruesa', quantity: 40, unit: 'gr', unitPrice: 6200 },
    { description: 'Hebilla metálica 30 mm níquel', quantity: 500, unit: 'un', unitPrice: 890 },
  ],
  'sup-4': [
    { description: 'Máquina plana industrial Juki DDL-8700', quantity: 2, unit: 'un', unitPrice: 2850000 },
    { description: 'Mantenimiento preventivo fileteadora', quantity: 1, unit: 'srv', unitPrice: 320000 },
  ],
  'sup-5': [
    { description: 'Cremallera nylon #5 20 cm surtida', quantity: 1000, unit: 'un', unitPrice: 720 },
    { description: 'Cremallera metálica #4 15 cm bronce', quantity: 500, unit: 'un', unitPrice: 1350 },
  ],
  'sup-6': [
    { description: 'Bolsa polipropileno 30x40 con adhesivo', quantity: 5000, unit: 'un', unitPrice: 95 },
    { description: 'Etiqueta tejida marca, 1000 un', quantity: 3, unit: 'pq', unitPrice: 185000 },
  ],
  'sup-7': [{ description: 'Flete Bogotá – Medellín, 12 cajas', quantity: 1, unit: 'srv', unitPrice: 486000 }],
  'sup-8': [{ description: 'Servicio de energía, periodo mensual', quantity: 1, unit: 'srv', unitPrice: 2140000 }],
  'sup-9': [
    { description: 'Tintura reactiva lote 40 kg, azul índigo', quantity: 40, unit: 'kg', unitPrice: 14500 },
    { description: 'Lavado enzimático 60 kg', quantity: 60, unit: 'kg', unitPrice: 6800 },
  ],
  'sup-10': [
    { description: 'Resma papel carta 75 g', quantity: 20, unit: 'un', unitPrice: 17900 },
    { description: 'Tóner HP 85A compatible', quantity: 4, unit: 'un', unitPrice: 68000 },
  ],
}

const subjects = [
  'Factura electrónica {n} - {sup}',
  'Envío de factura {n}',
  'Documento electrónico DIAN {n}',
  '{sup}: Factura de venta {n}',
  'Fwd: Factura {n} pedido de septiembre',
]

function makeCufe() {
  const hex = '0123456789abcdef'
  let s = ''
  for (let i = 0; i < 96; i++) s += hex[Math.floor(rand() * 16)]
  return s
}

const conf = (): Confidence => {
  const r = rand()
  return r < 0.7 ? 'alta' : r < 0.9 ? 'media' : 'baja'
}

let auditSeq = 1
export const newAuditId = () => `ev-${auditSeq++}`
const audit: AuditEvent[] = []

const ACTORS = ['Ana Gómez', 'Carlos Ruiz', 'Sistema']

function buildInvoice(idx: number, ageDays: number, status: InvoiceStatus, events: AuditEvent[]): Invoice {
  const pushAudit = (invoiceId: string, at: Date, actor: string, action: string, detail?: string) =>
    events.push({ id: newAuditId(), invoiceId, at: iso(at), actor, action, detail })
  // Las que fallan en Siigo son siempre del proveedor que no existe allá.
  const supplier = status === 'error' ? suppliers.find((x) => !x.siigoExists)! : suppliers[idx % suppliers.length]
  const mailbox = rand() < 0.65 ? mailboxes[0] : mailboxes[1]
  const source = rand() < 0.6 ? 'xml_dian' : 'pdf_ocr'
  const prefix = pick(['FE', 'FV', 'FEV', 'F'])
  const number = `${prefix}-${between(1000, 9999)}`
  const received = daysAgo(ageDays, ageDays === 0 ? between(7, 10) : between(7, 18), between(0, 59))
  const issue = new Date(received)
  issue.setDate(issue.getDate() - between(0, 3))

  const catalog = itemCatalog[supplier.id]
  const items = catalog.slice(0, between(1, catalog.length)).map((it) => ({
    ...it,
    quantity: Math.max(1, Math.round(it.quantity * (0.6 + rand() * 0.8))),
  }))
  const subtotal = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0)
  const iva = Math.round(subtotal * 0.19)
  const retefuente = subtotal > 1_000_000 ? Math.round(subtotal * 0.025) : 0
  const total = subtotal + iva - retefuente

  const id = `inv-${String(idx + 1).padStart(3, '0')}`
  const inv: Invoice = {
    id,
    supplierId: supplier.id,
    mailboxId: mailbox.id,
    source,
    status,
    receivedAt: iso(received),
    items,
    fields: {
      supplierNit: supplier.nit,
      supplierName: supplier.name,
      number,
      issueDate: issue.toISOString().slice(0, 10),
      cufe: makeCufe(),
      subtotal,
      iva,
      retefuente,
      total,
    },
    email: {
      from: `facturacion@${supplier.emailDomain}`,
      subject: pick(subjects).replace('{n}', number).replace('{sup}', supplier.name),
      date: iso(received),
      attachments:
        source === 'xml_dian'
          ? [`${number}.zip`, `${number}.xml`, `${number}.pdf`]
          : [`${number}.pdf`],
    },
  }

  if (source === 'pdf_ocr') {
    inv.confidence = {
      supplierNit: conf(),
      supplierName: 'alta',
      number: conf(),
      issueDate: conf(),
      subtotal: conf(),
      iva: conf(),
      retefuente: conf(),
      total: conf(),
    }
    // Garantiza al menos un campo dudoso en las OCR nuevas para que la demo lo muestre.
    if (status === 'nueva' && Object.values(inv.confidence).every((c) => c === 'alta')) {
      inv.confidence.total = 'media'
    }
  }

  // Auditoría coherente con el estado
  pushAudit(id, received, 'Sistema', 'Factura detectada', `Correo de ${inv.email.from} · ${mailbox.email}`)
  pushAudit(
    id,
    new Date(received.getTime() + 20_000),
    'Sistema',
    source === 'xml_dian' ? 'XML DIAN procesado' : 'PDF procesado con OCR',
    source === 'xml_dian' ? 'CUFE validado' : 'Extracción con IA · revisar campos marcados',
  )
  const actor = pick(ACTORS.slice(0, 2))
  if (['revisando', 'aprobada', 'enviada', 'error', 'rechazada'].includes(status)) {
    pushAudit(id, new Date(received.getTime() + 3_600_000), actor, 'Revisión iniciada')
  }
  if (status === 'rechazada') {
    pushAudit(id, new Date(received.getTime() + 5_400_000), actor, 'Factura rechazada', 'Duplicada — ya registrada en periodo anterior')
  }
  if (['aprobada', 'enviada', 'error'].includes(status)) {
    pushAudit(id, new Date(received.getTime() + 7_200_000), actor, 'Factura aprobada')
  }
  if (status === 'enviada') {
    const sent = new Date(received.getTime() + 7_500_000)
    inv.siigoVoucher = `CE-${between(4000, 4999)}`
    inv.sentAt = iso(sent)
    pushAudit(id, sent, 'Sistema', 'Enviada a Siigo', `Comprobante ${inv.siigoVoucher}`)
  }
  if (status === 'error') {
    inv.siigoError = 'Siigo respondió 404: el tercero con NIT ' + supplier.nit + ' no existe.'
    pushAudit(id, new Date(received.getTime() + 7_500_000), 'Sistema', 'Error al enviar a Siigo', inv.siigoError)
  }
  return inv
}

// Distribución de estados creíble para un cierre de mes.
const plan: Array<[number, InvoiceStatus]> = []
for (let i = 0; i < 64; i++) {
  const age = i < 6 ? 0 : i < 12 ? 1 : i < 18 ? between(2, 5) : between(6, 45)
  let status: InvoiceStatus
  if (i < 6) status = 'nueva'
  else if (i < 10) status = 'revisando'
  else if (i < 14) status = 'aprobada'
  else if (i === 14 || i === 27) status = 'error'
  else if (i === 20) status = 'rechazada'
  else status = 'enviada'
  plan.push([age, status])
}

export const invoices: Invoice[] = plan
  .map(([age, status], i) => buildInvoice(i, age, status, audit))
  .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))

export const auditEvents: AuditEvent[] = [...audit].sort((a, b) => b.at.localeCompare(a.at))

/** Facturas "nuevas" que aparecen al sincronizar un buzón. */
export function makeIncomingInvoices(
  mailboxId: string,
  count: number,
  existing: number,
): { invoices: Invoice[]; events: AuditEvent[] } {
  const out: Invoice[] = []
  const events: AuditEvent[] = []
  for (let i = 0; i < count; i++) {
    const inv = buildInvoice(existing + i, 0, 'nueva', events)
    inv.id = `inv-${String(existing + i + 1).padStart(3, '0')}`
    inv.mailboxId = mailboxId
    inv.receivedAt = new Date().toISOString()
    inv.email.date = inv.receivedAt
    for (const ev of events) if (ev.invoiceId === inv.id) ev.at = inv.receivedAt
    out.push(inv)
  }
  return { invoices: out, events }
}

export const currentUser = { name: 'Ana Gómez', role: 'Contabilidad · Todocosturas', initials: 'AG' }
