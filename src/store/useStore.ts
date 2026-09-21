import { create } from 'zustand'
import type { AuditEvent, Invoice, InvoiceFields, Mailbox, Rule, Supplier } from '@/data/types'
import {
  auditEvents as seedAudit,
  currentUser,
  invoices as seedInvoices,
  mailboxes as seedMailboxes,
  makeIncomingInvoices,
  newAuditId,
  rules as seedRules,
  suppliers as seedSuppliers,
} from '@/data/seed'

export interface Toast {
  id: number
  title: string
  description?: string
  kind: 'success' | 'error' | 'info'
}

interface State {
  invoices: Invoice[]
  suppliers: Supplier[]
  mailboxes: Mailbox[]
  audit: AuditEvent[]
  rules: Rule[]
  toasts: Toast[]
  loggedIn: boolean
}

interface Actions {
  login: () => void
  logout: () => void
  reset: () => void
  toast: (t: Omit<Toast, 'id'>) => void
  dismissToast: (id: number) => void

  startReview: (id: string) => void
  updateFields: (id: string, patch: Partial<InvoiceFields>) => void
  approve: (ids: string[]) => void
  reject: (id: string, reason: string) => void
  sendToSiigo: (ids: string[]) => Promise<void>
  syncMailbox: (id: string) => Promise<void>

  updateSupplier: (id: string, patch: Partial<Supplier>) => void
  addRule: (rule: Omit<Rule, 'id'>) => void
  toggleRule: (id: string) => void
  deleteRule: (id: string) => void
}

const clone = <T,>(v: T): T => structuredClone(v)

// La sesión decorativa sobrevive recargas para que los deep links de la demo funcionen.
const LOGIN_KEY = 'tc-demo-login'
const readLogin = () => {
  try {
    return sessionStorage.getItem(LOGIN_KEY) === '1'
  } catch {
    return false
  }
}
const writeLogin = (v: boolean) => {
  try {
    v ? sessionStorage.setItem(LOGIN_KEY, '1') : sessionStorage.removeItem(LOGIN_KEY)
  } catch {
    /* sin storage (modo privado): la sesión solo dura en memoria */
  }
}

const initial = (): State => ({
  invoices: clone(seedInvoices),
  suppliers: clone(seedSuppliers),
  mailboxes: clone(seedMailboxes),
  audit: clone(seedAudit),
  rules: clone(seedRules),
  toasts: [],
  loggedIn: readLogin(),
})

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
let toastSeq = 1

