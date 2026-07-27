# PresúFácil 1.0.9 — onboarding, formularios móviles y PDF por WhatsApp

Fecha: 2026-07-27  
Android: `versionName 1.0.9`, `versionCode 6`  
Proyecto Firebase: `presupuesto-7d9e2`

## Resumen

La versión 1.0.9 corrige un fallo de sincronización entre Firebase
Authentication y las reglas de Firestore/Storage inmediatamente después de
verificar un correo.

La cuenta Auth y `users/{uid}` se creaban correctamente, pero `reload()` podía
actualizar `user.emailVerified` a `true` conservando un ID token no vencido con
el claim `email_verified: false`. La interfaz abría el onboarding, mientras las
reglas publicadas seguían viendo al usuario como no verificado y rechazaban el
perfil. El batch atómico evitaba datos parciales, por eso quedaban:

- `onboardingComplete: false`;
- sin `ownerName` ni `businessName` en `users/{uid}`;
- sin documento `businessProfiles/{uid}`.

Las reglas locales y las publicadas fueron comparadas el 2026-07-27 y coinciden
exactamente. No se relajaron reglas ni se requieren cambios de seguridad.

## Cambios incluidos

1. `reloadEmailVerification()` ejecuta `reload()` y luego `getIdToken(true)`
   antes de cambiar el estado React a verificado.
2. Las escrituras protegidas de perfil y logo pueden renovar el token y
   reintentarse una sola vez ante `permission-denied`, `unauthenticated` o los
   equivalentes de Storage.
3. El reintento no se aplica a errores de conexión ni a otros fallos; tampoco
   crea bucles y un segundo rechazo se propaga normalmente.
4. El onboarding incorpora **Cerrar sesión** con confirmación y advertencia de
   datos no guardados.
5. `ownerName` se copia a `displayName` de Firebase Auth. Firestore continúa
   siendo la fuente principal; si esta sincronización auxiliar falla, no bloquea
   el perfil.
6. El panel admin marca **Perfil de negocio pendiente**. La búsqueda acepta
   `pendiente`, `configuracion` y `sin nombre`.
7. El formulario muestra el mensaje derivado del código real de Firebase en vez
   de informar siempre un problema de conexión.
8. El selector de clientes ahora ocupa el 86% de la altura disponible. Los
   formularios de cliente rápido y ocasional tienen desplazamiento propio y
   conservan visible el campo activo al abrir el teclado.
9. Android usa `softwareKeyboardLayoutMode: resize`; el teclado reduce el área
   útil en vez de superponerse a los campos y botones.
10. El botón verde del detalle dejó de enviar solo texto. Ahora genera el PDF,
    detecta WhatsApp o WhatsApp Business y abre el chat del teléfono del cliente
    con el archivo adjunto.
11. Los teléfonos argentinos locales se normalizan antes del envío (`261...`,
    `0261...`, `0261 15...` y `+54 9...` convergen al formato internacional).
12. **Compartir PDF** continúa disponible para correo, Drive u otras apps. En
    iOS también actúa como alternativa porque el sistema no permite dirigir de
    forma confiable un adjunto a un número específico.

## Recuperación de cuentas afectadas

No marcar manualmente `onboardingComplete: true` si no existe el perfil: eso
permitiría entrar a la app con datos de negocio incompletos.

Procedimiento recomendado:

1. En **Panel Admin → Usuarios**, buscar `pendiente`.
2. Contactar al usuario por el email mostrado, sin solicitar contraseña.
3. Indicarle que no cree otra cuenta.
4. En 1.0.9, tocar **Cerrar sesión** en el onboarding.
5. Iniciar sesión con el mismo email y completar nuevamente el negocio.
6. Confirmar en el panel que desapareció la advertencia y ya se muestra el
   nombre.

Los datos del formulario rechazado nunca llegaron a Firestore y no pueden
recuperarse automáticamente. La cuenta Auth, el UID y el email se conservan.

### Mensaje sugerido al usuario

> Hola. Detectamos un problema de la aplicación al confirmar el correo. Tu
> cuenta se creó correctamente, pero los datos del negocio no llegaron a
> guardarse. No fue un error tuyo. No crees otra cuenta. Tocá "Cerrar sesión",
> ingresá nuevamente con el mismo email y completá otra vez los datos del
> negocio. Nunca nos envíes tu contraseña. Si vuelve a fallar, mandanos una
> captura y la hora aproximada del intento.

