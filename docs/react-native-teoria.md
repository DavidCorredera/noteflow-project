# Fundamentos de React Native

### 1. ¿Cómo funciona React Native?
A diferencia de aplicaciones híbridas antiguas (como Cordova o Ionic) que renderizan HTML en un WebView, React Native no usa HTML. Cuando escribimos un `<View>`, React Native se comunica con el sistema operativo para renderizar una vista nativa real (un `ViewGroup` en Android o un `UIView` en iOS). 

### 2. Los dos hilos (Threads)
La arquitectura se divide en dos hilos principales que se comunican a través de un "puente" (Bridge) o la nueva arquitectura (JSI):
*   **JS Thread:** Donde se ejecuta nuestro código JavaScript/React y la lógica de negocio.
*   **UI Thread:** Donde el sistema operativo renderiza la interfaz y gestiona los gestos de alto rendimiento.
**Regla de oro:** Si bloqueamos el JS Thread con cálculos pesados, la interfaz se congela.

### 3. Expo Go vs Development Build
*   **Expo Go:** Es una app precompilada (la descargamos de la App Store/Google Play). Escaneas un QR y tu código JS se inyecta en ella. Es genial para empezar rápido, pero **no soporta módulos nativos personalizados** que no vengan preinstalados.
*   **Development Build:** Es tu propia versión compilada de la app (un `.apk` o `.app` real) generada con EAS Build. En proyectos reales siempre terminamos usando esto cuando necesitamos librerías nativas específicas (como Bluetooth o bases de datos nativas complejas).
### 4. Sistemas de diseño
Para NoteFlow hemos elegido **React Native Paper** sobre Gluestack UI. 
*   **Justificación:** Paper ofrece una implementación madura de Material Design que nos permite iterar el MVP muy rápido, con componentes preconstruidos altamente accesibles y soporte nativo excelente en Android e iOS, minimizando la configuración inicial necesaria en comparación con motores de estilos basados en utilidades (como Tailwind/Gluestack).
### 5. Arquitectura de Navegación
En NoteFlow utilizamos tres paradigmas de navegación manejados por Expo Router:
*   **Pestañas (Tabs):** Se usan para la navegación principal (`/notas`, `/checklists`, `/ideas`). Permiten al usuario cambiar de contexto rápidamente sin perder el estado de la pantalla anterior.
*   **Pila (Stack):** Se usa para profundizar en el contenido. Por ejemplo, al pulsar una nota, el detalle se abre "encima" de la pantalla actual (`[id].tsx`), permitiendo volver atrás mediante un botón o gesto.
*   **Modales:** Se usan para flujos de interrupción que el usuario debe completar o cancelar. En nuestro caso, la pantalla de "Nueva Nota" (`nueva-nota.tsx`) se abrirá como un modal deslizable desde abajo.
### 6. Gestión de estado (Zustand)
Para el estado global de NoteFlow hemos elegido **Zustand** en lugar de `useState` o la `Context API` nativa de React.
*   **Context API vs Zustand:** Context API provoca re-renders innecesarios en todos los componentes que lo consumen cuando cambia cualquier parte del estado, y requiere envolver la app en Providers. Zustand resuelve esto: no necesita Providers (evita el "Provider hell"), es más rápido y nos permite seleccionar piezas específicas del estado para evitar renders.
*   **Persistencia:** Además, Zustand se integra perfectamente con `AsyncStorage` mediante su middleware `persist`, lo que nos permite guardar los datos localmente en el dispositivo de forma casi automática.
### 7. Rendimiento en listas (FlashList)
El componente `FlatList` nativo tiene problemas de rendimiento con listas largas: cuando haces scroll rápido, el hilo de JS no da abasto para crear nuevos componentes y aparecen espacios en blanco. **FlashList de Shopify** soluciona esto reciclando agresivamente las vistas (reutiliza la estructura del componente en memoria y solo cambia los datos). La propiedad clave es `estimatedItemSize`, que ayuda a precalcular la altura total y evitar saltos de scroll.