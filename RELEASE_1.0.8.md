# PresúFácil 1.0.8 — release de distribución local

Fecha: 2026-07-24
Android: `versionName 1.0.8`, `versionCode 5`
Perfil EAS: `preview` (`.apk` instalable directamente)

## Objetivo

Esta versión estabiliza la base funcional antes de probarla con clientes
locales. No agrega módulos comerciales nuevos: reduce riesgo en seguridad,
borrado de datos, configuración, permisos y diagnóstico de errores.

## Cambios incluidos

- `businessProfiles/{uid}` tiene reglas explícitas, allowlist y validación de tipos/tamaños.
- Clientes, presupuestos, plantillas, perfiles y logos exigen email verificado.
- Storage acepta únicamente `logos/{uid}/logo.jpg`, JPEG y hasta 5 MB.
- El logo solo puede leerse, reemplazarse o eliminarse por su propietario.
- El borrado principal de cuenta corre en Cloud Functions, procesa colecciones
  por lotes, bloquea escrituras tardías y elimina Auth al final del flujo.
- Perfil y onboarding actualizan Firestore atómicamente.
- Cámara y grabación de audio están bloqueadas en Android.
- Firebase admite configuración completa mediante `EXPO_PUBLIC_FIREBASE_*`,
  manteniendo el proyecto actual como fallback de compatibilidad.
- EAS separa los entornos `preview` y `production`.
- Sentry captura errores en producción solo si existe `EXPO_PUBLIC_SENTRY_DSN`.
- Se agregó cobertura de reglas para perfiles, verificación, Storage y carreras
  durante la eliminación de cuenta.

## Orden de activación obligatorio

1. Publicar el contenido completo de `firestore.rules` en Firestore Rules.
2. Publicar el contenido completo de `storage.rules` en Storage Rules.
3. Desplegar la Function:

   ```bash
   firebase deploy --only functions:deleteCurrentUserAccount
   ```

4. Para ambientes separados, cargar en EAS las seis variables
   `EXPO_PUBLIC_FIREBASE_*` listadas en `.env.example`. Deben definirse todas o ninguna.
5. Opcionalmente configurar Sentry con `EXPO_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`,
   `SENTRY_PROJECT` y `SENTRY_AUTH_TOKEN`.
6. Crear el APK:

   ```bash
   eas build --platform android --profile preview
   ```

## Verificación realizada

- `npm test`: 21 tests lógicos, 1 test de Functions y 106 tests de reglas aprobados.
- `npx expo-doctor`: 18/18 comprobaciones aprobadas.
- Exportación del bundle Android aprobada.
- Emulador Firebase descubre `us-central1-deleteCurrentUserAccount` correctamente.

## Smoke test antes de compartir el APK

En una cuenta nueva y otra existente:

1. Registrar, verificar email e iniciar sesión.
2. Completar onboarding y editar el perfil.
3. Subir, reemplazar y eliminar logo.
4. Crear cliente y presupuesto; generar y compartir PDF.
5. Cerrar sesión y comprobar persistencia al volver a entrar.
6. Eliminar una cuenta de prueba y confirmar en Firebase que no queden documentos,
   usuario Auth ni `logos/{uid}/logo.jpg`.

## Rollback

- Código: volver al commit de restauración `61be6fb` o a la rama de respaldo acordada.
- Firebase: conservar una copia de las reglas publicadas antes del cambio y volver
  a publicarlas únicamente si una prueba controlada detecta una incompatibilidad.
- Function: el cliente mantiene temporalmente el borrado anterior cuando recibe
  `functions/not-found`; no eliminar la Function después de distribuir esta APK
  sin validar primero ese fallback.

## Riesgo conocido

`npm audit` conserva avisos transitivos en herramientas Expo/React Native y SDKs
Google. Las correcciones restantes propuestas por npm requieren cambios mayores
como Expo 57/React Native 0.86 o versiones incompatibles de Firebase Admin. No se
aplicó `--force` para evitar introducir una migración disruptiva en esta release.
