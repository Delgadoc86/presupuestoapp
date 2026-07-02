# PresúFácil

**Aplicación móvil para crear, gestionar y compartir presupuestos profesionales.**  
Diseñada para autónomos y pequeños negocios que necesitan emitir presupuestos rápido, desde el celular y sin complicaciones.

---

## Versiones

### v1.0.6 (2026-07-01)

**Rediseño visual completo (UI/UX):**

- Sistema de colores centralizado en `src/theme/colors.js`: paleta primaria azul `#2563EB`, verde `#16A34A`, violeta `#7C3AED`, tokens de fondo/superficie/texto/borde.
- `QuoteCard` estilo conversacional: avatar circular del cliente coloreado por estado, monto en verde, meta line con número y fecha.
- `QuoteStatusBadge` con fondos pastel correctos usando `QUOTE_STATUS_BG_COLOR` (antes usaba `${color}20`).
- `QuoteItemRow` con shadow real (`elevation: 2`), subtotal en verde, etiquetas de campo en 11px mayúsculas.
- `QuoteTotalsCard`: TOTAL en verde, saldo pendiente en violeta, toggle de tipo de descuento.
- `AppInput` estilo filled con `borderRadius: 12` y colores del sistema de diseño.
- `AppButton` con forma de píldora (`borderRadius: 50`), altura 54px, `fontWeight: 600`.
- `AppTabNavigator` con sombra superior, etiquetas 11px bold, indicador tipo píldora en tab activo.
- `HomeScreen` rediseñado: saludo dinámico (Buenos días/tardes/noches), grid de acciones rápidas con `Pressable` + `scale(0.97)`, estadísticas del mes desde Firestore, secciones con `gap: 10`.
- `BusinessProfileScreen`: logo circular (`borderRadius: 50`).
- Ícono de app personalizado: `assets/icon.svg` (gradiente azul, documento con ítems, badge verde); herramienta `scripts/generate-icons.html` para exportar todos los formatos PNG requeridos por Expo.
- `app.json`: splash `backgroundColor` → `#2563EB`, adaptive icon `backgroundColor` → `#1D4ED8`.

**Correcciones de UX:**

- Botón "Guardar cambios" en `BusinessProfileScreen` movido dentro del `ScrollView` (ya no flota sobre el formulario).
- Botón "Crear presupuesto" en `QuoteFormScreen` movido dentro del `ScrollView` (misma corrección).
- Label "ADMINISTRACIÓN" en `HomeScreen` ya no era tapado por la card Admin (se eliminaron todos los `marginTop: -4` y se agruparon secciones en `<View style={styles.section}>`).

**Preparación para beta — correcciones críticas:**

- `ErrorBoundary` añadido en `App.js`: captura crashes de React y muestra pantalla de error con botón "Intentar de nuevo" en lugar de pantalla blanca.
- Eliminados todos los `console.log` / `console.error` / `console.warn` del código de producción (16 ocurrencias en 11 archivos). Reemplazados por `logError()` de `errorUtils.js`, que solo loguea en `__DEV__`.
- Eliminado `console.log('Guardando perfil para UID:', user.uid)` en `useBusiness.js` que exponía el UID del usuario en logs de producción.
- Nuevas validaciones en `QuoteFormScreen`:
  - Todos los ítems deben tener descripción no vacía.
  - Cantidad de cada ítem debe ser mayor a 0.
  - Precio no puede ser negativo.
  - Máximo 50 ítems por presupuesto (previene PDFs corruptos).
- Fix campos numéricos en formulario de presupuesto: `unitPrice` arranca vacío en ítems nuevos (antes mostraba "0"). `selectTextOnFocus` en cantidad, precio unitario, descuento y anticipo — al tocar, selecciona todo el valor para reemplazarlo directo. Campos de descuento y anticipo arrancan vacíos con `placeholder="0"`.
- `expo-doctor` 18/18 checks sin issues.

---

### v1.0.5 (2026-06-28)

