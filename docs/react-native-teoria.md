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