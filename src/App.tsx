import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import { useStore } from '@/store/useStore'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Invoices from '@/pages/Invoices'
import InvoiceDetail from '@/pages/InvoiceDetail'
import Mailboxes from '@/pages/Mailboxes'
import Suppliers from '@/pages/Suppliers'
import Integrations from '@/pages/Integrations'
import Audit from '@/pages/Audit'
import Reports from '@/pages/Reports'

function Protected({ children }: { children: React.ReactNode }) {
  const loggedIn = useStore((s) => s.loggedIn)
  const location = useLocation()
  return loggedIn ? children : <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <Protected>
              <AppShell />
            </Protected>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="facturas" element={<Invoices />} />
          <Route path="facturas/:id" element={<InvoiceDetail />} />
          <Route path="buzones" element={<Mailboxes />} />
          <Route path="integraciones" element={<Integrations />} />
          <Route path="proveedores" element={<Suppliers />} />
          <Route path="auditoria" element={<Audit />} />
          <Route path="reportes" element={<Reports />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
