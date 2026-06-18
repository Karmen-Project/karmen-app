# Karmen Frontend

Aplicación web React para gestión inteligente de facturas con OCR.

## Stack
- React 19
- Vite 8
- React Router DOM v7
- Recharts (gráficos)

## Requisitos
- Node.js 18+
- npm 9+

## Instalación
```bash
npm install
```

## Desarrollo
```bash
npm run dev
```

App disponible en http://localhost:5173

## Build para producción
```bash
npm run build
```

## Estructura
```
src/
├── api/          # Módulos de API (auth, invoices, providers, reports)
├── components/   # Componentes reutilizables (Sidebar, Button, Modal, etc.)
├── constants/    # Constantes (STATUS, ROLES, INVOICE_TYPES)
├── hooks/        # Custom hooks (useAuth, useInvoices)
├── pages/        # Páginas (Auth, Dashboard, Facturas, Contabilidad, etc.)
└── utils/theme/  # Design tokens y tema
```

## Páginas
| Ruta | Página | Descripción |
|------|--------|-------------|
| `/` | Auth | Login y registro |
| `/dashboard` | Dashboard | KPIs, gráficos, facturas recientes |
| `/facturas` | Facturas | Listado con filtros y detalle |
| `/cargar-factura` | CargarFactura | Drag & drop, preview OCR |
| `/contabilidad` | Contabilidad | Asientos Debe/Haber |
| `/reportes` | Reportes | Gráficos financieros |

## Conexión con Backend
El frontend se conecta a `http://localhost:8080/api`. Asegúrate de que el backend esté corriendo antes de usar la aplicación.