**Historial de presupuestos — rediseño completo:**

- Paginación real contra Firestore: carga inicial de 20 presupuestos con `limit(20)` + `orderBy('createdAt', 'desc')`. Botón "Cargar más" usa `startAfter(lastDoc)` para páginas siguientes. Ya no se trae toda la colección.
- Modal de filtros: reemplaza las dos filas de chips (11 controles) por una barra compacta de una línea con dos pills (`Estado: Todos` / `Fecha: Todas`) y un ícono con badge numérico. El modal (`animationType="slide"`) permite elegir estado y rango de fecha sin aplicar hasta presionar "Aplicar".
- Filtros por estado modifican la query Firestore directamente (`where('status', '==', value)`), no filtran en memoria.
- Filtros por fecha modifican la query Firestore (`where('createdAt', '>=', Timestamp)`), no filtran en memoria.
- Búsqueda normalizada: `normalizeText()` elimina tildes y pasa a minúsculas antes de comparar. Busca en nombre, teléfono, email del cliente, número de presupuesto y total. Búsqueda local sobre los resultados cargados.
- Agrupación temporal: encabezados de sección "Hoy / Ayer / Esta semana / Este mes / Junio 2026" intercalados en el FlatList sin SectionList.
- `useHistoryQuotes` hook independiente (`getDocs` one-shot) con `refresh()`, `loadMore()`, `removeQuote()` y `updateQuoteLocal()` para mutaciones sin re-fetch.
- Índices Firestore requeridos: `quotes: userId ASC, createdAt DESC` y `quotes: userId ASC, status ASC, createdAt DESC`.

**Panel de administración — mejoras visuales y corrección de bugs:**

- Fix crítico: los contadores del Dashboard (Pro activo, Demo, Suspendidos) siempre mostraban 0 porque se comparaba el objeto devuelto por `getPlanStatus()` contra un string literal. Ahora usa `.status`.
- Fix: el dialog "Extender Pro" siempre decía "Activar Pro" porque `getPlanStatus(user) === 'pro_active'` nunca era true (objeto vs string). Ahora usa `.isProActive`.
- Badges con ícono + color: SUSPENDIDO (rojo + alert-circle), PRO (verde + crown), VENCIDO (gris + crown-off), DEMO (naranja + star-outline).
- Tarjetas de usuario ~30% más compactas (padding 16→12, gap 10→7).
- Tiempo relativo de último acceso: "Hace 2 días", "Hace 1 mes", "Nunca".
- FlatList optimizado: `removeClippedSubviews`, `initialNumToRender=8`, `maxToRenderPerBatch=5`, `windowSize=5`.
- Sección de resumen en Dashboard: registrados, activos, suspendidos, Pro vencido.

**SafeArea Android:**

- Fix del BottomTabNavigator: la barra de navegación del sistema (botones/gestos) tapaba las pestañas en Android. Solucionado en `AppTabNavigator.js` con `useSafeAreaInsets()` — `tabBarStyle.height = 64 + insets.bottom`, `paddingBottom = insets.bottom > 0 ? insets.bottom : 8`. No se toca ninguna pantalla individual.

**Deuda técnica — centralización:**

- `src/config/appConfig.js`: fuente única de constantes (`demoQuoteLimit`, `proDurations`, `pdf.firstPageItems`, `supportEmail`, etc.).
- `src/utils/dateUtils.js`: `timestampToDate()`, `formatDateAR()`, `addDays()`, `getDaysRemaining()`, `formatRelativeTime()`. Elimina 5+ patrones duplicados en servicios y pantallas.
- `src/utils/planStatus.js` reescrito: `getPlanStatus()` devuelve objeto rico (`status`, `isProActive`, `canCreateQuote`, `remainingDays`, `demoRemainingQuotes`, etc.) en lugar de un string.
- `src/utils/errorUtils.js`: `logError()` centralizado (solo loguea en `__DEV__`; hook para Sentry futuro).
- `src/utils/searchUtils.js`: `normalizeText()` y `matchesSearch()` reutilizables.
- `src/hooks/useHistoryQuotes.js`: hook de paginación separado de `useQuotes` (que mantiene onSnapshot para tiempo real).
- `firestore.rules` y `storage.rules` versionados en el repositorio.

