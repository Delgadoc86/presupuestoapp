# PresúFácil

**Aplicación móvil para crear, gestionar y compartir presupuestos profesionales.**  
Diseñada para autónomos y pequeños negocios que necesitan emitir presupuestos rápido, desde el celular y sin complicaciones.

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
| Autenticación | Registro, inicio de sesión y recuperación de contraseña vía Firebase Auth |
| Perfil del negocio | Nombre, rubro, logo, WhatsApp, email, dirección, CUIT, condiciones generales |
| Nuevo presupuesto | Datos del cliente, ítems con cantidad y precio unitario, descuento fijo o porcentual, anticipo, notas |
| Historial | Listado de todos los presupuestos con búsqueda y filtros por estado |
| Detalle de presupuesto | Vista completa, cambio de estado, edición, eliminación |
| Compartir PDF | Genera un PDF profesional y abre el selector del sistema (WhatsApp, Gmail, Drive, etc.) |
| Imprimir / Guardar PDF | Abre el diálogo de impresión del sistema, que también permite guardar como PDF |
| Plantillas | Ítems predefinidos reutilizables para agilizar la carga |
| Ajustes | Gestión del perfil del negocio y de la cuenta de usuario |

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

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /businessProfiles/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /quotes/{quoteId} {
      allow read, update, delete: if request.auth != null
        && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null
        && request.auth.uid == request.resource.data.userId;
    }

    match /templates/{templateId} {
      allow read, update, delete: if request.auth != null
        && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null
        && request.auth.uid == request.resource.data.userId;
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
│   │   ├── common/          # AppButton, AppInput, AppLoader, AppSnackbar, EmptyState
│   │   ├── quotes/          # QuoteCard, QuoteItemRow, QuoteStatusBadge, QuoteTotalsCard
│   │   └── templates/       # TemplateItemRow
│   ├── context/             # AuthContext, BusinessContext, AppContext
│   ├── data/                # defaultTemplates (plantillas predefinidas)
│   ├── hooks/               # useBusiness, useQuotes, useTemplates
│   ├── navigation/          # AppNavigator, AppTabNavigator, AuthNavigator
│   ├── screens/             # Pantallas agrupadas por módulo
│   │   ├── auth/            # Login, Register, ForgotPassword
│   │   ├── history/         # HistoryScreen
│   │   ├── home/            # HomeScreen
│   │   ├── onboarding/      # BusinessSetupScreen
│   │   ├── quotes/          # QuoteDetailScreen, QuoteFormScreen
│   │   └── settings/        # Settings, BusinessProfile, Account, Templates
│   ├── services/            # Lógica de Firebase y funciones de negocio
│   │   ├── auth.service.js
│   │   ├── business.service.js
│   │   ├── pdf.service.js   # Generación, compartición e impresión de PDF
│   │   ├── quotes.service.js
│   │   ├── storage.service.js
│   │   └── templates.service.js
│   ├── theme/               # Colores y tema Material Design
│   └── utils/               # Constantes, formateadores, plantilla HTML del PDF
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
