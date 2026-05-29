<h1 align="center">NoteFlow</h1>

<p align="center">
  Aplicación multiplataforma de notas con soporte para tres tipos de contenido, organización por carpetas, sincronización de múltiples cuentas y un backend cloud completamente gestionado.
  <br />
  Construida con <strong>React Native · Expo · Next.js · PostgreSQL · Firebase</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo-000020?style=flat-square&logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=flat-square&logo=firebase&logoColor=black" alt="Firebase" />
  <img src="https://img.shields.io/badge/Zustand-443E38?style=flat-square&logo=react&logoColor=white" alt="Zustand" />
</p>

---

## Visión General

NoteFlow es una aplicación móvil de nivel profesional diseñada para capturar, organizar y recuperar tres tipos distintos de contenido — **notas**, **checklists** e **ideas** — todo con una interfaz limpia y minimalista y una experiencia nativa fluida en iOS y Android.

El proyecto está dividido en dos unidades desplegables independientes:

| Paquete | Ubicación | Rol |
|---------|-----------|-----|
| **noteflow** | `noteflow/` | App móvil Expo / React Native |
| **noteflow-api** | `noteflow-api/` | API REST Next.js (alojada en Vercel) |

---

## Características

### Tipos de Contenido

| Tipo | Descripción |
|------|-------------|
| **Notas** | Editor de texto enriquecido con cuerpo completo, título y etiquetas opcionales |
| **Checklists** | Listas de tareas interactivas con check/uncheck inline, niveles de prioridad por ítem (ninguna / baja / media / alta), fechas de vencimiento y resumen de progreso |
| **Ideas** | Tarjetas de captura rápida con acentos de color, organización por etiquetas y anclaje opcional |

### Organización y Descubrimiento

- **Carpetas** — Carpetas con código de color por tipo de contenido. Asigna una nota, checklist o idea a una única carpeta. Crea, renombra, elimina y elige color desde un modal tipo bottom‑sheet.
- **Búsqueda** — Búsqueda global por título y cuerpo del contenido con resultados instantáneos y botón de limpiar con un toque.
- **Archivo** — Archiva cualquier elemento. Los elementos archivados aparecen en una barra dedicada que respeta los filtros de búsqueda y muestra un contador en vivo.
- **Ordenamiento** — Por fecha de creación (más reciente / más antiguo) o alfabéticamente.
- **Actividad reciente** — El dashboard muestra los últimos 6 elementos actualizados de todos los tipos con marcas de tiempo relativas.

### Multi‑Cuenta y Sincronización

- **Autenticación Firebase** — Registro e inicio de sesión con email/contraseña y sesiones persistentes.
- **Cuentas vinculadas** — Añade hasta 5 cuentas desde el panel de ajustes. Las cuentas vinculadas se sincronizan en Firestore para que estén disponibles en todos los dispositivos.
- **Cambio fluido** — Cambia de cuenta con un solo toque. La app se reautentica, limpia el estado local y vuelve a obtener los datos del usuario activo desde la API.
- **Cierre de sesión con fallback** — Al cerrar sesión, la app cambia automáticamente a la primera cuenta restante si hay otras disponibles, en lugar de forzar la pantalla de inicio de sesión.

### Backend Cloud

- **API Next.js** alojada en Vercel con verificación de token ID de Firebase por cada petición.
- **Base de datos PostgreSQL** vía Neon — tablas para `notes`, `folders`, `checklist_items` y `tags` con claves foráneas, índices y borrados en cascada.
- **API de Carpetas** — CRUD completo limitado al usuario autenticado. Eliminar una carpeta pone a null `folder_id` en las notas asociadas.
- **Subida de imágenes** — Subidas mediante URL prefirmadas a AWS S3 para avatares de usuario y adjuntos de notas.
- **Despliegue automático** — Los commits a `main` se despliegan automáticamente en Vercel.

### UI / UX

