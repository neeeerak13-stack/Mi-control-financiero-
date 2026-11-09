# Integraciones y almacenamiento

## Estado comprobado en los archivos entregados

La aplicación funciona como aplicación local. El código del ZIP y la nueva interfaz no contienen una implementación verificable de:
- Sincronización con una nube o base de datos remota.
- Autenticación de usuarios.
- Conexión bancaria mediante Belvo.
- Cliente Supabase, llamadas de sincronización remota o funciones backend incluidas en el paquete.

No se añadió ninguna integración externa ni se simularon conexiones bancarias. Las cuentas Efectivo, Nequi y Nu son bolsillos locales de registro, no conexiones con esos proveedores.

## Almacenamiento

Los perfiles y movimientos se guardan en `localStorage`. El service worker almacena archivos de la aplicación para abrir la interfaz offline, pero no sincroniza ni respalda los datos financieros.

La exportación JSON permite trasladar datos entre instalaciones manualmente. El archivo es legible y no tiene cifrado.

## Si en el futuro se autoriza sincronización

Se requerirá diseñar y auditar una arquitectura backend, autenticación, autorización por propietario, reglas de acceso a filas, cifrado en tránsito, gestión de secretos y estrategia de conflictos/sincronización. Ninguna de esas capacidades debe declararse disponible hasta implementarse y probarse.