---

### v1.0.4 (2026-06-15)

**Campo nombre del responsable (`ownerName`):**

- El onboarding y la edición de perfil ahora piden el nombre completo del responsable o titular (campo obligatorio).
- El nombre del negocio (`businessName`) pasa a ser **opcional**: autónomos, albañiles, electricistas y otros trabajadores independientes sin marca pueden operar solo con su nombre personal.
- Si no hay nombre de negocio, el nombre del responsable se usa como título principal en el PDF y en el panel admin.
- Si hay nombre de negocio, el nombre del responsable aparece como subtítulo debajo en el PDF.
- El panel admin muestra el nombre del responsable debajo del nombre de negocio y lo incluye en el buscador: buscando "Marcela Rosales" se encuentra aunque el negocio se llame "Verdulería Merce".
- El campo `ownerName` se denormaliza a `users/{uid}` (igual que `businessName`) para que el panel admin lo lea sin queries adicionales.

**Mejoras en el panel admin — cambio de planes Demo/Pro:**

- Confirmación obligatoria antes de cualquier cambio de plan: activar Pro, extender Pro, pasar a Demo y reactivar suspendidos.
- Nuevo campo `proRemainingDays` en Firestore: al bajar un usuario de Pro a Demo se guardan los días restantes del período activo.
- Al volver a activar Pro a un usuario con días guardados, el admin elige explícitamente entre restaurar exactamente los días guardados o iniciar un período nuevo (30/180/365 días). El sistema nunca asigna días automáticamente.
- `proExpiresAt` se limpia al bajar a Demo, eliminando datos stale en Firestore.
- `proActivatedAt` ya no se sobreescribe en cada activación: conserva la fecha de primera activación del usuario.
- Eliminada función `activateUserPro()` sin duración (legacy). Todos los cambios de plan pasan por `activateUserProWithDuration()` o `restoreProFromSavedDays()`.
- Nueva función `restoreProFromSavedDays()` en `admin.service.js`.
- Los diálogos de confirmación muestran la fecha exacta de vencimiento resultante antes de confirmar.
- Badge visual "X días Pro guardados" en la tarjeta del usuario cuando está en Demo con días pendientes de restaurar.

---

### v1.0.3 (2026-06-15)

**Verificación de email obligatoria:**

- Al registrarse, la app envía un email de verificación automáticamente.
- Los usuarios no verificados ven una pantalla dedicada para verificar el email o reenviar el correo antes de poder acceder a la app.
- Reenvío con cooldown de 60 segundos. El botón muestra la cuenta regresiva.
- `reloadUser()` en `AuthContext` recarga el estado de verificación desde Firebase (`auth.currentUser.reload()`) y actualiza el estado React sin cerrar sesión.

**Seguridad en recuperación de contraseña (OWASP A07):**

- Corregida falla de enumeración de usuarios: el formulario de recuperación siempre muestra el estado de éxito independientemente de si el email está registrado o no.
- `auth/user-not-found` se absorbe en `resetPassword()` del servicio y nunca llega a la UI.
- Solo errores operacionales reales (sin conexión) interrumpen el flujo.

**Rubro / profesión asociado permanentemente a la cuenta:**

- El rubro elegido durante el onboarding queda asociado de forma permanente a la cuenta.
- Al tocar "Guardar y comenzar" en el onboarding, se muestra un diálogo de confirmación con advertencia explícita sobre la irreversibilidad de la elección antes de guardar.
- En la pantalla de edición del perfil del negocio, el rubro aparece como campo bloqueado con ícono de candado y fondo diferenciado. Al tocarlo se muestra un mensaje informativo que explica cómo cambiar de rubro (requiere eliminar la cuenta).

