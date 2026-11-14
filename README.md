# Mi Control Financiero

Aplicación local de finanzas personales preparada para ejecutarse como web/PWA y compilarse como APK Android mediante Capacitor.

## Interfaz y funcionalidades

- `www/index.html` contiene la interfaz oficial de cinco pestañas (Inicio, Análisis, Plan/Presupuesto, Lista/Movimientos y Cuenta) y la lógica JavaScript integrada.
- Se conservó la interfaz del archivo oficial `index(20261109-171845).html`; no se recuperó la pantalla antigua.
- Incluye registro y edición de ingresos, gastos y ahorros; bolsillos de efectivo, Nequi y Nu; categorías; presupuestos; análisis; reportes mensuales; perfiles locales; deudas y abonos; metas de ahorro; recordatorios de gastos recurrentes; Nilo; exportación CSV y respaldo/restauración JSON.
- Los recordatorios recurrentes no hacen cobros automáticos: el usuario confirma cada pago.
- No requiere Belvo, Supabase, conexión bancaria, autenticación externa ni servicios de terceros.

## Ejecutar pruebas

Requiere Node.js 22 o superior:

```bash
npm test
```

Las pruebas verifican sintaxis, referencias DOM, handlers, navegación y cálculos financieros seleccionados. Son pruebas automatizadas de lógica y estructura; no sustituyen pruebas manuales en un teléfono Android.

## Generar el APK de prueba

El repositorio incluye `.github/workflows/build-android.yml`. Para compilar:

1. Descomprime este ZIP.
2. Sube el contenido de la carpeta `mi-control-financiero-github` a un repositorio GitHub nuevo, en la rama `main`.
3. Abre **Actions** y selecciona **Build Android APK**.
4. Pulsa **Run workflow** y espera a que termine el proceso.
5. Si la ejecución termina correctamente, descarga el artefacto `mi-control-financiero-debug-apk`.
6. Descomprime el artefacto y encontrarás `app-debug.apk`, listo para instalar como versión de prueba en Android.

El APK de ese flujo es **debug**, no está firmado para distribución en Play Store. Para publicar una versión release se debe configurar una firma Android propia y proteger las claves de firma como secretos; nunca incluirlas en este ZIP ni en el repositorio.

### Compilación local (opcional)

Requiere Node.js 22, Java 21 y Android SDK/Android Studio:

```bash
npm install --no-audit --no-fund
npx cap add android
npx cap sync android
python -m pip install Pillow
python scripts/apply-android-icons.py
npm test
cd android
./gradlew assembleDebug
```

## Datos y seguridad

- Los datos financieros se guardan localmente en `localStorage` dentro del almacenamiento de la aplicación. No hay sincronización en la nube.
- `localStorage` **no cifra por sí mismo** los datos. La app no debe describirse como almacenamiento cifrado ni como una caja fuerte. Protege el teléfono con bloqueo de pantalla, evita compartir el dispositivo desbloqueado y conserva los respaldos JSON en un lugar privado.
- El respaldo incluye los perfiles y datos locales. Restaurarlo reemplaza los datos de la instalación actual; crea un respaldo antes de restaurar.
- La exportación CSV contiene movimientos del perfil activo.
- El service worker almacena el shell de la aplicación para permitir su apertura offline después de la primera carga; no sincroniza ni cifra datos financieros.

## Límites de verificación de esta entrega

Se ejecutan pruebas automatizadas del código y de cálculos seleccionados. En este entorno no hay Android SDK instalado, por lo que no se ha compilado ni instalado un APK real aquí. El workflow de GitHub está preparado para producir el APK debug en un runner con Android SDK. Antes de usar datos financieros reales, instala el APK generado y prueba manualmente los flujos de alta/edición/eliminación, perfiles, respaldo y restauración en tu teléfono.
