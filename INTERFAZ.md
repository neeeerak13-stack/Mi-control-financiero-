# Integridad de la interfaz oficial

La fuente visual oficial de esta integración es el archivo `index.html` adjuntado para este trabajo.

- Se conservó íntegramente el bloque CSS de la fuente oficial.
- La huella SHA-256 del CSS oficial y del CSS integrado coincide: `fcbe2f81f83fe4688037cbde8c2d503781c0715eefb89b5b3406f653f86d6035`.
- El marcado visual comprendido entre el cierre de estilos y el inicio del script principal coincide con el archivo oficial.
- Se añadieron únicamente el enlace al manifiesto PWA en el `<head>` y el registro condicional del service worker al final del documento. No cambian colores, tipografías, distribución, tarjetas, gráficos, iconos, textos ni navegación.
- Se conservaron las cinco pestañas: Inicio, Análisis, Plan, Lista y Cuenta.

La prueba automatizada `tests/smoke.mjs` vuelve a comprobar la huella del CSS y la presencia de las cinco pestañas en cada ejecución.