**Eliminado botón "Cambiar contraseña":**

- Removido de la pantalla de cuenta. La contraseña se gestiona exclusivamente mediante el email de recuperación.

**Migración de proyecto Firebase:**

- Base de datos migrada al proyecto `presupuesto-7d9e2`.

---

### v1.0.2 (2026-06-10)

**Sistema comercial Demo/Pro:**

- **Planes Demo y Pro:** cada usuario tiene un plan asignado (`demo` o `pro`). El plan Demo limita la cantidad de presupuestos por mes (por defecto 3, configurable por admin). El plan Pro no tiene límite mensual.
- **Cuota mensual:** el contador `quotesThisMonth` se resetea automáticamente al cambiar el mes, dentro de la transacción Firestore que crea cada presupuesto.
- **Vencimiento de planes Pro:** los planes Pro tienen `proActivatedAt` y `proExpiresAt`. Al vencer, el usuario pasa automáticamente a comportamiento Demo sin intervención del admin.
- **Banner de plan en Inicio:** indicador visual del estado del plan (Demo con cuota restante, Pro activo con fecha de vencimiento, Pro vencido, Cuenta suspendida). Tappable para contactar soporte o solicitar upgrade.
- **Mensajes de error en formulario e historial:** al alcanzar el límite Demo o tener la cuenta suspendida, se muestra un Alert con opción de contactar por email.

**Panel de administración:**

- **Panel Admin:** accesible desde Ajustes → Panel Admin y también desde la pantalla de Inicio (solo para cuentas admin). La detección del rol admin se hace por la colección `admins/{uid}` en Firestore.
- **Dashboard de estadísticas:** total de usuarios, Demo, Pro activos y suspendidos.
- **Lista de usuarios:** buscador por email/negocio/ID, tarjeta por usuario con plan, fechas de vencimiento, uso mensual y total de presupuestos.
- **Acciones por usuario:** activar Pro por 30/180/365 días (con extensión desde el vencimiento actual si ya es Pro activo), pasar a Demo, cambiar límite mensual, suspender, reactivar.

**Selector de rubro en onboarding:**

- Reemplaza el campo libre por un selector con 20 rubros predefinidos (mecánico, electricista, plomero, etc.) más opción "Otro" con campo de texto libre.

**Reglas de seguridad Firestore:**

- Los campos comerciales (`planType`, `pro`, `enabled`, `quoteLimit`) solo pueden ser escritos por admins. Los usuarios pueden actualizar únicamente los contadores (`quotesThisMonth`, `totalQuotes`, `lastQuoteNumber`) con validación increment-only.

**Correcciones:**

- Panel admin no aparecía después de múltiples ciclos de login/logout: se agrega `setLoading(true)` antes del `getDoc` en `useIsAdmin` y guardia `!adminLoading` en `SettingsScreen` para evitar renderizar el estado provisional.

---

### v1.0.1 (2026-06-10)

**Correcciones de bugs:**

- **Formulario de presupuesto se pre-cargaba después de crear uno:** al crear un presupuesto y volver a la pestaña "Presupuesto", el formulario retenía los datos del cliente e ítems anteriores. Ahora el formulario se limpia automáticamente y está listo para un nuevo presupuesto de inmediato.
- **Logo del negocio no aparecía en el PDF:** la URL de Firebase Storage no podía cargarse dentro del WebView de `expo-print` por restricciones de sandbox. Ahora el logo se descarga y convierte a base64 antes de generar el PDF, por lo que siempre aparece correctamente.
- **Diseño del PDF mejorado:** nuevo layout con barra de acento superior, jerarquía tipográfica más clara, cliente con borde lateral destacado, tabla con anchos de columna explícitos y pie de página más legible.

### v1.0.0 (2026-06-07)

