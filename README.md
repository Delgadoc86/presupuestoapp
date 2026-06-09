# PresúFácil

**Aplicación móvil para crear, gestionar y compartir presupuestos profesionales.**  
Diseñada para autónomos y pequeños negocios que necesitan emitir presupuestos rápido, desde el celular y sin complicaciones.

---

## Descripción

PresúFácil permite a cualquier negocio o profesional independiente:

- Crear presupuestos detallados en segundos
- Gestionar el estado de cada presupuesto (borrador, enviado, aceptado, rechazado, pagado)
- Compartir el presupuesto en PDF directamente desde el celular
- Enviar el presupuesto por WhatsApp con un mensaje profesional pre-armado
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
| Compartir PDF | Genera un PDF profesional y lo comparte desde el dispositivo |
| Enviar por WhatsApp | Abre WhatsApp con un mensaje profesional pre-armado |
| Plantillas | Ítems predefinidos reutilizables para agilizar la carga |
| Ajustes | Gestión del perfil del negocio y de la cuenta de usuario |

---

## Tecnologías utilizadas

- **React Native** + **Expo SDK 54** (compatible con Expo Go)
- **Firebase Auth** — autenticación de usuarios
- **Cloud Firestore** — base de datos en tiempo real
- **Firebase Storage** — almacenamiento del logo del negocio
- **React Navigation v7** — navegación entre pantallas
- **React Native Paper** — componentes de interfaz Material Design
- **expo-print** + **expo-sharing** — generación y compartición de PDF

---

## Requisitos del entorno de desarrollo

- Node.js 20 o superior
- npm 10 o superior
- Expo CLI (`npm install -g expo-cli`)
- Cuenta de Firebase con proyecto configurado

---

## Instalación y configuración

```bash
# 1. Clonar el repositorio
git clone https://github.com/delgadoc86/presufacil.git
cd presufacil

# 2. Instalar dependencias
npm install

# 3. Configurar Firebase (ver sección siguiente)

# 4. Iniciar la app
npx expo start -c
```

### Configurar Firebase

Crear el archivo `firebase.config.js` en la raíz con los datos de tu proyecto Firebase:

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

> **Importante:** nunca subas `firebase.config.js` con credenciales reales a un repositorio público. Está incluido en `.gitignore`.

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
      allow read, write: if request.auth != null
        && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null
        && request.auth.uid == request.resource.data.userId;
    }

    match /templates/{templateId} {
      allow read, write: if request.auth != null
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
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## Permisos solicitados en Android

| Permiso | Motivo |
|---|---|
| `READ_EXTERNAL_STORAGE` / `READ_MEDIA_IMAGES` | Seleccionar el logo del negocio desde la galería |
| `INTERNET` | Sincronización con Firebase (autenticación, datos y archivos) |

La app **no solicita** acceso a la cámara, ubicación, contactos, micrófono ni ningún otro permiso sensible.

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
presufacil/
├── assets/                  # Íconos y recursos visuales
├── src/
│   ├── components/          # Componentes reutilizables
│   │   ├── common/          # AppButton, AppInput, AppLoader, AppSnackbar
│   │   ├── quotes/          # QuoteCard, QuoteItemRow, QuoteTotalsCard, etc.
│   │   └── templates/       # TemplateItemRow
│   ├── context/             # AuthContext, BusinessContext, AppContext
│   ├── hooks/               # useBusiness, useQuotes, useTemplates
│   ├── navigation/          # AppNavigator, AppTabNavigator, AuthNavigator
│   ├── screens/             # Todas las pantallas agrupadas por módulo
│   ├── services/            # Lógica de Firebase (auth, business, quotes, storage, pdf)
│   ├── theme/               # Colores y tema de Material Design
│   └── utils/               # Constantes, formateadores, plantilla HTML del PDF
├── App.js                   # Punto de entrada
├── firebase.config.js       # Configuración Firebase (no incluida en el repo)
├── babel.config.js
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
**Repositorio:** github.com/delgadoc86/presufacil
