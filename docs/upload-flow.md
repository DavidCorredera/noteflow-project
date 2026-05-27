# Image Upload Flow

## Diagrama de flujo: Subir foto desde la app hasta AWS S3

```mermaid
sequenceDiagram
    actor User
    participant App as NoteFlow (React Native)
    participant ImagePicker as expo-image-picker
    participant API as Backend (Next.js / Vercel)
    participant S3 as AWS S3
    participant Firestore as Firestore / PostgreSQL

    User->>App: Toca "Añadir imagen"
    App->>ImagePicker: requestMediaLibraryPermissionsAsync()
    ImagePicker-->>App: Permiso concedido
    User->>ImagePicker: Selecciona foto de galería
    ImagePicker-->>App: asset.uri (ruta local)
    App->>API: POST /api/upload { fileName, contentType }
    API->>S3: getSignedUrl (PutObjectCommand)
    S3-->>API: signedUrl (expira en 1h)
    API-->>App: { signedUrl, publicUrl }
    App->>S3: PUT signedUrl (body: blob)
    S3-->>App: 200 OK
    App->>App: Reemplaza uri local por publicUrl en NoteImage
    User->>App: Guarda la nota
    App->>API: PATCH /notes/:id { content: JSON con publicUrl }
    API->>PostgreSQL: UPDATE notes SET content = ...
    API-->>App: Nota guardada
```

## Flujo alternativo: Cámara

```mermaid
sequenceDiagram
    actor User
    participant App as NoteFlow (React Native)
    participant Camera as expo-image-picker (cámara)
    participant API as Backend (Next.js / Vercel)
    participant S3 as AWS S3

    User->>App: Toca "Cámara"
    App->>Camera: requestCameraPermissionsAsync()
    Camera-->>App: Permiso concedido
    User->>Camera: Toma foto
    Camera-->>App: asset.uri (ruta local)
    App->>API: POST /api/upload { fileName, contentType }
    API-->>App: { signedUrl, publicUrl }
    App->>S3: PUT signedUrl (body: blob)
    S3-->>App: 200 OK
    App->>App: Muestra imagen desde publicUrl
```

## Estructura de archivos involucrados

### App (React Native / Expo)
| Archivo | Función |
|---------|---------|
| `components/notes/NoteComposer.tsx` | UI de edición de notas, botón de imagen, integración con ImagePicker |
| `lib/upload.ts` | Servicio que pide presigned URL + sube el blob a S3 |
| `store/authStore.ts` | Manejo de sesión Firebase Auth + perfil en Firestore |
| `app/(auth)/login.tsx` | Pantalla de inicio de sesión |
| `app/(auth)/register.tsx` | Pantalla de registro |
| `app/_layout.tsx` | Listener de auth state, protección de rutas |

### Backend (Next.js)
| Archivo | Función |
|---------|---------|
| `app/api/upload/route.ts` | Endpoint POST que genera presigned URL firmada con AWS SDK |
| `lib/db.ts` | Conexión a PostgreSQL via Neon |
| `lib/notes.ts` | Operaciones CRUD de notas |

## Configuración necesaria

### Firebase
- Autenticación: Email/Password habilitado
- Firestore: Colección `users` con documentos por `uid`
- Archivos: `google-services.json` (Android) y `GoogleService-Info.plist` (iOS) en la raíz

### AWS S3
- Bucket: `noteflow-uploads-davidcorredera` (región `eu-north-1`)
- Permisos: Lectura pública para objetos
- IAM User: `noteflow-uploads` con política `AmazonS3FullAccess`

### Variables de entorno (Backend - Vercel)
| Variable | Valor |
|----------|-------|
| `AWS_ACCESS_KEY_ID` | Access Key del IAM user |
| `AWS_SECRET_ACCESS_KEY` | Secret Key del IAM user |
| `AWS_REGION` | `eu-north-1` |
| `AWS_S3_BUCKET` | `noteflow-uploads-davidcorredera` |

### Plugins (app.json)
- `expo-image-picker` → permisos de cámara y galería
- `@react-native-firebase/app` → integración nativa de Firebase
- `expo-build-properties` → compileSdk 36
