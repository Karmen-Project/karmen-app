# Karmen Mobile — Aplicación Flutter

> **Plataforma de gestión contable inteligente para dispositivos móviles**

Aplicación móvil nativa multiplataforma (Android e iOS) para Karmen, desarrollada con **Flutter**. Permite a usuarios gestionar facturas, procesarlas con OCR, contabilizarlas y visualizar reportes financieros desde cualquier dispositivo.

---

## ¿Qué es Karmen Mobile?

Karmen Mobile es una aplicación complementaria al sistema web de Karmen. Ofrece:

- **Autenticación segura** con JWT y almacenamiento seguro en dispositivos
- **Carga y procesamiento de facturas** con OCR desde cámara o galería
- **Gestión de facturas** con filtros por tipo (Ingreso/Egreso)
- **Contabilización automática** de facturas con generación de asientos
- **Dashboard de reportes** con KPIs, gráficos y balances en tiempo real
- **Tema oscuro exclusivo** para mejor experiencia en baja luminosidad
- **Notificaciones push** con Firebase Cloud Messaging

---

## Características principales

| Módulo             | Descripción                                                              |
| ------------------ | ------------------------------------------------------------------------ |
| **Autenticación**  | Login con credenciales, biometría (iOS/Android), JWT con auto-expiración |
| **Dashboard**      | KPIs en vivo, gráficos de ingresos/egresos, resumen de facturas          |
| **Facturas**       | Listado paginado, filtros por tipo, búsqueda, detalles de factura        |
| **Cargar Factura** | Captura de cámara o selección de galería, OCR automático (180s timeout)  |
| **Contabilizar**   | Acción contextual, generación automática de asientos (120s timeout)      |
| **Reportes**       | Gráficos en tiempo real, balance neto, indicadores financieros           |

---

## Stack Tecnológico

| Capa                 | Tecnología                                        |
| -------------------- | ------------------------------------------------- |
| **Framework**        | Flutter 3.3+                                      |
| **Lenguaje**         | Dart 3.3+                                         |
| **State Management** | Flutter Bloc 8.1.6 + Riverpod 2.5.1               |
| **Arquitectura**     | Clean Architecture (Domain + Data + Presentation) |
| **Networking**       | Dio 5.4.3                                         |
| **Storage Seguro**   | flutter_secure_storage 9.2.2                      |
| **Rutas**            | GoRouter 14.2.0                                   |
| **Firebase**         | firebase_core 3.3.0 + firebase_messaging 15.1.0   |
| **Gráficos**         | fl_chart 0.68.0                                   |
| **Tipografía**       | Google Fonts (Inter)                              |

---

## Inicio rápido

### 1. Clonar el repositorio

```bash
git clone https://github.com/xiomaragiraldo/karmen.git
cd karmen/karmen-app/karmen-mobile
```

### 2. Instalar dependencias

```bash
flutter pub get
```

### 3. Configurar variables de entorno

Crear archivo `.env`:

```env
API_BASE_URL=
APP_NAME=Karmen
```

### 4. Ejecutar

```bash
flutter run -d android       # Android
flutter run -d ios          # iOS
flutter run -d chrome       # Web
```

---

## Arquitectura

Clean Architecture con 3 capas:

- **Domain**: Entidades, repositorios abstractos, casos de uso
- **Data**: Datasources, modelos, implementación de repositorios
- **Presentation**: Bloc, páginas, widgets

Cada feature (auth, facturas, reportes) sigue este patrón.

---

## Timeouts configurados

- **Peticiones normales**: 30s
- **OCR (upload)**: 180s
- **Contabilización**: 120s

---

## Endpoints principales

| Endpoint                      | Timeout |
| ----------------------------- | ------- |
| `/auth/login`                 | 30s     |
| `/invoices`                   | 30s     |
| `/invoices/upload`            | 180s    |
| `/invoices/{id}/contabilizar` | 120s    |

---

## Compilación

### Android (Release)

```bash
flutter build apk --release
flutter build appbundle --release
```

### iOS (Release)

```bash
flutter build ios --release
```

### Web (Release)

```bash
flutter build web --release
```

---

## Troubleshooting

**"The request took longer than..."**

- Solución: Hot-restart (R en terminal), no hot-reload

**Errores de Pods (iOS)**

```bash
cd ios && rm -rf Pods Podfile.lock && pod install && cd ..
```

_Karmen Mobile v1.0.0 — 2026_
