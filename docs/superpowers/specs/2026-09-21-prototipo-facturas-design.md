# Prototipo frontend — Todocosturas · Facturas

Fecha: 2026-09-21. Estado: aprobado en chat, en implementación.

## Objetivo

Demo navegable, sin backend, para vender a Todocosturas un sistema que lee
facturas de proveedores desde buzones de correo, las presenta para revisión y
ajuste manual, y las envía a Siigo. Todo el estado vive en memoria (Zustand)
con datos semilla ficticios; se resetea al recargar.

## Stack

Vite + React 19 + TypeScript strict + Tailwind v4 + Zustand + react-router
(`HashRouter`, por GitHub Pages) + Recharts + lucide-react.
Deploy: GitHub Actions → GitHub Pages, repo público `davilan21/todocosturas-demo`.

## Dominio

- `Mailbox`: id, email, provider (`google` | `microsoft`), lastSync, emailsRead,
  invoicesFound, status.
- `Supplier`: id, nit, name, defaultAccount, costCenter, emailDomain,
  `siigoExists` (uno en `false` para forzar error de envío).
- `Invoice`: id, number, supplierId, mailboxId, source (`xml_dian` | `pdf_ocr`),
  status (`nueva` | `revisando` | `aprobada` | `enviada` | `error` | `rechazada`),
  issueDate, receivedAt, cufe, subtotal, iva, retefuente, total, items[],
  `confidence` por campo (solo `pdf_ocr`), email {from, subject, date},
  siigoVoucher?, siigoError?.
- `AuditEvent`: id, invoiceId, at, actor, action, detail.
- `Rule`: id, match (dominio/remitente), supplierId, account.

## Pantallas

1. Login decorativo → Dashboard.
2. Dashboard: KPIs, gráfico 30 días, últimas facturas, estado de buzones.
3. Buzones: 2 buzones (Google + Microsoft). "Sincronizar ahora" simula 3s y
   agrega 2–3 facturas `nueva` con toast.
4. Facturas: tabla filtrable por estado/proveedor/origen/fecha, selección
   múltiple, acciones en lote (aprobar, enviar a Siigo, descargar).
5. Detalle: split view. Izquierda factura renderizada en HTML; derecha campos
   editables con badges de confianza para `pdf_ocr`. Acciones: aprobar,
   rechazar, enviar a Siigo, descargar XML/PDF (archivo dummy). Panel con correo
   origen y línea de tiempo de auditoría.
6. Envío a Siigo (modal): mapeo tercero/cuenta/centro de costo, simula 2s,
   éxito → `enviada` + comprobante `CE-####`; proveedor sin `siigoExists` →
   `error` con mensaje y "Reintentar".
7. Proveedores y reglas: tablas editables inline.
8. Auditoría: log cronológico filtrable.
9. Reportes: facturas por mes, top proveedores, IVA/retenciones, tiempo promedio
   recepción→Siigo.

## Fuera de alcance

Login real, multiusuario, persistencia, PDFs reales, paginación server-side.

## Verificación

`npm run build` (tsc + vite) en verde; hook pre-push que lo corre; recorrido
manual de los 9 flujos en el browser antes de declarar terminado.
