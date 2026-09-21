import { Scissors, Mail, FileCheck2, Upload } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button, inputClass } from '@/components/ui'
import { useStore } from '@/store/useStore'

export default function Login() {
  const login = useStore((s) => s.login)
  const navigate = useNavigate()
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/'
  const enter = () => {
    login()
    navigate(from)
  }
  return (
    <div className="grid h-full lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-brand-700 p-12 text-white lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
            <Scissors className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold">Todocosturas · Facturas</span>
        </div>
        <div>
          <h2 className="text-3xl font-semibold leading-tight">
            Las facturas de tus proveedores,
            <br />
            del correo a Siigo sin retipear.
          </h2>
          <ul className="mt-8 space-y-4 text-brand-100">
            <li className="flex gap-3"><Mail className="mt-0.5 h-5 w-5 shrink-0" /> Lee los buzones de compras y facturación automáticamente.</li>
            <li className="flex gap-3"><FileCheck2 className="mt-0.5 h-5 w-5 shrink-0" /> Extrae los datos del XML DIAN o del PDF con IA y los deja listos para revisar.</li>
            <li className="flex gap-3"><Upload className="mt-0.5 h-5 w-5 shrink-0" /> Sube a Siigo con un clic, con el tercero y la cuenta contable ya mapeados.</li>
          </ul>
        </div>
        <p className="text-xs text-brand-200">Prototipo de demostración · datos ficticios</p>
      </div>
      <div className="flex items-center justify-center p-8">
        <form
          className="w-full max-w-sm space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            enter()
          }}
        >
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Iniciar sesión</h1>
            <p className="mt-1 text-sm text-slate-500">Accedé con tu cuenta de Todocosturas.</p>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Correo</label>
            <input className={inputClass} defaultValue="ana.gomez@todocosturas.com" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Contraseña</label>
            <input className={inputClass} type="password" defaultValue="••••••••••" />
          </div>
          <Button variant="primary" className="w-full justify-center" type="submit">
            Entrar
          </Button>
          <p className="text-center text-xs text-slate-400">Demo: cualquier credencial funciona.</p>
        </form>
      </div>
    </div>
  )
}
