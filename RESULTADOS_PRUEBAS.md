# Informe de pruebas — 9 de noviembre de 2026

## Entorno

- Node.js: `v22.16.0`.
- Comando ejecutado: `npm test`.
- El script `test` ejecuta `tests/smoke.mjs` y `tests/functional-regression.mjs`.
- No requiere instalar dependencias externas para ejecutar las pruebas automatizadas.

## Resultado

**Resultado: APROBADO.** Las dos suites automatizadas terminaron correctamente.

Salida real observada:

```text
> mi-control-financiero@1.0.0 test
> node tests/smoke.mjs && node tests/functional-regression.mjs

OK: sintaxis, 88 referencias DOM, 66 handlers y cálculos financieros básicos.
OK: movimientos, cálculos, deudas, metas, recurrencias, perfiles, exportación CSV, respaldo JSON y restauración validada.
```

## Qué se probó

### Comprobaciones estáticas

- Sintaxis del script principal.
- 88 referencias estáticas a elementos DOM existentes.
- 66 handlers inline con funciones declaradas.
- Presencia de las cinco pestañas.
- Presencia de manifiesto y registro del service worker.
- Huella SHA-256 del CSS idéntica a la interfaz oficial suministrada.
- Marcado visual principal idéntico antes del script funcional.

### Pruebas funcionales sobre las funciones reales del proyecto

- Crear ingreso, gasto y ahorro.
- Editar un movimiento sin duplicarlo.
- Eliminar un movimiento y recalcular totales.
- Rechazar montos negativos, categorías incompatibles y fechas imposibles.
- Rechazar campos vacíos de presupuesto y saldos.
- Guardar presupuesto mensual, límites por categoría, estimación de ingresos y saldos iniciales.
- Comprobar saldos por bolsillo y totales mensuales.
- Comprobar el reporte mensual y pagos por método.
- Crear deuda y registrar abono; comprobar saldo pendiente.
- Crear meta y aportar ahorro.
- Crear recordatorio recurrente sin registrar automáticamente un gasto.
- Cambiar entre perfiles y verificar que sus movimientos no se mezclen.
- Exportar CSV y neutralizar contenido que pudiera interpretarse como fórmula.
- Exportar respaldo JSON.
- Rechazar un respaldo con monto no finito sin alterar datos actuales.
- Restaurar un respaldo válido.

## No ejecutado / no certificado

- No se ejecutó una prueba E2E visual en navegador real ni en el teléfono.
- No se validaron manualmente las animaciones, todos los gráficos, formularios, gestos o navegación en las cinco pestañas.
- No se probó la instalación PWA ni el uso offline en Android.
- No se generó APK: el ZIP incluye el workflow para construirlo, pero la compilación Android no se ejecutó.
- No se completó `npm install` ni se generó `package-lock.json`; la resolución de dependencias excedió el tiempo disponible.
- No se realizó prueba de penetración ni auditoría externa.
- No se verificó sincronización en nube o conexión bancaria porque no están implementadas en el paquete.

**Conclusión:** las pruebas automatizadas ejecutadas pasan y la integridad del CSS/estructura visual oficial está comprobada por comparación de fuente. La aplicación no debe describirse como certificada para producción hasta completar las verificaciones de navegador, Android y seguridad pendientes.
