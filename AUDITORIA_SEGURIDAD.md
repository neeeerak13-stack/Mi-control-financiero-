# Auditoría técnica y de seguridad — 9 de noviembre de 2026

## 1. Fuentes revisadas

- `index.html` oficial adjunto: interfaz nueva, HTML/CSS y script principal.
- `mi-control-financiero-github-ready.zip`: 17 entradas originales, incluidas `www/index.html`, `package.json`, configuración Capacitor, PWA, pruebas, workflow Android, recursos y documentación.
- Se integró el HTML oficial en `www/index.html`; no se recuperó el HTML antiguo como interfaz.
- El script principal contiene 99 funciones JavaScript y la interfaz conserva 98 referencias `id` y 66 handlers inline declarados.

## 2. Inventario funcional

| Área | Implementación encontrada | Estado tras revisión |
|---|---|---|
| Perfiles | Crear, cambiar y renombrar perfiles; claves separadas por perfil | Implementado; aislamiento lógico probado, no es autenticación |
| Movimientos | Ingresos, gastos y ahorros; edición y eliminación | Implementado; recorridos principales probados |
| Categorías | Crear, editar, eliminar y reasignar movimientos a categorías de respaldo | Implementado; validación de tipo reforzada |
| Bolsillos | Saldos iniciales para efectivo, Nequi y Nu | Implementado; saldo inicial más libro de movimientos |
| Presupuesto | Presupuesto mensual y límites por categoría | Implementado; validaciones de cantidad reforzadas |
| Estimación de ingresos | Objetivo mensual y comparación con ingresos registrados | Implementado |
| Ahorros | Movimientos de ahorro y metas con aportes | Implementado; creación/aporte probado |
| Deudas | Crear deuda, registrar abonos y calcular saldo pendiente | Implementado; creación y abono probados |
| Gastos recurrentes | Recordatorios con registro manual confirmado | Implementado como recordatorio; no automático |
| Análisis | Totales del mes, categorías, barras semanales, proyección y reporte mensual | Implementado; cálculos base probados, render gráfico no validado en navegador |
| Lista | Búsqueda y filtros por tipo; historial con edición/eliminación | Implementado en código; estructura estática revisada |
| Exportación CSV | Exportación de movimientos | Implementada; prueba del contenido y mitigación de fórmulas ejecutada |
| Respaldo JSON | Exportación de claves locales y restauración de perfiles | Implementado; exportación y restauración válida/ inválida probadas |
| Nilo | Respuestas basadas en reglas y en los datos locales; cambios de estado visual | Implementado localmente; no es IA remota |
| PWA | Manifiesto, caché del shell y registro del service worker | Integrado; no se probó instalación/offline en un teléfono |
| Android | Configuración Capacitor y workflow que genera el proyecto nativo y APK debug | Preparado; compilación no ejecutada en este entorno |

### Funciones no encontradas como operaciones completas

- No hay edición específica de deudas, metas o recordatorios recurrentes; sí se pueden crear, abonar/aportar, confirmar y eliminar según el módulo.
- No hay eliminación de perfiles desde la interfaz.
- Los movimientos duplicados no se bloquean automáticamente. Dos transacciones iguales pueden ser legítimas; cada registro nuevo recibe un identificador distinto.
- Los gastos recurrentes no se descuentan solos: requieren confirmación manual.
- No hay sincronización en la nube, autenticación ni conexión bancaria en los archivos entregados.

## 3. Hallazgos corregidos durante la integración

