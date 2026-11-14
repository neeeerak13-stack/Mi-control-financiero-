# Alcance de integraciones

La aplicación se entrega como una herramienta financiera local. No necesita ni incluye conexiones bancarias, Belvo, Supabase, autenticación externa ni sincronización en la nube.

## Datos locales

Los perfiles y sus datos se guardan en `localStorage` del contenedor de la aplicación. Cada perfil utiliza una clave independiente. La exportación JSON incluye los perfiles locales; la restauración valida el formato y reemplaza los datos de la instalación actual después de pedir confirmación.

## Seguridad

`localStorage` no cifra datos por sí mismo. No se deben añadir secretos, contraseñas bancarias ni claves privadas al frontend. Para proteger los datos, el usuario debe mantener bloqueado el teléfono y guardar las copias de seguridad en una ubicación privada.

## Funciones que deliberadamente no se integran

- Enlace de cuentas bancarias o lectura automática de movimientos.
- Belvo u otros agregadores bancarios.
- Supabase u otra base de datos remota.
- Inicio de sesión externo y sincronización multi-dispositivo.

Estas funciones no son necesarias para el alcance actual de Mi Control Financiero.
