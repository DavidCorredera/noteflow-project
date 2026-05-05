# 📝 NoteFlow — Notas inteligentes

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-443E38?style=for-the-badge&logo=react&logoColor=white)

**NoteFlow** es una aplicación móvil moderna, minimalista y de alto rendimiento diseñada para capturar pensamientos, organizar tareas y almacenar ideas rápidas. Construida con **React Native** y **Expo**, la app ofrece una experiencia nativa fluida tanto en iOS como en Android.

---

## 🚀 Características Principales

* **Categorización Triple:** 
  * 📝 **Notas:** Editor de texto clásico para pensamientos largos.
  * ✅ **Checklists:** Listas de tareas interactivas con sub-tareas tachables.
  * 💡 **Ideas:** Capturas rápidas visuales con soporte para etiquetas (tags).
* **⚡ Rendimiento Extremo:** Uso del motor `@shopify/flash-list` para un scroll suave de 60fps.
* **💾 Persistencia Local:** Todo se guarda localmente en el dispositivo mediante `AsyncStorage`.
* **🏗️ Arquitectura Sólida:** Gestión de estado global con **Zustand** y validación con **Zod**.
* **🧭 Navegación Intuitiva:** Basada en **Expo Router** con sistema de pestañas y modales.
* **🎨 UI Adaptativa:** Construida con **React Native Paper**, soportando **Modo Claro y Oscuro**.

---

## 🛠️ Stack Tecnológico

* **Expo SDK 54+**: Framework base y routing.
* **TypeScript**: Tipado estático para un código robusto.
* **Zustand**: Gestión de estado ligera y optimizada.
* **React Native Paper**: Sistema de diseño (Material Design 3).
* **FlashList**: Renderizado de listas de alto rendimiento.
* **Zod**: Esquemas de validación de datos.

---

## 📦 Instalación y Uso Local

Sigue estos pasos para levantar el proyecto en tu entorno:

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/DavidCorredera/noteflow-project/noteflow.git
   cd noteflow
   ```

2. **Instalar dependencias:**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Iniciar el servidor de desarrollo:**
   ```bash
   npx expo start -c
   ```

---

## 📂 Estructura del Proyecto

```text
noteflow/
├── app/                  # Rutas y pantallas (Expo Router)
│   ├── (tabs)/           # Navegación principal
│   ├── checklists/       # Detalles dinámicos
│   ├── _layout.tsx       # Configuración y Themes
│   └── nueva-nota.tsx    # Modal de creación
├── components/           # Componentes UI reutilizables
├── store/                # Configuración de Zustand
├── types/                # Interfaces TypeScript
└── constants/            # Paleta de colores
```

---

## 🗺️ Próximos Pasos (Roadmap)

- [ ] 🔍 **Búsqueda Global:** Implementar un buscador por título o contenido.
- [ ] 📁 **Categorías:** Agrupar notas en carpetas específicas.
- [ ] ☁️ **Cloud Sync:** Sincronización en la nube usando Firebase o Supabase.

---

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

---
