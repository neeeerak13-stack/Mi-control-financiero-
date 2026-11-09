# Mi Control Financiero

Aplicación local de finanzas personales. Esta entrega integra la interfaz oficial suministrada (`index.html`) con la lógica de la versión anterior del ZIP, sin recuperar la interfaz antigua.

## Ejecutar en un navegador

1. Instala Node.js 22 si todavía no lo tienes.
2. Abre una terminal en la carpeta del proyecto.
3. Para ejecutar las pruebas: `npm test`.
4. Para abrir la aplicación, sirve la carpeta `www` desde `localhost` (por ejemplo, `python -m http.server 8000` dentro de `www`) y visita `http://localhost:8000`.

El modo instalable/offline (PWA) requiere `localhost` o un sitio HTTPS. La primera carga necesita conexión para descargar las tipografías de Google Fonts; si no están disponibles, se usan las fuentes alternativas del CSS.

## Estructura

- `www/index.html`: interfaz oficial y lógica de la aplicación.
- `www/manifest.webmanifest`: metadatos de instalación PWA.
- `www/service-worker.js`: caché de la interfaz para uso offline después de la primera carga.
- `www/assets/`: iconos de la aplicación.
- `tests/smoke.mjs`: sintaxis, referencias DOM, handlers, pestañas y huella del CSS oficial.
- `tests/functional-regression.mjs`: pruebas de lógica financiera, perfiles, CSV y respaldo/restauración.
- `docs/`: inventario, auditoría de seguridad, limitaciones e informe de pruebas.
- `capacitor.config.json` y `.github/workflows/build-android.yml`: configuración y flujo de compilación Android.

## Android

El ZIP incluye configuración Capacitor y un workflow de GitHub Actions que crea el proyecto Android, sincroniza `www` y compila un APK `debug`. El directorio nativo `android/` no viene incluido: lo genera el workflow o el comando `npx cap add android`.

Requisitos para compilar localmente:
- Node.js 22.
- Java 21.
- Android SDK / Android Studio.

Comandos habituales:

```bash
npm install
npx cap add android
npx cap sync android
python scripts/apply-android-icons.py
npm test
cd android
./gradlew assembleDebug
```

El APK debug es para pruebas, no está firmado para publicación en Play Store. Esta entrega no incluye un APK compilado ni una firma de release.

## Datos, privacidad y límites

- Los datos se guardan en `localStorage` del navegador/dispositivo. **No están cifrados por la aplicación.**
- Los perfiles separan los datos mediante claves distintas de `localStorage`, pero no son cuentas autenticadas ni una barrera de seguridad frente a alguien con acceso al mismo navegador o dispositivo.
- No hay sincronización en la nube, base de datos remota, autenticación externa ni conexión bancaria/Belvo en los archivos de esta entrega.
- Nilo funciona con reglas locales y datos registrados; no es un servicio de IA conectado a internet.
- Los gastos recurrentes son recordatorios: no se registran ni descuentan automáticamente.
- Exporta respaldos JSON con regularidad y guárdalos en un lugar privado. El archivo de respaldo contiene información financiera legible y no está cifrado.
- No compartas el dispositivo desbloqueado ni los archivos de respaldo con otras personas.

## Auditoría y pruebas

Consulta `docs/AUDITORIA_SEGURIDAD.md`, `docs/MATRIZ_FUNCIONAL.md` y `docs/RESULTADOS_PRUEBAS.md`. Las pruebas automatizadas de Node se ejecutan con `npm test`. No equivalen a una validación manual completa en Android ni a una certificación de seguridad o producción.
