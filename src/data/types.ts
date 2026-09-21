export type MailProvider = 'google' | 'microsoft'
export type MailboxStatus = 'conectado' | 'sincronizando' | 'error'

export interface Mailbox {
  id: string
  email: string
  provider: MailProvider
  status: MailboxStatus
  lastSync: string // ISO
  emailsRead: number
  invoicesFound: number
}

export interface Supplier {
  id: string
  nit: string
  name: string
  defaultAccount: string
  accountName: string
  costCenter: string
  emailDomain: string
  /** false → el envío a Siigo falla con "tercero no existe" */
  siigoExists: boolean
}

export type InvoiceSource = 'xml_dian' | 'pdf_ocr'
export type InvoiceStatus =
  | 'nueva'
  | 'revisando'
  | 'aprobada'
  | 'enviada'
  | 'error'
  | 'rechazada'

export interface InvoiceItem {
  description: string
  quantity: number
  unit: string
  unitPrice: number
}

export type Confidence = 'alta' | 'media' | 'baja'

export interface InvoiceFields {
  supplierNit: string
  supplierName: string
  number: string
  issueDate: string
  cufe: string
  subtotal: number
  iva: number
  retefuente: number
  total: number
}

export interface Invoice {
  id: string
  fields: InvoiceFields
  supplierId: string
  mailboxId: string
  source: InvoiceSource
  status: InvoiceStatus
  receivedAt: string
  items: InvoiceItem[]
  /** solo para pdf_ocr: confianza por campo */
  confidence?: Partial<Record<keyof InvoiceFields, Confidence>>
  email: { from: string; subject: string; date: string; attachments: string[] }
  siigoVoucher?: string
  siigoError?: string
  sentAt?: string
}

export interface AuditEvent {
  id: string
  invoiceId: string
  at: string
  actor: string
  action: string
  detail?: string
}

export interface Rule {
  id: string
  match: string
  supplierId: string
  account: string
  enabled: boolean
}
