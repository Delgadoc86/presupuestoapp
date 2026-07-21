# Arquitectura — PresúFácil

Documento de referencia técnica para entender cómo está estructurada la app.

---

## Flujo de navegación

```
App.js
└── AppNavigator
      │
      ├── [loading = true]
      │     └── Spinner (ActivityIndicator)
      │
      ├── [user = null]
      │     └── AuthNavigator (Stack)
      │           ├── LoginScreen
      │           ├── RegisterScreen
      │           └── ForgotPasswordScreen
      │
      ├── [user existe, onboardingComplete = false]
      │     └── BusinessSetupScreen  ← pantalla única sin stack
      │
      └── [user existe, onboardingComplete = true]
            └── AppTabNavigator (BottomTab)
                  ├── Tab: Inicio
                  │     └── HomeScreen
                  │
                  ├── Tab: Presupuesto  (QuoteNavigator / Stack)
                  │     ├── QuoteFormScreen    ← pantalla inicial
                  │     └── QuoteDetailScreen
                  │
                  ├── Tab: Historial  (HistoryNavigator / Stack)
                  │     ├── HistoryScreen      ← pantalla inicial
                  │     ├── QuoteDetailScreen  (instancia separada)
                  │     └── QuoteFormScreen    (para editar desde historial)
                  │
                  └── Tab: Ajustes  (SettingsNavigator / Stack)
                        ├── SettingsScreen     ← pantalla inicial
                        ├── BusinessProfileScreen
                        ├── TemplateListScreen
                        ├── TemplateFormScreen
                        └── AccountScreen
```

**¿Por qué QuoteDetailScreen aparece en dos stacks?**
React Navigation no permite compartir pantallas entre stacks distintos.
Cada stack necesita su propia instancia para que el botón "volver" funcione correctamente.

**¿Cómo transiciona automáticamente del onboarding a la app principal?**
`completeOnboarding()` escribe `onboardingComplete: true` en Firestore.
`AuthContext` escucha ese documento con `onSnapshot`. Cuando el valor cambia,
`AppNavigator` re-renderiza y muestra `AppTabNavigator` sin ningún `navigate()` explícito.

---

## Estructura de Firestore

### Colección: `users`

Documento por usuario. ID = Firebase Auth UID.

```
users/{uid}
├── email              string     "usuario@email.com"
├── createdAt          Timestamp  fecha de registro
├── onboardingComplete boolean    false → true al completar el setup del negocio
├── lastQuoteNumber    number     contador para numeración correlativa (0, 1, 2, ...)
│
│   — campos denormalizados desde businessProfiles (para lectura rápida en admin) —
├── businessName       string     nombre del negocio (puede estar vacío)
├── ownerName          string     nombre del responsable / titular
│
│   — plan comercial (solo modificables por admin) —
├── planType           string     "demo" | "pro"
├── pro                boolean    alias de planType (compatibilidad legacy)
├── enabled            boolean    false = cuenta suspendida
├── quoteLimit         number     límite mensual en plan Demo (por defecto 3)
├── proActivatedAt     Timestamp  fecha de la primera activación Pro (nunca se sobreescribe)
├── proExpiresAt       Timestamp  vencimiento del período Pro activo (null si no aplica)
├── proRemainingDays   number     días Pro guardados al hacer downgrade Demo (null si no hay)
├── planUpdatedAt      Timestamp  última vez que el admin cambió el plan
├── suspendedAt        Timestamp  cuándo fue suspendida la cuenta (null si activa)
│
│   — contadores de uso (modificables por el usuario vía transacción) —
├── quotesThisMonth    number     presupuestos creados en el mes corriente
├── quoteMonth         string     mes del contador "YYYY-MM"
└── totalQuotes        number     total histórico de presupuestos
```

**Nota:** `lastQuoteNumber` se incrementa mediante una transacción atómica en
`createQuote()` y `duplicateQuote()` para garantizar unicidad incluso con acceso concurrente.

**Nota sobre `proRemainingDays`:** se calcula y guarda al momento del downgrade Pro→Demo.
Al reactivar Pro, el admin elige explícitamente entre restaurar esos días o iniciar un período nuevo.
`proExpiresAt` se limpia a `null` en el downgrade para evitar datos stale.

---

### Colección: `businessProfiles`

Perfil del negocio. ID = Firebase Auth UID (mismo que users).

