import { useState } from 'react'
import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button, Modal } from '@/components/ui'
import { useStore } from '@/store/useStore'
import { money } from '@/lib/utils'

export const SiigoMark = ({ className = 'h-5' }: { className?: string }) => (
  <span className={`inline-flex items-center rounded bg-[#00B2A9] px-1.5 font-bold tracking-tight text-white ${className}`} style={{ fontSize: '0.7em', lineHeight: 1.6 }}>
    siigo
  </span>
)

export function SiigoModal({ ids, open, onClose }: { ids: string[]; open: boolean; onClose: () => void }) {
  const allInvoices = useStore((s) => s.invoices)
  const invoices = allInvoices.filter((i) => ids.includes(i.id))
  const suppliers = useStore((s) => s.suppliers)
  const send = useStore((s) => s.sendToSiigo)
  const [busy, setBusy] = useState(false)

  const rows = invoices.map((inv) => ({ inv, sup: suppliers.find((s) => s.id === inv.supplierId) }))
  const total = invoices.reduce((s, i) => s + i.fields.total, 0)

  const confirm = async () => {
    setBusy(true)
    await send(ids)
    setBusy(false)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={busy ? () => {} : onClose}
      title={`Enviar ${invoices.length === 1 ? 'factura' : `${invoices.length} facturas`} a Siigo`}
      wide
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>Cancelar</Button>
          <Button variant="primary" onClick={confirm} loading={busy} icon={<ArrowRight className="h-4 w-4" />}>
            {busy ? 'Enviando a Siigo…' : 'Confirmar envío'}
          </Button>
        </>
      }
    >
      <div className="mb-4 flex items-center justify-between rounded-lg bg-slate-50 p-3 text-xs">
        <div className="flex items-center gap-2">
          <SiigoMark />
          <span className="text-slate-600">Todocosturas S.A.S. · NIT 800.155.209-1 · Comprobante de compra (CE)</span>
        </div>
        <span className="flex items-center gap-1 font-medium text-emerald-600">
          <CheckCircle2 className="h-3.5 w-3.5" /> Conexión activa
        </span>
      </div>

      <div className="max-h-80 overflow-y-auto rounded-lg ring-1 ring-slate-200">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-left uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-3 py-2 font-medium">Factura</th>
              <th className="px-3 py-2 font-medium">Tercero en Siigo</th>
              <th className="px-3 py-2 font-medium">Cuenta</th>
              <th className="px-3 py-2 font-medium">Centro de costo</th>
              <th className="px-3 py-2 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(({ inv, sup }) => (
              <tr key={inv.id} className={sup?.siigoExists ? '' : 'bg-amber-50/60'}>
                <td className="px-3 py-2 font-medium text-slate-900">{inv.fields.number}</td>
                <td className="px-3 py-2">
                  <div className="text-slate-800">{inv.fields.supplierName}</div>
                  <div className="flex items-center gap-1 text-slate-500">
                    NIT {inv.fields.supplierNit}
                    {sup?.siigoExists ? (
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <span className="flex items-center gap-0.5 whitespace-nowrap text-amber-600"><AlertTriangle className="h-3 w-3" /> no encontrado</span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="font-mono text-slate-800">{sup?.defaultAccount}</div>
                  <div className="text-slate-500">{sup?.accountName}</div>
                </td>
                <td className="px-3 py-2 text-slate-700">{sup?.costCenter}</td>
                <td className="px-3 py-2 text-right tabular-nums font-medium text-slate-900">{money(inv.fields.total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50">
            <tr>
              <td colSpan={4} className="px-3 py-2 text-right font-medium text-slate-600">Total a registrar</td>
              <td className="px-3 py-2 text-right tabular-nums font-semibold text-slate-900">{money(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Se crea un comprobante de compra por factura, con IVA descontable y retención en la fuente según lo extraído. Los terceros no encontrados fallarán y quedarán marcados para corrección.
      </p>
    </Modal>
  )
}
