import { useState } from 'react'
import { AlertTriangle, CheckCircle2, Plus, Trash2 } from 'lucide-react'
import { Button, Card, CardHeader, Modal, PageHeader, inputClass, selectClass } from '@/components/ui'
import { useStore } from '@/store/useStore'
import type { Supplier } from '@/data/types'
import { cn, money } from '@/lib/utils'

function InlineEdit({ value, onSave, mono, className }: { value: string; onSave: (v: string) => void; mono?: boolean; className?: string }) {
  const [draft, setDraft] = useState(value)
  return (
    <input
      className={cn('w-full rounded border border-transparent bg-transparent px-1.5 py-1 text-sm hover:border-slate-300 focus:border-brand-500 focus:bg-white focus:outline-none', mono && 'font-mono', className)}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => draft !== value && onSave(draft)}
      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
    />
  )
}

export default function Suppliers() {
  const suppliers = useStore((s) => s.suppliers)
  const invoices = useStore((s) => s.invoices)
  const rules = useStore((s) => s.rules)
  const updateSupplier = useStore((s) => s.updateSupplier)
  const addRule = useStore((s) => s.addRule)
  const toggleRule = useStore((s) => s.toggleRule)
  const deleteRule = useStore((s) => s.deleteRule)
  const toast = useStore((s) => s.toast)

  const [ruleOpen, setRuleOpen] = useState(false)
  const [newRule, setNewRule] = useState({ match: '', supplierId: suppliers[0]?.id ?? '', account: '' })

  const stats = (s: Supplier) => {
    const mine = invoices.filter((i) => i.supplierId === s.id)
    return { n: mine.length, total: mine.reduce((a, i) => a + i.fields.total, 0) }
  }

  return (
    <>
      <PageHeader title="Proveedores y reglas" subtitle="Cada proveedor define cómo se contabiliza y las reglas asignan facturas automáticamente por remitente." />

      <Card className="overflow-hidden">
        <CardHeader title="Proveedores" subtitle="Editá cuenta y centro de costo directamente en la tabla." />
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-2.5 font-medium">Proveedor</th>
              <th className="px-4 py-2.5 font-medium">NIT</th>
              <th className="px-4 py-2.5 font-medium">Cuenta contable</th>
              <th className="px-4 py-2.5 font-medium">Centro de costo</th>
              <th className="px-4 py-2.5 font-medium">En Siigo</th>
              <th className="px-4 py-2.5 text-right font-medium">Facturas</th>
              <th className="px-4 py-2.5 text-right font-medium">Acumulado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {suppliers.map((s) => {
              const st = stats(s)
              return (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2">
                    <div className="font-medium text-slate-800">{s.name}</div>
                    <div className="text-xs text-slate-400">@{s.emailDomain}</div>
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-slate-600">{s.nit}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-1">
                      <InlineEdit value={s.defaultAccount} mono className="w-20" onSave={(v) => updateSupplier(s.id, { defaultAccount: v })} />
                      <InlineEdit value={s.accountName} onSave={(v) => updateSupplier(s.id, { accountName: v })} />
                    </div>
                  </td>
                  <td className="px-4 py-2"><InlineEdit value={s.costCenter} onSave={(v) => updateSupplier(s.id, { costCenter: v })} /></td>
                  <td className="px-4 py-2">
                    {s.siigoExists ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /> Sincronizado</span>
                    ) : (
                      <button
                        onClick={() => {
                          updateSupplier(s.id, { siigoExists: true })
                          toast({ kind: 'success', title: `Tercero creado en Siigo`, description: `${s.name} · ${s.nit}. Ya podés reintentar las facturas con error.` })
                        }}
                        className="flex items-center gap-1 rounded bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200 hover:bg-amber-100"
                      >
                        <AlertTriangle className="h-3.5 w-3.5" /> Crear en Siigo
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-slate-700">{st.n}</td>
                  <td className="px-4 py-2 text-right tabular-nums font-medium text-slate-900">{money(st.total)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>

      <Card className="mt-6 overflow-hidden">
        <CardHeader
          title="Reglas de clasificación"
          subtitle="Se evalúan en orden sobre el remitente del correo. Sin regla, la factura queda 'Nueva' sin proveedor sugerido."
          action={<Button size="sm" variant="primary" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setRuleOpen(true)}>Nueva regla</Button>}
        />
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-2.5 font-medium">Si el remitente contiene</th>
              <th className="px-4 py-2.5 font-medium">Asignar proveedor</th>
              <th className="px-4 py-2.5 font-medium">Cuenta</th>
              <th className="px-4 py-2.5 font-medium">Activa</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rules.map((r) => (
              <tr key={r.id} className={cn('hover:bg-slate-50', !r.enabled && 'opacity-50')}>
                <td className="px-4 py-2 font-mono text-xs text-slate-700">{r.match}</td>
                <td className="px-4 py-2 text-slate-800">{suppliers.find((s) => s.id === r.supplierId)?.name}</td>
                <td className="px-4 py-2 font-mono text-xs text-slate-600">{r.account}</td>
                <td className="px-4 py-2">
                  <button onClick={() => toggleRule(r.id)} className={cn('relative h-5 w-9 rounded-full transition', r.enabled ? 'bg-brand-600' : 'bg-slate-300')} aria-label="Activar regla">
                    <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition', r.enabled ? 'left-[18px]' : 'left-0.5')} />
                  </button>
                </td>
                <td className="px-4 py-2 text-right">
                  <button onClick={() => deleteRule(r.id)} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Eliminar regla"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal
        open={ruleOpen}
        onClose={() => setRuleOpen(false)}
        title="Nueva regla de clasificación"
        footer={
          <>
            <Button onClick={() => setRuleOpen(false)}>Cancelar</Button>
            <Button
              variant="primary"
              disabled={!newRule.match || !newRule.account}
              onClick={() => {
                addRule({ ...newRule, enabled: true })
                setRuleOpen(false)
                setNewRule({ match: '', supplierId: suppliers[0]?.id ?? '', account: '' })
                toast({ kind: 'success', title: 'Regla creada' })
              }}
            >
              Guardar
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-600">Si el remitente contiene</label>
            <input className={cn(inputClass, 'mt-1 font-mono')} placeholder="@proveedor.com" value={newRule.match} onChange={(e) => setNewRule({ ...newRule, match: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Asignar proveedor</label>
            <select
              className={cn(selectClass, 'mt-1')}
              value={newRule.supplierId}
              onChange={(e) => {
                const sup = suppliers.find((s) => s.id === e.target.value)
                setNewRule({ ...newRule, supplierId: e.target.value, account: sup?.defaultAccount ?? newRule.account })
              }}
            >
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Cuenta contable</label>
            <input className={cn(inputClass, 'mt-1 font-mono')} placeholder="620505" value={newRule.account} onChange={(e) => setNewRule({ ...newRule, account: e.target.value })} />
          </div>
        </div>
      </Modal>
    </>
  )
}