- **Modo oscuro y claro** — Detecta el sistema con un interruptor manual en ajustes.
- **Localización** — Español e Inglés con conmutador en vivo dentro de la app (sin necesidad de reiniciar).
- **Diseño responsive** — Márgenes uniformes, espaciado consistente de 12px, optimizado para vistas en cuadrícula (2 columnas) y lista.
- **Listas de alto rendimiento** — Impulsadas por `@shopify/flash-list` para scroll a 60 fps en conjuntos de datos grandes.
- **Acciones deslizables** — Archivar, eliminar, mover a carpeta y cambiar prioridad mediante gestos swipe sobre las filas.
- **Dashboard** — Resumen de un vistazo con tarjetas de estadísticas (conteos por tipo), botones de acción rápida para crear nuevos elementos, feed de actividad reciente y barra de progreso de tareas para checklists.
- **Notificaciones Toast** — Superposición global de toast posicionada sobre el stack de navegación para retroalimentación entre pantallas (cambios de cuenta, errores, confirmaciones).
- **Recordatorios** — Recordatorios opcionales basados en fecha con un badge de aspecto nativo mostrado inline.
- **Etiquetado de ubicación** — Latitud/longitud opcional adjunta a cualquier nota.

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                   Mobile App (Expo)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │  Notes   │  │Checklists│  │  Ideas   │  │Settings │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘ │
│       └──────────────┴──────────────┴──────────────┘     │
│                         │                                │
│              ┌──────────┴──────────┐                     │
│              │   Zustand Stores    │                     │
│              │  (notes / folders / │                     │
│              │   auth / account /  │                     │
│              │   theme / locale /  │                     │
│              │   toast)            │                     │
│              └──────────┬──────────┘                     │
│                         │                                │
│              ┌──────────┴──────────┐                     │
│              │   lib/api.ts (HTTP) │                     │
│              │   (Bearer JWT via   │                     │
│              │    Firebase ID      │                     │
│              │    token)           │                     │
│              └──────────┬──────────┘                     │
└─────────────────────────┼───────────────────────────────┘
                          │ HTTPS
