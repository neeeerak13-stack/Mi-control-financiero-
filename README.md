# Mi Control Financiero

Proyecto preparado a partir del ZIP que compartiste. **La interfaz original se conserva**: no se rediseñaron colores, tipografías, disposición, pestañas, textos, iconos ni el personaje Nilo. Solo se añadieron archivos técnicos para instalación web/offline y compilación Android.

## Qué contiene esta versión

- `www/index.html`: interfaz y lógica de la aplicación original.
- `www/manifest.webmanifest` y `www/service-worker.js`: instalación como PWA y caché básica para abrir la app sin conexión después de la primera carga.
- `capacitor.config.json`: configuración de Capacitor para Android.
- `.github/workflows/build-android.yml`: compila automáticamente un APK de prueba en GitHub Actions.
- `scripts/apply-android-icons.py`: aplica a Android el icono de Nilo derivado del SVG de la interfaz.
- `tests/smoke.mjs`: comprobaciones estáticas y pruebas de cálculos financieros básicos.

## Funciones que ya vienen en el HTML

Perfiles locales, ingresos, gastos, ahorros, bolsillos de efectivo/Nequi/Nu, categorías, presupuesto mensual y por categoría, estimación de ingresos, análisis, reportes, deudas, metas de ahorro, gastos recurrentes, Nilo, exportación CSV y respaldo/restauración JSON.

## Subir a GitHub y descargar el APK

1. Descomprime este ZIP.
2. Crea un repositorio nuevo en GitHub.
3. Sube **todo el contenido de esta carpeta** (no solo `index.html`) a la rama `main`.
4. Abre la pestaña **Actions** del repositorio.
5. Selecciona **Build Android APK** y pulsa **Run workflow**; también se ejecuta automáticamente al subir cambios a `main`.
6. Cuando termine en verde, abre la ejecución y descarga el artefacto `mi-control-financiero-debug-apk`.
7. Descomprime el artefacto y encontrarás `app-debug.apk`. Instálalo en Android habilitando la instalación desde esa fuente.

El APK generado por este flujo es de **depuración (debug)**, instalable para pruebas. No es un APK firmado para publicación en Play Store. Para distribución pública se debe configurar una firma de release con secretos de GitHub.

## Requisitos para compilar localmente

- Node.js 22
- Java 21
- Android SDK / Android Studio

Comandos:

```bash
npm install
npx cap add android
npx cap sync android
python scripts/apply-android-icons.py
npm test
cd android
./gradlew assembleDebug
```

## Datos y privacidad

La versión recibida guarda los datos en el almacenamiento local del navegador/dispositivo (`localStorage`). La exportación de respaldo JSON es importante para conservar o trasladar esos datos. La caché offline no sincroniza datos entre dispositivos.

## Integraciones bancarias y nube

El ZIP recibido no contiene cliente Supabase, autenticación, llamadas `fetch`, ni flujo de conexión Belvo. En el trabajo anterior existía una configuración de Supabase con funciones Edge de Belvo; el proyecto asociado estaba pausado y se solicitó su restauración. El estado de esas funciones y el esquema debe verificarse una vez que el proyecto termine de iniciar.

No se han puesto claves privadas ni `service_role` dentro del frontend. La conexión real de bancos/sincronización no se declara terminada en esta entrega: requiere verificar el backend activo y acordar cómo autenticar al usuario sin cambiar la pantalla inicial aprobada.

## Alcance de las pruebas

Se comprueba la sintaxis del JavaScript, que los selectores estáticos apunten a elementos existentes, que los handlers declarados tengan funciones y varios cálculos financieros básicos. No equivale a una prueba manual completa en un teléfono, ni a una prueba de conexión bancaria real.