## Despliegue

Esta release cambia el cliente React Native y agrega los módulos
`react-native-share` y `expo-build-properties` (requerido por su plugin de
Expo). No requiere desplegar reglas, Functions, índices ni migraciones de
Firestore, pero **sí exige crear un APK/AAB nuevo**: no alcanza con una
actualización JavaScript ni con volver a usar el binario 1.0.8.

### APK privado de prueba

```bash
eas build --platform android --profile preview
```

### Android App Bundle de producción

```bash
eas build --platform android --profile production
```

Antes de entregar el archivo, comprobar que EAS informa `versionName 1.0.9` y
`versionCode 6`. No distribuir nuevamente el APK 1.0.8 con otro nombre.

Cuando el APK/AAB 1.0.9 ya tenga una URL válida de descarga, entrar en
**Panel Admin → Configurar actualización**, establecer `latestVersion` en
`1.0.9`, cargar esa URL y recién entonces activar el aviso. No activar el aviso
antes de que el archivo pueda descargarse.

## Smoke test obligatorio

Ejecutar en una cuenta de prueba nueva:

1. Crear la cuenta y verificar el correo sin cerrar la sesión.
2. Tocar **Ya verifiqué mi correo**.
3. Completar el negocio sin logo y confirmar que entra a Inicio.
4. Revisar en Admin que aparecen responsable/negocio y no la advertencia.
5. Editar el responsable y comprobar el nuevo nombre en Admin.
6. Repetir con logo para validar Storage.
7. Crear otra cuenta, llegar al onboarding, usar **Cerrar sesión** y volver a
   entrar con la misma cuenta.
8. Probar búsquedas `pendiente` y `sin nombre` en el panel admin.
9. Abrir el selector de clientes en un teléfono pequeño, entrar en **Cliente
   ocasional** y enfocar, en orden, nombre, teléfono, email y dirección. Cada
   campo y el botón final deben poder verse desplazando el formulario con el
   teclado abierto.
10. Crear un cliente con teléfono local, por ejemplo `261 6565656`, crear un
    presupuesto y tocar **Enviar PDF por WhatsApp**. Debe abrirse el chat de ese
    cliente con un archivo `.pdf`, no un mensaje de texto.
11. Repetir el envío con un número `+54 9 ...`. Si el teléfono de prueba usa
    WhatsApp Business, validar también esa variante.
12. Volver sin enviar y confirmar que la app no marca el presupuesto como
    enviado automáticamente. Después enviarlo y usar la confirmación manual.
13. Probar **Compartir PDF** y comprobar que todavía aparecen otras apps del
    teléfono.

Los usuarios anteriores que ya tenían un perfil completo sincronizarán
`displayName` la próxima vez que guarden una edición de su perfil; no se requiere
migración masiva para el funcionamiento de la app.

## Verificaciones técnicas previas al build

```bash
npm test
npx expo-doctor
npx expo export --platform android --output-dir .expo/validation-export
```

Resultado previo a la distribución:

- Tests lógicos: 29 aprobados.
- Tests de Functions: 1 aprobado.
- Tests de reglas: 106 aprobados.
- Expo Doctor: 18/18 comprobaciones aprobadas.
- Configuración prebuild: resolvió el plugin; el manifiesto generado contiene
  consultas para `com.whatsapp`/`com.whatsapp.w4b` y `adjustResize`.
- Bundle Android: exportado correctamente, 1.998 módulos.

`npm audit --omit=dev` continúa informando 28 avisos transitivos del árbol de
Expo/React Native (principalmente herramientas `glob`, `postcss` y `uuid`). La
corrección automática propuesta cambia a Expo 57/React Native 0.86 y es
incompatible con esta release, por lo que no se aplicó `--force`. El nuevo
`react-native-share` no incorpora dependencias transitivas propias. Planificar
la actualización de SDK como una release separada y volver a ejecutar el smoke
test completo.

## Rollback

Si el smoke test falla, conservar la 1.0.8 como referencia interna y no
distribuir la 1.0.9. Revertir juntos los cambios de `AuthContext`,
`authVerification`, `useBusiness`, onboarding y sincronización de
`displayName`; no relajar `isVerified()` en las reglas como solución temporal.
Si falla únicamente el envío directo, conservar **Compartir PDF** como
alternativa mientras se revisan `pdf.service.js`, `react-native-share` y su
plugin de `app.json`.
