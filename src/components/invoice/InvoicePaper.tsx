import type { Invoice, Supplier } from '@/data/types'
import { money, fmtDate } from '@/lib/utils'

/** Render HTML que imita el PDF de la factura. En producción sería el PDF real (pdf.js). */
export function InvoicePaper({ invoice, supplier }: { invoice: Invoice; supplier?: Supplier }) {
  const f = invoice.fields
  const scanned = invoice.source === 'pdf_ocr'
  return (
    <div className="relative mx-auto w-full max-w-[640px] bg-white p-8 text-[11px] leading-relaxed text-slate-800 shadow-md ring-1 ring-slate-200" style={scanned ? { filter: 'contrast(0.95) sepia(0.08)', transform: 'rotate(-0.3deg)' } : undefined}>
      {scanned && <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(0,0,0,0.04),transparent_60%)]" />}
      <div className="flex items-start justify-between border-b-2 border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded bg-slate-800 text-sm font-bold text-white">{f.supplierName.slice(0, 1)}</div>
            <div>
              <p className="text-base font-bold uppercase tracking-wide">{f.supplierName}</p>
              <p className="text-slate-500">NIT {f.supplierNit} · Régimen común · Responsable de IVA</p>
            </div>
          </div>
          <p className="mt-2 text-slate-500">Calle 12 # 34-56, Bogotá D.C. · facturacion@{supplier?.emailDomain} · (601) 555 01 23</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest text-slate-500">Factura electrónica de venta</p>
          <p className="text-xl font-bold">{f.number}</p>
          <p className="text-slate-500">Fecha: {fmtDate(f.issueDate)}</p>
          <p className="text-slate-500">Vence: {fmtDate(new Date(new Date(f.issueDate).getTime() + 30 * 86_400_000).toISOString())}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 rounded border border-slate-200 p-3">
        <div>
          <p className="text-[10px] font-semibold uppercase text-slate-400">Cliente</p>
          <p className="font-semibold">Todocosturas S.A.S.</p>
          <p>NIT 800.155.209-1</p>
          <p>Cra. 68 # 23A-10, Bogotá D.C.</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase text-slate-400">Condiciones</p>
          <p>Forma de pago: Crédito 30 días</p>
          <p>Medio de pago: Transferencia</p>
          <p>Orden de compra: OC-{f.number.slice(-4)}</p>
        </div>
      </div>

      <table className="mt-4 w-full">
        <thead>
          <tr className="border-b border-slate-800 text-left text-[10px] uppercase text-slate-500">
            <th className="py-1.5 font-semibold">#</th>
            <th className="py-1.5 font-semibold">Descripción</th>
            <th className="py-1.5 text-right font-semibold">Cant.</th>
            <th className="py-1.5 font-semibold">Und.</th>
            <th className="py-1.5 text-right font-semibold">Vr. unitario</th>
            <th className="py-1.5 text-right font-semibold">Vr. total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((it, i) => (
            <tr key={i} className="border-b border-slate-100">
              <td className="py-1.5 text-slate-400">{i + 1}</td>
              <td className="py-1.5">{it.description}</td>
              <td className="py-1.5 text-right tabular-nums">{it.quantity.toLocaleString('es-CO')}</td>
              <td className="py-1.5">{it.unit}</td>
              <td className="py-1.5 text-right tabular-nums">{money(it.unitPrice)}</td>
              <td className="py-1.5 text-right tabular-nums">{money(it.quantity * it.unitPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 flex justify-end">
        <table className="w-64">
          <tbody>
            <tr><td className="py-0.5 text-slate-500">Subtotal</td><td className="py-0.5 text-right tabular-nums">{money(f.subtotal)}</td></tr>
            <tr><td className="py-0.5 text-slate-500">IVA 19%</td><td className="py-0.5 text-right tabular-nums">{money(f.iva)}</td></tr>
            {f.retefuente > 0 && <tr><td className="py-0.5 text-slate-500">Retefuente 2.5%</td><td className="py-0.5 text-right tabular-nums">-{money(f.retefuente)}</td></tr>}
            <tr className="border-t-2 border-slate-800 text-sm font-bold"><td className="py-1">TOTAL A PAGAR</td><td className="py-1 text-right tabular-nums">{money(f.total)}</td></tr>
          </tbody>
        </table>
      </div>

      <div className="mt-6 border-t border-slate-200 pt-3 text-[9px] text-slate-500">
        <p className="font-semibold">CUFE</p>
        <p className="break-all font-mono">{f.cufe}</p>
        <p className="mt-2">Resolución de facturación DIAN No. 18764012345678 del {fmtDate('2026-01-15')} · Rango FE-1 a FE-50000 · Vigencia 24 meses.</p>
        <p>Representación gráfica de la factura electrónica. Consulte su validez en catalogo-vpfe.dian.gov.co</p>
      </div>
      <div className="absolute bottom-6 right-8 h-16 w-16 rounded bg-[repeating-linear-gradient(0deg,#1e293b_0_2px,transparent_2px_4px),repeating-linear-gradient(90deg,#1e293b_0_2px,transparent_2px_4px)] opacity-70" title="QR DIAN" />
    </div>
  )
}
