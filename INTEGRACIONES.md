# Estado de integraciones — Mi Control Financiero

## Lo que se encontró en el ZIP entregado

`www/index.html` es una app local autónoma. Su script `funcionamiento` implementa perfiles, movimientos, presupuestos, análisis, deudas, metas, gastos recurrentes, Nilo y exportación/importación. No incluye:

- `@supabase/supabase-js` ni configuración Supabase.
- Pantalla o flujo de autenticación de Supabase.
- Llamadas `fetch` ni funciones de sincronización remota.
- Flujo de enlace bancario Belvo.
- Permisos o consentimiento para conectar cuentas bancarias.

La persistencia actual se realiza con `localStorage`.

## Contexto previo del backend

En el trabajo anterior se había configurado un proyecto Supabase en la organización de la usuaria. El estado leído durante esta sesión era `INACTIVE`; se solicitó su restauración y el último estado devuelto fue `COMING_UP` (arrancando).

El contexto anterior registra funciones Edge `dynamic-function`, `belvo-save-link` y `belvo-import-transactions`, además de tablas `bank_accounts` y `transactions`, y protecciones para campos administrados por Belvo. Esos componentes deben revisarse contra el proyecto ya restaurado antes de volver a usarlos. El flujo Belvo end-to-end no estaba confirmado en la última revisión histórica.

## Seguridad y decisiones pendientes

- No incluir claves `service_role` ni secretos de Belvo en `www/index.html`.
- El frontend solo debe usar una clave publicable de Supabase.
- Para sincronización entre dispositivos se necesita una identidad de usuario estable y políticas RLS por propietario.
- Para enlazar bancos se necesita una acción explícita de consentimiento en la interfaz. No se añadió porque se pidió conservar la interfaz sin cambios.
- No se debe declarar una cuenta bancaria conectada hasta confirmar el intercambio con Belvo en Sandbox y la importación idempotente de movimientos.

## Resultado de esta entrega

La app local y la estructura Android/PWA quedan preparadas. La integración cloud/bancaria queda identificada como pendiente de revalidación, no simulada.