Lanzamiento inicial: registro/login con Firebase Auth, perfil del negocio con logo, creación de presupuestos con ítems/descuento/anticipo, generación de PDF con paginación JS, compartir por WhatsApp y share sheet, historial con búsqueda y filtros, plantillas de ítems, gestión de cuenta con eliminación segura (reautenticación previa).

---

## Descripción

PresúFácil permite a cualquier negocio o profesional independiente:

- Crear presupuestos detallados en segundos
- Gestionar el estado de cada presupuesto (borrador, enviado, aceptado, rechazado, pagado)
- Generar un PDF profesional con el logo y datos del negocio
- Compartir el PDF desde el celular (WhatsApp, Gmail, Drive, etc.)
- Imprimir o guardar el PDF directamente desde el dispositivo
- Guardar plantillas de ítems para reutilizarlos en futuros presupuestos
- Mantener un historial completo de todos los presupuestos emitidos

---

## Capturas de pantalla

> *(Agregar capturas antes de publicar en Play Store)*

---

## Funcionalidades principales

| Módulo | Descripción |
|---|---|
| Autenticación | Registro, login, verificación de email obligatoria, recuperación de contraseña, eliminación segura de cuenta |
| Perfil del negocio | Nombre del responsable (obligatorio), nombre del negocio (opcional), rubro bloqueado post-onboarding, logo circular, WhatsApp, email, dirección, CUIT, condiciones generales, validez del presupuesto |
| Nuevo presupuesto | Datos del cliente, ítems con descripción/cantidad/precio (validados), descuento fijo o porcentual, anticipo, notas, máximo 50 ítems |
| Historial | Listado paginado (20 por página) con búsqueda normalizada y filtros por estado y rango de fecha vía Firestore |
| Detalle de presupuesto | Vista completa, cambio de estado, edición, duplicación, eliminación |
| Compartir PDF | Genera PDF profesional con logo base64, abre selector del sistema (WhatsApp, Gmail, Drive, etc.) |
| Imprimir / Guardar PDF | Abre el diálogo de impresión del sistema; también permite guardar como PDF |
| Plantillas | Ítems predefinidos reutilizables con 30+ plantillas base por rubro; CRUD completo con reordenamiento |
| Ajustes | Gestión del perfil del negocio y de la cuenta de usuario |
| Sistema Demo/Pro | Cuota mensual para Demo, planes Pro con fecha de vencimiento, banner de estado en Inicio |
| Panel Admin | Dashboard de usuarios, gestión de planes con confirmaciones y conservación de días Pro, buscador por nombre/email/negocio/UID |
| Estabilidad | ErrorBoundary global, logError() centralizado (solo activo en desarrollo), expo-doctor 18/18 ✓ |

---

## Tecnologías utilizadas

- **React Native 0.81** + **Expo SDK 54** (New Architecture habilitada)
- **Firebase Auth** — autenticación de usuarios
- **Cloud Firestore** — base de datos en tiempo real
- **Firebase Storage** — almacenamiento del logo del negocio
- **React Navigation v7** — navegación entre pantallas
- **React Native Paper v5** — componentes Material Design
- **expo-print** — generación de PDF desde HTML e impresión
- **expo-sharing** — compartición de archivos via share sheet del sistema
- **expo-file-system** (legacy) — copia y gestión de archivos locales
- **EAS Build** — builds de APK/AAB en la nube

---

## Requisitos del entorno de desarrollo

- Node.js 20 o superior
- npm 10 o superior
- EAS CLI: `npm install -g eas-cli`
- Cuenta de Firebase con proyecto configurado
- Cuenta de Expo (para EAS Build)

---

## Instalación y configuración

```bash
# 1. Clonar el repositorio
git clone https://github.com/Delgadoc86/presupuestoapp.git
cd presupuestoapp

# 2. Instalar dependencias
npm install

# 3. Iniciar la app en desarrollo
npx expo start -c
```

### Configurar Firebase

El archivo `firebase.config.js` en la raíz del proyecto contiene la configuración de Firebase. Está commiteado en este repositorio para que EAS Build pueda compilar la app.