```
businessProfiles/{uid}
├── ownerName          string    "Juan Pérez"  (obligatorio)
├── businessName       string    "Electricidad Gómez"  (opcional — freelancers pueden omitirlo)
├── sector             string    "Electricidad"
├── whatsapp           string    "5491155554444"
├── email              string    "negocio@email.com"  (opcional)
├── address            string    "Av. Corrientes 1234" (opcional)
├── cuit               string    "20-12345678-9"       (opcional)
├── generalConditions  string    "Garantía 90 días..." (opcional)
├── validityDays       number    30
├── logoUrl            string    URL de Firebase Storage (opcional)
└── updatedAt          Timestamp última actualización
```

---

### Colección: `quotes`

Un documento por presupuesto. ID determinista `${uid}_${quoteNumber}` desde
la fase de seguridad de reglas (ver más abajo) — los presupuestos creados
antes de ese cambio conservan su ID aleatorio original, ambos formatos
conviven sin problema (`read`/`update`/`delete` no dependen del formato).

```
quotes/{quoteId}
├── userId       string    UID del dueño (para filtrar con where)
├── quoteNumber  number    número correlativo único por usuario (1, 2, 3...)
├── status       string    "draft" | "sent" | "accepted" | "rejected" | "paid" | "expired"
│                          ("paid" se mantiene por compatibilidad — se migrará
│                          a jobs.paymentStatus cuando exista esa colección)
├── clientId     string|null  referencia a clients/{clientId}; null = cliente
│                              ocasional (sin ficha guardada) o presupuesto
│                              anterior a la fase de Clientes
├── createdAt    Timestamp
├── updatedAt    Timestamp
├── validUntil   Timestamp fecha de vencimiento del presupuesto
│
├── client                 snapshot inmutable del cliente al momento de crear
│   ├── name    string
│   ├── phone   string|null
│   ├── email   string|null
│   └── address string|null
│
├── business               snapshot del negocio al momento de crear (inmutable)
│   ├── ownerName     string
│   ├── businessName  string
│   ├── whatsapp      string
│   ├── email         string
│   ├── address       string
│   ├── cuit          string|null
│   ├── logoUrl       string|null  (convertido a base64 al generar el PDF)
│   └── generalConditions string
│
├── items        Array
│   └── { description, quantity, unitPrice, subtotal }
│
├── subtotal     number    suma de todos los subtotales de ítems
├── discount     number    valor del descuento (monto o porcentaje)
├── discountType string    "fixed" | "percent"
├── discountAmount number  monto calculado del descuento
├── advance      number    anticipo ya pagado
├── total        number    subtotal - descuento
└── notes        string|null aclaraciones opcionales
```

**¿Por qué `business` es un snapshot y no una referencia?**
Si el usuario edita su perfil después de crear el presupuesto, el historial
no debe cambiar. Se guarda una copia inmutable de los datos del negocio
tal como estaban al momento de emitir el presupuesto.

---

### Colección: `templates`

Plantillas de ítems reutilizables. ID auto-generado por Firestore.

```
templates/{templateId}
├── userId     string    UID del dueño
├── name       string    "Instalación eléctrica básica"
├── sector     string    rubro sugerido (opcional)
├── items      Array
│   └── { name, defaultPrice }
├── createdAt  Timestamp
└── updatedAt  Timestamp
```

---

### Colección: `clients`

Ficha de contacto del cliente. ID auto-generado por Firestore. Sin borrado
físico desde la UI — la única acción disponible es archivar/restaurar
(`archived`). El historial de presupuestos de un cliente y su cantidad NO
se guardan como contador aparte: siempre se calculan en vivo con la query
`quotes` filtrada por `userId` + `clientId` (ver índice compuesto abajo).

```
clients/{clientId}
├── userId      string    UID del dueño
├── name        string    obligatorio
├── phone       string|null
├── email       string|null
├── address     string|null
├── notes       string|null
├── archived    boolean   false = activo (visible en listado/selector)
├── archivedAt  Timestamp|null
├── createdAt   Timestamp
└── updatedAt   Timestamp
```

**Índice compuesto necesario** (`firestore.indexes.json`):
`quotes: userId ASC, clientId ASC, createdAt DESC` — historial de
presupuestos de un cliente, ordenado por fecha.

---

### Colección: `admins`

Un documento vacío por cada administrador. ID = Firebase Auth UID.

```
admins/{uid}   ← solo su existencia indica que el usuario es admin
```

Las reglas de Firestore permiten leer `admins/{uid}` a cualquier usuario autenticado
(para que el hook `useIsAdmin` funcione en el cliente) pero la escritura está bloqueada (`allow write: if false`).

---

### Firebase Storage

