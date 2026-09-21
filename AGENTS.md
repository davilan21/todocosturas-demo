# Todocosturas · Facturas — prototipo frontend

Demo de venta, **solo frontend**, sin backend ni persistencia. Muestra un
sistema que lee facturas de proveedores desde buzones de correo, las presenta
para revisión/corrección y las envía a Siigo. Todo es ficticio.

## Stack

Vite 8 · React 19 · TypeScript strict · Tailwind v4 · Zustand · react-router
(`HashRouter`) · Recharts · lucide-react. Sin tests unitarios: el gate es
`npm run build` (tsc + vite), que corre en el hook `pre-push`.

## Comandos

```bash
npm run dev      # http://localhost:5173/todocosturas-demo/
npm run build    # tsc -b && vite build
npm run preview
```

Hooks: `git config core.hooksPath .githooks` (una vez por clon).

## Estructura

- `src/data/types.ts` — dominio (Invoice, Supplier, Mailbox, AuditEvent, Rule).
- `src/data/seed.ts` — datos semilla deterministas (PRNG con seed fija) y
  `makeIncomingInvoices()` para la sincronización simulada.
- `src/store/useStore.ts` — todo el estado y las acciones de la demo.
- `src/pages/*` — una página por ruta. `src/components/invoice/*` — factura
  renderizada y modal de Siigo.

## Gotchas

- **Selectores de Zustand deben devolver referencias estables.** Un
  `useStore((s) => s.invoices.filter(...))` produce loop infinito. Seleccioná
  el array y filtrá afuera.
- `base: '/todocosturas-demo/'` en `vite.config.ts` es el nombre del repo. Si el
  repo se renombra, hay que cambiarlo o Pages sirve assets rotos.
- `NOW` en `seed.ts` está fijo al 2026-09-21 para que los datos sean
  reproducibles; los tiempos relativos usan `max(NOW, Date.now())`.
- El login es decorativo y vive en `sessionStorage` para que los deep links
  compartidos funcionen.
- `sup-9` (Colortex) tiene `siigoExists: false` a propósito: es el proveedor
  que falla al enviar, para demostrar el manejo de error.

## Despliegue

GitHub Actions → GitHub Pages en cada push a `main`
(`.github/workflows/deploy.yml`). URL: https://davilan21.github.io/todocosturas-demo/
