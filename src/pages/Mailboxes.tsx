import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Mail, Plus, RefreshCw, ShieldCheck } from 'lucide-react'
import { Button, Card, CardHeader, Modal, PageHeader, inputClass } from '@/components/ui'
import { useStore } from '@/store/useStore'
import type { Mailbox } from '@/data/types'
import { cn, fmtDateTime, relTime } from '@/lib/utils'

export const GoogleLogo = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.27-4.74 3.27-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
)
export const MicrosoftLogo = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5">
    <rect x="2" y="2" width="9.5" height="9.5" fill="#F25022" />
    <rect x="12.5" y="2" width="9.5" height="9.5" fill="#7FBA00" />
    <rect x="2" y="12.5" width="9.5" height="9.5" fill="#00A4EF" />
    <rect x="12.5" y="12.5" width="9.5" height="9.5" fill="#FFB900" />
  </svg>
)

export function MailboxCard({ mailbox, compact }: { mailbox: Mailbox; compact?: boolean }) {
  const sync = useStore((s) => s.syncMailbox)
  const newCount = useStore((s) => s.invoices.filter((i) => i.mailboxId === mailbox.id && i.status === 'nueva').length)
  const syncing = mailbox.status === 'sincronizando'
  return (
    <Card className={cn('p-4', syncing && 'ring-brand-300')}>
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 ring-1 ring-slate-200">
          {mailbox.provider === 'google' ? <GoogleLogo /> : <MicrosoftLogo />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-900">{mailbox.email}</p>
          <p className="text-xs text-slate-500">{mailbox.provider === 'google' ? 'Google Workspace' : 'Microsoft 365'}</p>
        </div>
        <span className={cn('flex items-center gap-1.5 text-xs font-medium', syncing ? 'text-brand-600' : 'text-emerald-600')}>
          {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <span className="h-2 w-2 rounded-full bg-emerald-500" />}
          {syncing ? 'Sincronizando…' : 'Conectado'}
        </span>
      </div>

      {syncing && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-1/3 animate-[sync_1.2s_ease-in-out_infinite] rounded-full bg-brand-500" />
        </div>
      )}

      <dl className={cn('mt-3 grid gap-3 text-xs', compact ? 'grid-cols-3' : 'grid-cols-4')}>
        <div>
          <dt className="text-slate-400">Última lectura</dt>
          <dd className="mt-0.5 font-medium text-slate-700" title={fmtDateTime(mailbox.lastSync)}>{relTime(mailbox.lastSync)}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Correos leídos</dt>
          <dd className="mt-0.5 font-medium tabular-nums text-slate-700">{mailbox.emailsRead.toLocaleString('es-CO')}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Facturas detectadas</dt>
          <dd className="mt-0.5 font-medium tabular-nums text-slate-700">{mailbox.invoicesFound.toLocaleString('es-CO')}</dd>
        </div>
        {!compact && (
          <div>
            <dt className="text-slate-400">Pendientes</dt>
            <dd className="mt-0.5 font-medium tabular-nums text-brand-700">{newCount}</dd>
          </div>
        )}
      </dl>

      <div className="mt-4 flex items-center gap-2">
        <Button size="sm" variant={compact ? 'secondary' : 'primary'} loading={syncing} icon={<RefreshCw className="h-3.5 w-3.5" />} onClick={() => sync(mailbox.id)}>
          Sincronizar ahora
        </Button>
        {!compact && (
          <Link to={`/facturas?buzon=${mailbox.id}`} className="text-xs font-medium text-brand-600 hover:underline">
            Ver facturas de este buzón
          </Link>
        )}
      </div>
    </Card>
  )
}

export default function Mailboxes() {
  const mailboxes = useStore((s) => s.mailboxes)
  const toast = useStore((s) => s.toast)
  const [open, setOpen] = useState(false)

  return (
    <>
      <PageHeader
        title="Buzones conectados"
        subtitle="El sistema lee estos correos cada 5 minutos y detecta adjuntos de facturas (ZIP/XML DIAN, PDF)."
        actions={
          <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>
            Conectar buzón
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {mailboxes.map((m) => (
          <MailboxCard key={m.id} mailbox={m} />
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader title="Cómo se procesan los correos" subtitle="Reglas de detección activas" />
        <div className="grid gap-px bg-slate-100 sm:grid-cols-3">
          {[
            ['1. Lectura', 'Se revisan correos nuevos (no leídos o desde la última sincronización). Solo lectura: nunca se mueven ni borran.'],
            ['2. Detección', 'Adjuntos .zip/.xml con estructura UBL DIAN se parsean directo. PDFs sin XML pasan por OCR + IA con nivel de confianza por campo.'],
            ['3. Clasificación', 'El remitente se cruza con las reglas de proveedores para asignar NIT, cuenta contable y centro de costo automáticamente.'],
          ].map(([t, d]) => (
            <div key={t} className="bg-white p-5">
              <p className="text-sm font-semibold text-slate-900">{t}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{d}</p>
            </div>
          ))}
        </div>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Conectar un buzón"
        footer={
          <>
            <Button onClick={() => setOpen(false)}>Cancelar</Button>
            <Button
              variant="primary"
              onClick={() => {
                setOpen(false)
                toast({ kind: 'info', title: 'Autorización pendiente', description: 'En producción se abriría la ventana de consentimiento OAuth del proveedor.' })
              }}
            >
              Continuar
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">Elige el proveedor. Solo pedimos permiso de <strong>lectura</strong> de correo; no podemos enviar, mover ni borrar mensajes.</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-left hover:border-brand-400 hover:bg-brand-50">
            <GoogleLogo />
            <span className="text-sm font-medium">Google Workspace</span>
          </button>
          <button className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-left hover:border-brand-400 hover:bg-brand-50">
            <MicrosoftLogo />
            <span className="text-sm font-medium">Microsoft 365</span>
          </button>
        </div>
        <div className="mt-4 space-y-1">
          <label className="text-xs font-medium text-slate-600">Correo a conectar</label>
          <input className={inputClass} placeholder="contabilidad@todocosturas.com" />
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Acceso revocable en cualquier momento desde la cuenta del proveedor.
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
          <Mail className="h-3.5 w-3.5 text-slate-400" /> También se puede usar una dirección dedicada (facturas@…) reenviando desde el buzón actual.
        </p>
      </Modal>
    </>
  )
}