export const useStore = create<State & Actions>((set, get) => {
  const log = (invoiceId: string, action: string, detail?: string, actor = currentUser.name) => {
    const ev: AuditEvent = { id: newAuditId(), invoiceId, at: new Date().toISOString(), actor, action, detail }
    set((s) => ({ audit: [ev, ...s.audit] }))
  }
  const patchInvoice = (id: string, patch: Partial<Invoice>) =>
    set((s) => ({ invoices: s.invoices.map((i) => (i.id === id ? { ...i, ...patch } : i)) }))

  return {
    ...initial(),

    login: () => {
      writeLogin(true)
      set({ loggedIn: true })
    },
    logout: () => {
      writeLogin(false)
      set({ loggedIn: false })
    },
    reset: () => set({ ...initial(), loggedIn: true }),

    toast: (t) => {
      const id = toastSeq++
      set((s) => ({ toasts: [...s.toasts, { ...t, id }] }))
      setTimeout(() => get().dismissToast(id), 4500)
    },
    dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

    startReview: (id) => {
      const inv = get().invoices.find((i) => i.id === id)
      if (inv?.status === 'nueva') {
        patchInvoice(id, { status: 'revisando' })
        log(id, 'Revisión iniciada')
      }
    },

    updateFields: (id, patch) => {
      const inv = get().invoices.find((i) => i.id === id)
      if (!inv) return
      const fields = { ...inv.fields, ...patch }
      // Recalcular total si cambió alguna base.
      if ('subtotal' in patch || 'iva' in patch || 'retefuente' in patch) {
        fields.total = fields.subtotal + fields.iva - fields.retefuente
      }
      // Un campo corregido a mano pasa a confianza alta.
      const confidence = inv.confidence
        ? { ...inv.confidence, ...Object.fromEntries(Object.keys(patch).map((k) => [k, 'alta'])) }
        : undefined
      patchInvoice(id, { fields, confidence, status: inv.status === 'nueva' ? 'revisando' : inv.status })
      const changed = Object.keys(patch).join(', ')
      log(id, 'Campo corregido', changed)
    },

    approve: (ids) => {
      const ok = get().invoices.filter((i) => ids.includes(i.id) && ['nueva', 'revisando'].includes(i.status))
      for (const inv of ok) {
        patchInvoice(inv.id, { status: 'aprobada' })
        log(inv.id, 'Factura aprobada')
      }
      if (ok.length)
        get().toast({
          kind: 'success',
          title: ok.length === 1 ? `Factura ${ok[0].fields.number} aprobada` : `${ok.length} facturas aprobadas`,
        })
    },

    reject: (id, reason) => {
      patchInvoice(id, { status: 'rechazada' })
      log(id, 'Factura rechazada', reason)
      get().toast({ kind: 'info', title: 'Factura rechazada', description: reason })
    },

    sendToSiigo: async (ids) => {
      const { invoices, suppliers } = get()
      const targets = invoices.filter((i) => ids.includes(i.id) && ['aprobada', 'error'].includes(i.status))
      if (!targets.length) return
      await sleep(1800)
      let ok = 0
      let failed = 0
      for (const inv of targets) {
        const supplier = suppliers.find((s) => s.id === inv.supplierId)
        if (supplier?.siigoExists) {
          const voucher = `CE-${4500 + Math.floor(Math.random() * 400)}`
          patchInvoice(inv.id, { status: 'enviada', siigoVoucher: voucher, siigoError: undefined, sentAt: new Date().toISOString() })
          log(inv.id, 'Enviada a Siigo', `Comprobante ${voucher}`, 'Sistema')
          ok++
        } else {
          const err = `Siigo respondió 404: el tercero con NIT ${inv.fields.supplierNit} no existe.`
          patchInvoice(inv.id, { status: 'error', siigoError: err })
          log(inv.id, 'Error al enviar a Siigo', err, 'Sistema')
          failed++
        }
      }
      if (ok)
        get().toast({ kind: 'success', title: ok === 1 ? 'Factura enviada a Siigo' : `${ok} facturas enviadas a Siigo` })
      if (failed)
        get().toast({
          kind: 'error',
          title: failed === 1 ? '1 factura falló en Siigo' : `${failed} facturas fallaron en Siigo`,
          description: 'Revisa el detalle para reintentar.',
        })
    },

    syncMailbox: async (id) => {
      set((s) => ({ mailboxes: s.mailboxes.map((m) => (m.id === id ? { ...m, status: 'sincronizando' } : m)) }))
      await sleep(2800)
      const count = 2 + Math.floor(Math.random() * 2)
      const { invoices: incoming, events } = makeIncomingInvoices(id, count, get().invoices.length)
      set((s) => ({
        invoices: [...incoming, ...s.invoices],
        audit: [...events.reverse(), ...s.audit],
        mailboxes: s.mailboxes.map((m) =>
          m.id === id
            ? {
                ...m,
                status: 'conectado',
                lastSync: new Date().toISOString(),
                emailsRead: m.emailsRead + 5 + count,
                invoicesFound: m.invoicesFound + count,
              }
            : m,
        ),
      }))
      const mb = get().mailboxes.find((m) => m.id === id)
      get().toast({
        kind: 'success',
        title: `${count} facturas nuevas detectadas`,
        description: `Buzón ${mb?.email} sincronizado`,
      })
    },

    updateSupplier: (id, patch) =>
      set((s) => ({ suppliers: s.suppliers.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),

    addRule: (rule) =>
      set((s) => ({ rules: [...s.rules, { ...rule, id: `rule-${Date.now()}` }] })),
    toggleRule: (id) =>
      set((s) => ({ rules: s.rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)) })),
    deleteRule: (id) => set((s) => ({ rules: s.rules.filter((r) => r.id !== id) })),
  }
})

export const useInvoice = (id: string | undefined) => useStore((s) => s.invoices.find((i) => i.id === id))
export const useSupplier = (id: string | undefined) => useStore((s) => s.suppliers.find((x) => x.id === id))