1. La interfaz nueva y la antigua comparten los IDs DOM necesarios y la lógica JavaScript. El script principal de la interfaz nueva difiere del antiguo en el manejo más defensivo de la pantalla de entrada.
2. Se integró la nueva interfaz sin modificar su CSS ni el marcado visual principal.
3. Se reforzó `saveTx`: monto positivo y finito, tipo permitido, categoría correspondiente al tipo, bolsillo permitido y fecha ISO real. Se limitaron descripciones y se generaron IDs de movimiento únicos.
4. Se corrigió la comparación de IDs de movimiento para que la edición/eliminación también funcionen con los nuevos IDs no numéricos.
5. Se reforzó el guardado de saldos iniciales, presupuesto mensual, límites y estimación para rechazar campos vacíos, cantidades no finitas y negativos. El valor explícito `0` permite quitar presupuestos/límites.
6. Se reforzó la validación de respaldos, incluidos montos, fechas, categorías, cuentas, límites y estructuras asociadas.
7. Se escaparon emojis y se codificaron los identificadores usados en handlers dinámicos para reducir el riesgo de inyección al renderizar datos restaurados.
8. Se neutralizaron celdas CSV cuyo contenido comienza con caracteres interpretables como fórmula por hojas de cálculo.

## 4. Seguridad y privacidad

### Almacenamiento local

Los datos financieros se guardan en `localStorage`. Esto significa:
- No existe cifrado de datos implementado por la aplicación.
- Los datos no están protegidos por una contraseña propia de la app.
- Un script que se ejecute en el mismo origen puede leer los datos.
- Quien tenga acceso al navegador/dispositivo desbloqueado puede acceder al perfil.
- Borrar datos del navegador, reinstalar o perder el dispositivo puede causar pérdida de información si no existe un respaldo externo.
- Los perfiles separan datos por claves, pero no son un límite de seguridad frente a alguien con acceso al almacenamiento local.

Los respaldos JSON contienen información financiera legible. Deben guardarse en un lugar privado.

### Código y entradas

- El HTML usa `textContent` para varios textos y una función `esc` para escapar datos insertados en HTML.
- Se revisaron los usos de `innerHTML` y se corrigieron salidas dinámicas sensibles encontradas en identificadores y emojis.
- No se encontró `eval`, `new Function`, `fetch` ni `XMLHttpRequest` en el script de la aplicación.
- No hay sanitizador externo como DOMPurify.
- La aplicación conserva handlers inline; no se configuró una política CSP estricta en estos archivos.
- El CSV ahora antepone apóstrofo a celdas con prefijos de fórmula.
- La restauración solicita confirmación y valida el esquema antes de reemplazar las claves. La recuperación ante error de almacenamiento es de mejor esfuerzo, no una transacción atómica garantizada por el navegador.

### Dependencias y servicios externos

- La lógica financiera no depende de un servidor remoto.
- Se cargan tipografías desde Google Fonts; si no hay red, el CSS tiene fuentes alternativas.
- Capacitor está fijado en `package.json` a versiones 8.6.0. No se pudo completar la resolución de dependencias ni generar un `package-lock.json` en este entorno.
- No se incluyen claves privadas, credenciales bancarias ni tokens de backend.

## 5. Limitaciones conocidas y recomendaciones

- Implementar autenticación y sincronización requeriría un backend nuevo, reglas de acceso por propietario y una estrategia de sincronización. No se añadieron sin autorización.
- Para datos financieros sensibles, la siguiente evolución de seguridad debería contemplar cifrado de respaldo con contraseña, controles de acceso del dispositivo y una política de retención/recuperación.
- Conviene probar restauraciones grandes y escenarios de cuota llena en dispositivos reales.
- La proyección mensual es una extrapolación lineal del gasto diario observado, no una predicción garantizada.
- Los perfiles son organizadores locales, no usuarios independientes.
- No declarar esta versión lista para producción ni como aplicación bancaria certificada.

## 6. Alcance de la conclusión

La integración de la interfaz y la lógica local está realizada y las pruebas automatizadas indicadas en `RESULTADOS_PRUEBAS.md` pasan. No se ha completado una prueba E2E visual en navegador/teléfono, una compilación APK, una auditoría de penetración ni una certificación de producción. Esas limitaciones se mantienen explícitas.
