import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { InvoiceSource, InvoiceStatus } from '@/data/types'

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})
export const money = (n: number) => cop.format(n)

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })

export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

export const relTime = (iso: string, now = Date.now()) => {
  const diff = Math.max(0, now - new Date(iso).getTime())
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'hace un momento'
  if (m < 60) return `hace ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.floor(h / 24)
  return `hace ${d} d`
}

export const STATUS_LABEL: Record<InvoiceStatus, string> = {
  nueva: 'Nueva',
  revisando: 'En revisión',
  aprobada: 'Aprobada',
  enviada: 'Enviada a Siigo',
  error: 'Error en Siigo',
  rechazada: 'Rechazada',
}

export const STATUS_CLASS: Record<InvoiceStatus, string> = {
  nueva: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  revisando: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  aprobada: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  enviada: 'bg-slate-100 text-slate-700 ring-slate-500/20',
  error: 'bg-red-50 text-red-700 ring-red-600/20',
  rechazada: 'bg-slate-50 text-slate-500 ring-slate-400/20 line-through',
}

export const SOURCE_LABEL: Record<InvoiceSource, string> = {
  xml_dian: 'XML DIAN',
  pdf_ocr: 'PDF · OCR',
}

/** Descarga un archivo dummy en el navegador (la demo no tiene archivos reales). */
export function downloadDummy(filename: string, content: string, mime = 'text/plain') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