> **Importante:** si vas a hacer un fork o usar este proyecto en un repositorio público, reemplazá las credenciales reales por las de tu propio proyecto Firebase y asegurate de que el repositorio sea privado, o usá [EAS Secrets](https://docs.expo.dev/build-reference/variables/) para no exponer credenciales.

Estructura del archivo:

```js
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'TU_API_KEY',
  authDomain: 'TU_AUTH_DOMAIN',
  projectId: 'TU_PROJECT_ID',
  storageBucket: 'TU_STORAGE_BUCKET',
  messagingSenderId: 'TU_MESSAGING_SENDER_ID',
  appId: 'TU_APP_ID',
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
export const db = getFirestore(app);
export const storage = getStorage(app);
```

---

## Build de APK (EAS)

```bash
# Preview (APK para instalar directamente en Android)
eas build --platform android --profile preview

# Producción (AAB para Google Play Store)
eas build --platform android --profile production
```

---

## Reglas de Firestore recomendadas

Las reglas protegen los campos comerciales (`planType`, `pro`, `enabled`, `quoteLimit`) para que solo puedan escribirlos los admins. Los usuarios solo pueden incrementar contadores de presupuestos.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuth() {
      return request.auth != null;
    }
    function isOwner(uid) {
      return request.auth.uid == uid;
    }
    function isAdmin() {
      return exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }

    match /users/{uid} {
      allow read: if isAuth() && (isOwner(uid) || isAdmin());
      allow create: if isAuth() && isOwner(uid);
      allow update, delete: if isAuth() && isAdmin();
      allow update: if isAuth() && isOwner(uid)
        && !request.resource.data.diff(resource.data).affectedKeys()
              .hasAny(['planType', 'pro', 'enabled', 'quoteLimit', 'planUpdatedAt', 'suspendedAt'])
        && request.resource.data.get('lastQuoteNumber', 0) >= resource.data.get('lastQuoteNumber', 0)
        && request.resource.data.get('totalQuotes', 0) >= resource.data.get('totalQuotes', 0)
        && (
             (request.resource.data.get('quoteMonth', '') == resource.data.get('quoteMonth', '')
              && request.resource.data.get('quotesThisMonth', 0) >= resource.data.get('quotesThisMonth', 0))
             ||
             (request.resource.data.get('quoteMonth', '') != resource.data.get('quoteMonth', '')
              && request.resource.data.get('quotesThisMonth', 0) <= 1)
           );
    }

    match /businessProfiles/{userId} {
      allow read, write: if isAuth() && (isOwner(userId) || isAdmin());
    }

    match /quotes/{quoteId} {
      allow read, update, delete: if isAuth()
        && (request.auth.uid == resource.data.userId || isAdmin());
      allow create: if isAuth()
        && request.auth.uid == request.resource.data.userId;
    }

    match /templates/{templateId} {
      allow read, update, delete: if isAuth()
        && (request.auth.uid == resource.data.userId || isAdmin());
      allow create: if isAuth()
        && request.auth.uid == request.resource.data.userId;
    }

    match /admins/{uid} {
      allow read: if isAuth();
      allow write: if false;
    }
  }
}
```

---

## Reglas de Firebase Storage recomendadas

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /logos/{userId}/{allPaths=**} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow create, update: if request.auth != null
        && request.auth.uid == userId
        && request.resource.size < 5 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
      allow delete: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## Permisos solicitados en Android

| Permiso | Motivo |
|---|---|
| `INTERNET` | Sincronización con Firebase (autenticación, datos y archivos) |
| `READ_MEDIA_IMAGES` / `READ_EXTERNAL_STORAGE` | Seleccionar el logo del negocio desde la galería |
| `WRITE_EXTERNAL_STORAGE` | Guardar PDF generado en el dispositivo |

---

## Política de privacidad

PresúFácil recopila y almacena únicamente los datos que el usuario ingresa de forma voluntaria:

- **Datos de cuenta:** dirección de email y contraseña (gestionados por Firebase Auth, nunca almacenados en texto plano).
- **Perfil del negocio:** nombre, rubro, teléfono, email, dirección, CUIT y logo (almacenados en Firestore y Storage privados, accesibles solo por el propio usuario).
- **Presupuestos:** información de clientes y servicios ingresada por el usuario (almacenada en Firestore privado del usuario).

**La app no comparte datos con terceros, no muestra publicidad y no realiza seguimiento de comportamiento.**

Todos los datos se almacenan en Google Firebase (infraestructura de Google Cloud) con reglas de seguridad que garantizan que cada usuario solo puede acceder a su propia información.

Para solicitar la eliminación de todos tus datos, contactá a: delgadocristian1986@gmail.com

---

## Estructura del proyecto

```
presupuestoapp/
├── assets/                  # Íconos y recursos visuales
├── src/
│   ├── components/          # Componentes reutilizables
│   │   ├── common/          # AppButton, AppInput, AppLoader, AppSnackbar, EmptyState, ErrorBoundary
│   │   ├── quotes/          # QuoteCard, QuoteItemRow, QuoteStatusBadge, QuoteTotalsCard
│   │   └── templates/       # TemplateItemRow
│   ├── context/             # AuthContext, BusinessContext, AppContext
│   ├── data/                # defaultTemplates (plantillas predefinidas)
│   ├── hooks/               # useBusiness, useQuotes, useHistoryQuotes, useTemplates, useIsAdmin, useAdminUsers
│   ├── navigation/          # AppNavigator, AppTabNavigator, AuthNavigator
│   ├── screens/             # Pantallas agrupadas por módulo
│   │   ├── auth/            # Login, Register, ForgotPassword
│   │   ├── history/         # HistoryScreen
│   │   ├── home/            # HomeScreen
│   │   ├── onboarding/      # BusinessSetupScreen
│   │   ├── quotes/          # QuoteDetailScreen, QuoteFormScreen
│   │   ├── settings/        # Settings, BusinessProfile, Account, Templates
│   │   └── admin/           # AdminDashboardScreen, AdminUsersScreen
│   ├── services/            # Lógica de Firebase y funciones de negocio
│   │   ├── auth.service.js
│   │   ├── business.service.js
│   │   ├── pdf.service.js   # Generación, compartición e impresión de PDF
│   │   ├── quotes.service.js
│   │   ├── storage.service.js
│   │   └── templates.service.js
│   ├── theme/               # Colores y tema Material Design
│   └── utils/               # Constantes (SECTOR_OPTIONS), formateadores, plantilla HTML del PDF, planStatus, contactHelper
├── App.js                   # Punto de entrada
├── firebase.config.js       # Configuración Firebase
├── google-services.json     # Configuración Firebase para Android nativo
├── babel.config.js
├── eas.json                 # Perfiles de build (preview APK / production AAB)
├── app.json
└── package.json
```

---

## Licencia y derechos de autor

```
Copyright (c) 2026 Cristian Delgado
Todos los derechos reservados.

Este software, incluyendo su código fuente, diseño visual, estructura y documentación,
es propiedad exclusiva de Cristian Delgado (delgadocristian1986@gmail.com).

Queda expresamente prohibido:
- Copiar, distribuir o modificar este software sin autorización escrita del autor.
- Usar el nombre "PresúFácil", el código fuente o cualquier parte del diseño
  para crear productos derivados, competidores o similares.
- Sublicenciar, vender o transferir derechos sobre este software a terceros.

El uso de este software está sujeto a los términos acordados por escrito con el autor.
Para consultas de licenciamiento: delgadocristian1986@gmail.com
```

---

## Contacto

**Autor:** Cristian Delgado  
**Email:** delgadocristian1986@gmail.com  
**Repositorio:** github.com/Delgadoc86/presupuestoapp