```
logos/
└── {userId}/
      └── logo.jpg    ← se sobreescribe en cada actualización del logo
```

Regla de seguridad: solo el usuario con UID coincidente puede leer y escribir.

---

## Gestión de estado

| Estado | Dónde vive | Mecanismo |
|---|---|---|
| Sesión del usuario | `AuthContext` | `onAuthStateChanged` de Firebase Auth |
| Datos de cuenta (`onboardingComplete`, etc.) | `AuthContext` | `onSnapshot` en `users/{uid}` |
| Perfil del negocio | `BusinessContext` | `onSnapshot` en `businessProfiles/{uid}` |
| Lista de presupuestos | `useQuotes` (hook local) | `onSnapshot` en colección `quotes` |
| Lista de plantillas | `useTemplates` (hook local) | `onSnapshot` en colección `templates` |
| Snackbar global | `AppContext` | `useState` local |
| Estado de formularios | Hooks/pantallas locales | `useState` local |

**Regla general:** si el dato necesita estar disponible en múltiples pantallas simultáneamente, vive en un Context. Si solo lo necesita una pantalla o su flujo directo, vive en el hook/pantalla local.

---

## Capas de la aplicación

```
screens/        → UI + lógica de presentación (qué mostrar, cómo responder al usuario)
    │
hooks/          → lógica de negocio reutilizable (formularios, suscripciones)
    │
services/       → acceso a datos externos (Firebase Auth, Firestore, Storage)
    │
context/        → estado global compartido entre pantallas
    │
utils/          → funciones puras sin efectos secundarios (formatters, constantes)
```

Los datos fluyen hacia abajo (services → hooks → screens).
Los eventos fluyen hacia arriba (usuario toca botón → pantalla llama al hook → hook llama al servicio).

---

## Decisiones técnicas importantes

### Transacción para números correlativos
`createQuote()` y `duplicateQuote()` usan `runTransaction` para garantizar que
`lastQuoteNumber` se incrementa de forma atómica. Si se usara `updateDoc` simple,
dos presupuestos creados casi simultáneamente desde distintos dispositivos
podrían tener el mismo número.

### setDoc con merge:true en vez de updateDoc
Todos los writes a Firestore usan `setDoc(..., { merge: true })` excepto en
`updateQuote()` y `updateQuoteStatus()` donde el documento siempre existe.
Esto evita el error "No document to update" para usuarios nuevos.

### Snapshot de negocio en presupuestos
El objeto `business` dentro de cada presupuesto es una copia plana de los datos
del negocio al momento de crear. Esto garantiza que editar el perfil del negocio
no modifica presupuestos ya emitidos.

### Sistema de planes Demo/Pro

El estado efectivo del plan se calcula en `utils/planStatus.js` (`getPlanStatus(userData)`) y nunca se almacena como campo explícito. Los posibles estados son:

| Estado | Condición |
|---|---|
| `suspended` | `enabled === false` |
| `pro_active` | `planType === 'pro'` y `proExpiresAt` no venció (o es null) |
| `pro_expired` | `planType === 'pro'` y `proExpiresAt < ahora` |
| `demo` | cualquier otro caso |

**Cambio de planes — reglas de seguridad:**
- Los campos de plan (`planType`, `pro`, `enabled`, `quoteLimit`, `proExpiresAt`, etc.) solo pueden ser escritos por admins según las reglas de Firestore.
- Los usuarios solo pueden incrementar sus propios contadores (`quotesThisMonth`, `totalQuotes`, `lastQuoteNumber`).

**Flujo de downgrade Pro → Demo:**
1. `setUserDemo()` lee `proExpiresAt` y calcula los días restantes.
2. Guarda `proRemainingDays = días restantes` (o `null` si ya venció).
3. Limpia `proExpiresAt = null` para evitar datos stale.

**Flujo de activación/restauración Pro:**
- `activateUserProWithDuration(uid, days)`: período nuevo. Si el usuario ya tiene Pro activo, extiende desde `proExpiresAt`. Limpia `proRemainingDays`.
- `restoreProFromSavedDays(uid)`: usa exactamente `proRemainingDays` guardados. Limpia `proRemainingDays` al terminar.
- `proActivatedAt` solo se escribe en la primera activación y nunca se sobreescribe.

### uploadBytes en lugar de uploadString+base64
`FileSystem.EncodingType` es `undefined` en la New Architecture (Expo SDK 54+).
Se usa `fetch(localUri).blob()` + `uploadBytes()` que funciona correctamente
con URIs `file://` de Android en React Native 0.71+.
