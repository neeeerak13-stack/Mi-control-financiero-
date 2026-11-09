# Matriz de funcionalidades

**Leyenda:** Implementada = existe en el código; Probada = existe una prueba automatizada de regresión en esta entrega; Parcial = existe, pero su recorrido completo no fue validado en navegador/dispositivo.

| Funcionalidad | Código encontrado | Prueba automatizada | Observación |
|---|---|---|---|
| Crear ingreso | Sí | Probada | Monto, fecha, categoría y bolsillo validados |
| Crear gasto | Sí | Probada | Recalcula totales y saldos |
| Registrar ahorro | Sí | Probada | Reduce el saldo del bolsillo y se contabiliza como ahorro |
| Editar movimiento | Sí | Probada | Actualiza el registro, no crea uno nuevo |
| Eliminar movimiento | Sí | Probada | Recalcula los totales |
| Categorías | Sí | Parcial | CRUD revisado estáticamente; tipo validado |
| Presupuesto mensual | Sí | Probada | Campo vacío rechazado; 0 permite quitar |
| Límite por categoría | Sí | Probada | Campo vacío rechazado; 0 permite quitar |
| Bolsillos/saldos | Sí | Probada | Saldo inicial más movimientos |
| Metas de ahorro | Sí | Probada | Crear meta y aportar |
| Deudas y pagos | Sí | Probada | Crear deuda y registrar abono asociado |
| Gastos recurrentes | Sí | Probada | Crear recordatorio; no registra automáticamente |
| Estimación de ingresos | Sí | Probada indirectamente | Cálculo mensual incluido en reporte |
| Análisis y estadísticas | Sí | Parcial | Funciones de cálculo probadas; gráficos no validados en navegador |
| Historial/filtros | Sí | Parcial | DOM/handlers estáticos; no recorrido visual E2E |
| Exportación CSV | Sí | Probada | Se verificó neutralización de fórmula |
| Respaldo JSON | Sí | Probada | Exportación y restauración válida/dañada |
| Perfiles | Sí | Probada | Se probó alternar perfiles sin mezclar movimientos |
| Persistencia | Sí | Probada parcialmente | Se prueba guardar/cargar perfil en almacenamiento simulado |
| Cinco pestañas | Sí | Comprobación estática | Se verifican nombres/atributos; no navegación real con navegador |
| Nilo | Sí | Parcial | Reglas locales revisadas; conversación visual no E2E |
| Instalación PWA/offline | Sí | No probada en navegador | Manifiesto y service worker presentes |
| APK Android | Configurado | No compilada | Workflow crea proyecto nativo en CI |

## Casos extremos considerados

- Monto negativo: rechazado por la prueba.
- Categoría de tipo incompatible: rechazada.
- Fecha imposible: rechazada.
- Campo de saldo/presupuesto vacío: rechazado.
- Movimiento repetido: permitido intencionalmente; no se usa una regla heurística que pueda bloquear gastos legítimos.
- Respaldo con monto no finito: rechazado.
- Respaldo válido: restaurado en prueba.
- Respaldo dañado: no reemplaza las claves actuales en prueba.