┌─────────────────────────┼───────────────────────────────┐
│              ┌──────────┴──────────┐                     │
│              │  Next.js API Routes │  (Vercel)           │
│              │  /api/notes         │                     │
│              │  /api/folders       │                     │
│              │  /api/checklist-    │                     │
│              │     items           │                     │
│              │  /api/upload        │                     │
│              └──────────┬──────────┘                     │
│                         │                                │
│              ┌──────────┴──────────┐                     │
│              │  Firebase Admin     │                     │
│              │  (verifyAuth →      │                     │
│              │   verifyIdToken)    │                     │
│              └──────────┬──────────┘                     │
│                         │                                │
│              ┌──────────┴──────────┐                     │
│              │  PostgreSQL (Neon)  │                     │
│              │  tables: notes      │                     │
│              │          folders    │                     │
│              │          checklist_  │                    │
│              │          items      │                     │
│              │          tags       │                     │
│              └─────────────────────┘                     │
└───────────────────────────────────────────────────────────┘
```

### Frontend (noteflow/)

```
noteflow/
├── app/                     # Expo Router — enrutamiento basado en archivos
│   ├── _layout.tsx           # Layout raíz: tema, i18n, init auth, toast global
│   ├── (auth)/               # Pantallas de inicio de sesión y registro
│   ├── (tabs)/               # Navegador de pestañas (dashboard, notas, checklists, ideas, settings)
│   ├── nueva-nota.tsx        # Modal de creación unificado (tipo determinado por query param)
│   ├── notas/[id].tsx        # Pantalla de detalle / edición de nota
│   ├── checklists/[id].tsx   # Pantalla de detalle / edición de checklist
│   ├── ideas/[id].tsx        # Pantalla de detalle / edición de idea
│   ├── terminos.tsx          # Términos de servicio
│   ├── privacidad.tsx        # Política de privacidad
│   └── feedback.tsx          # Formulario de feedback
├── components/
│   ├── ScreenHeader.tsx      # Cabecera reutilizable con icono + título de sección
│   ├── SwipeableRow.tsx      # Acciones swipe basadas en gestos
│   ├── FolderBar.tsx         # Chips de carpetas con scroll horizontal
│   ├── FolderModal.tsx       # Bottom sheet para crear / editar / eliminar carpetas
│   ├── FolderPickerModal.tsx # Selector de carpetas para acción mover a carpeta
│   ├── GlassWrapper.tsx      # Wrapper de desenfoque (efecto iOS)
│   ├── ImageViewer.tsx       # Modal de imagen a pantalla completa
│   └── items/                # NoteCard, ChecklistCard, IdeaCard
├── store/                    # Stores de Zustand
│   ├── notesStore.ts         # CRUD de notas + prioridades (conecta a API)
│   ├── folderStore.ts        # CRUD de carpetas por tipo
│   ├── authStore.ts          # Auth Firebase + perfil Firestore
│   ├── accountStore.ts       # Gestión multi‑cuenta + cuentas vinculadas
│   ├── themeStore.ts         # Modo oscuro / claro
│   ├── localeStore.ts        # Preferencia de idioma
│   └── toastStore.ts         # Estado global del toast
├── lib/
│   ├── api.ts                # Cliente HTTP para todos los endpoints de la API
│   ├── firebase.ts           # Inicialización de Firebase (Expo Go + nativo, doble ruta)
│   ├── env.ts                # Claves de API (gitignored)
│   ├── notifications.ts      # Configuración de expo‑notifications
│   ├── location.ts           # Helpers de geolocalización
│   ├── noteContent.ts        # Utilidades de extracción de texto enriquecido
│   └── upload.ts             # Subida de imágenes a S3 mediante URL prefirmada
├── i18n/                     # Internacionalización
│   ├── es.ts                 # Traducciones al español
│   ├── en.ts                 # Traducciones al inglés
│   └── index.ts              # Router de i18n
├── types/index.ts            # Interfaces TypeScript
├── constants/theme.ts        # Paleta de colores (oscuro + claro)
└── AGENTS.md                 # Contexto para LLM (notas de desarrollo)
```

### Backend (noteflow-api/)

```
noteflow-api/
├── app/api/
│   ├── notes/
│   │   ├── route.ts          # GET (listar), POST (crear con tags + items)
│   │   └── [id]/route.ts     # GET, PATCH, DELETE (nota individual)
│   ├── folders/
│   │   ├── route.ts          # GET (por tipo), POST (crear)
│   │   └── [id]/route.ts     # PATCH, DELETE (limitado al usuario)
│   ├── checklist-items/route.ts  # CRUD para ítems individuales de checklist
│   └── upload/route.ts           # Generar URL prefirmada de subida a S3
├── lib/
│   ├── auth.ts               # Verificación de token ID de Firebase
│   ├── notes.ts              # Consultas SQL para notas + relaciones
│   └── db.ts                 # Cliente de base de datos Neon serverless
├── sql/
│   ├── schema.sql            # Definiciones completas de tablas
│   ├── migration_001_add_user_id.sql
│   ├── migration_002_add_folders.sql
│   └── queries.sql           # Referencia útil
└── next.config.ts
```

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Framework móvil** | React Native 0.81 + Expo SDK 54 |
| **Lenguaje** | TypeScript 5.9 |
| **Navegación** | Expo Router 6 (basado en archivos) |
| **Estado global** | Zustand 5 |
| **UI primitives** | Gluestack UI, react‑native‑reanimated |
| **Listas** | Shopify FlashList 2 |
| **Gestos** | react‑native‑gesture‑handler |
| **Cliente API** | `fetch` nativo + tokens ID de Firebase |
| **Backend runtime** | Next.js 16 |
| **Base de datos** | PostgreSQL (Neon serverless) |
| **Auth (mobile)** | Firebase Auth + Firestore |
| **Auth (API)** | Firebase Admin SDK (verificación de token ID) |
| **Almacenamiento** | AWS S3 (URLs prefirmadas) |
| **Validación** | Zod 4 |
| **i18n** | Conmutador de idioma en tiempo de ejecución personalizado |
| **Selector de imágenes** | expo‑image‑picker |
| **Notificaciones** | expo‑notifications |
| **CI/CD** | Vercel (despliegue automático al hacer push a `main`) |

---

## Primeros Pasos

### Prerrequisitos

- Node.js ≥ 18
- Expo CLI: `npm install -g expo-cli`
- Un [proyecto de Firebase](https://console.firebase.google.com) con **Authentication** (Email/Password) y **Firestore** habilitados
- Una base de datos PostgreSQL en [Neon](https://neon.tech)
- (Opcional) Un bucket de AWS S3 para subida de imágenes

### 1. Clonar el repositorio

```bash
git clone https://github.com/DavidCorredera/noteflow-project.git
cd noteflow-project
```

### 2. Configurar secretos

Crea `noteflow/lib/env.ts` con tu configuración de Firebase:

```typescript
export const FIREBASE_API_KEY = 'tu-api-key-de-firebase';
```

Crea `noteflow-api/.env.local` con tu cadena de conexión de Neon y credenciales de Firebase Admin:

```env
DATABASE_URL=postgresql://...
FIREBASE_PROJECT_ID=noteflow-xxxxx
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@noteflow-xxxxx.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="<tu-clave-privada-de-firebase-admin>"
```

Coloca `GoogleService-Info.plist` y `google-services.json` en `noteflow/` para compilaciones nativas de iOS / Android (opcional — la app también funciona con Expo Go usando el SDK JS de Firebase).

### 3. Aplicar migraciones de base de datos

```bash
cd noteflow-api
psql $DATABASE_URL -f sql/schema.sql
psql $DATABASE_URL -f sql/migration_001_add_user_id.sql
psql $DATABASE_URL -f sql/migration_002_add_folders.sql
```

### 4. Instalar dependencias e iniciar

**App móvil:**
```bash
cd noteflow
npm install --legacy-peer-deps
npx expo start -c
```

**Backend (desarrollo local):**
```bash
cd noteflow-api
npm install
npm run dev
```

---

## Endpoints de la API

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/notes` | Listar todas las notas del usuario autenticado |
| `POST` | `/api/notes` | Crear una nota (con tags, items, folderId opcionales) |
| `GET` | `/api/notes/:id` | Obtener una nota por ID |
| `PATCH` | `/api/notes/:id` | Actualizar campos de la nota (title, content, archived, folderId, etc.) |
| `DELETE` | `/api/notes/:id` | Eliminar una nota y sus tags / items relacionados |
| `GET` | `/api/folders?type=note\|checklist\|idea` | Listar carpetas por tipo |
| `POST` | `/api/folders` | Crear una carpeta (name, color, type) |
| `PATCH` | `/api/folders/:id` | Actualizar carpeta (name, color) |
| `DELETE` | `/api/folders/:id` | Eliminar carpeta (pone a null folder_id en las notas) |
| `POST` | `/api/checklist-items` | Añadir un ítem a un checklist |
| `PATCH` | `/api/checklist-items/:id` | Actualizar ítem (text, isCompleted, priority, dueDate) |
| `DELETE` | `/api/checklist-items/:id` | Eliminar un ítem de checklist |
| `POST` | `/api/upload` | Obtener una URL prefirmada de subida a S3 |

Todos los endpoints requieren el header `Authorization: Bearer <Firebase ID token>`.

---

## Notas de Desarrollo

- **Expo Go vs compilaciones nativas**: La app usa una inicialización de Firebase de doble ruta — prefiere `@react-native-firebase` para compilaciones nativas y cae al SDK JS de Firebase cuando se ejecuta en Expo Go. Módulos sensibles como `expo‑notifications` usan require dinámico con `try/catch` para evitar crasheos en Expo Go.
- **El repositorio es público**: Los secretos (`lib/env.ts`, `GoogleService-Info.plist`, `google-services.json`, `service-account.json`) están en gitignore. La URL de la API por defecto apunta al despliegue de producción en Vercel y puede sobreescribirse mediante `EXPO_PUBLIC_API_URL`.
- **Las migraciones de base de datos son manuales**: Ejecútalas contra tu instancia de Neon antes de usar las funciones de carpetas o aislamiento por usuario.

---

## Licencia

MIT
