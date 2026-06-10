# Manual de usuario — PresúFácil

**Tu app para crear presupuestos profesionales desde el celular.**

---

## Índice

1. [¿Qué es PresúFácil?](#1-qué-es-presúfácil)
2. [Crear una cuenta](#2-crear-una-cuenta)
3. [Iniciar sesión](#3-iniciar-sesión)
4. [Configurar tu negocio](#4-configurar-tu-negocio)
5. [Pantalla de inicio](#5-pantalla-de-inicio)
6. [Crear un presupuesto](#6-crear-un-presupuesto)
7. [Ver el detalle de un presupuesto](#7-ver-el-detalle-de-un-presupuesto)
8. [Cambiar el estado de un presupuesto](#8-cambiar-el-estado-de-un-presupuesto)
9. [Compartir el presupuesto en PDF](#9-compartir-el-presupuesto-en-pdf)
10. [Enviar por WhatsApp](#10-enviar-por-whatsapp)
11. [Editar o eliminar un presupuesto](#11-editar-o-eliminar-un-presupuesto)
12. [Historial de presupuestos](#12-historial-de-presupuestos)
13. [Plantillas de ítems](#13-plantillas-de-ítems)
14. [Ajustes y perfil del negocio](#14-ajustes-y-perfil-del-negocio)
15. [Gestión de tu cuenta](#15-gestión-de-tu-cuenta) — cerrar sesión, eliminar cuenta
16. [Preguntas frecuentes](#16-preguntas-frecuentes)

---

## 1. ¿Qué es PresúFácil?

PresúFácil es una aplicación móvil para Android que te permite crear presupuestos profesionales en segundos. Ideal para:

- Plomeros, electricistas, carpinteros y otros oficios
- Diseñadores, fotógrafos y creativos independientes
- Cualquier negocio o profesional que necesite enviar presupuestos a sus clientes

Con PresúFácil podés:

- Armar un presupuesto completo en menos de 2 minutos
- Enviarlo como PDF o por WhatsApp al cliente
- Hacer seguimiento del estado de cada presupuesto
- Reutilizar tus servicios más frecuentes con plantillas

---

## 2. Crear una cuenta

Al abrir la app por primera vez vas a ver la pantalla de inicio de sesión.

**Pasos:**

1. Tocá **"Crear cuenta"**
2. Ingresá tu **dirección de email**
3. Elegí una **contraseña** (mínimo 6 caracteres)
4. Tocá **"Registrarme"**

Tu cuenta se crea de forma segura con Firebase Authentication. Nunca compartimos tu email con nadie.

---

## 3. Iniciar sesión

Si ya tenés una cuenta:

1. Ingresá tu **email**
2. Ingresá tu **contraseña**
3. Tocá **"Iniciar sesión"**

**¿Olvidaste tu contraseña?**

1. Tocá **"¿Olvidaste tu contraseña?"**
2. Ingresá tu email
3. Tocá **"Enviar link"**
4. Revisá tu casilla de email y seguí las instrucciones

---

## 4. Configurar tu negocio

La primera vez que iniciás sesión, la app te pide que configures el perfil de tu negocio. Esta información aparecerá en todos tus presupuestos.

**Campos disponibles:**

| Campo | Obligatorio | Descripción |
|---|---|---|
| Nombre del negocio | Sí | El nombre que verán tus clientes |
| Rubro / Actividad | Sí | Por ej.: Electricidad, Diseño Gráfico, Plomería |
| WhatsApp | Sí | Número de contacto principal |
| Email | No | Email de contacto del negocio |
| Dirección | No | Domicilio o zona de trabajo |
| CUIT | No | Para presupuestos formales |
| Condiciones generales | No | Texto que aparece al pie de cada presupuesto |
| Logo | No | Imagen cuadrada del logo (se recorta automáticamente) |
| Validez del presupuesto | No | Cantidad de días que es válido (por defecto: 30) |

**Para subir el logo:**
1. Tocá el ícono de cámara sobre el logo
2. Se abre tu galería
3. Seleccioná la imagen
4. Recortala si es necesario
5. Tocá **"Continuar"** para guardar

---

## 5. Pantalla de inicio

Luego del onboarding, llegás a la pantalla principal. Desde acá tenés acceso rápido a:

- **Nuevo presupuesto** — crear un presupuesto desde cero
- **Ver historial** — revisar todos tus presupuestos anteriores
- **Mis plantillas** — gestionar ítems predefinidos
- **Mi negocio** — editar el perfil de tu negocio

En la parte superior se muestra el nombre de tu negocio.

---

## 6. Crear un presupuesto

Tocá **"Nuevo presupuesto"** desde el inicio o desde el botón + de la barra inferior.

### Datos del cliente

Completá los datos del cliente al que le vas a enviar el presupuesto:

- **Nombre** *(obligatorio)*
- **Teléfono** *(obligatorio)* — se usa para enviar por WhatsApp
- **Email** *(opcional)*

### Agregar ítems

Los ítems son los productos o servicios que incluís en el presupuesto.

**Para agregar un ítem:**
1. Tocá **"Agregar ítem"**
2. Describí el servicio o producto
3. Ingresá la cantidad
4. Ingresá el precio unitario
5. El subtotal se calcula automáticamente

Podés agregar tantos ítems como necesites. Para eliminar uno, tocá el ícono de basura al costado.

**¿Tenés plantillas guardadas?**
Tocá **"Usar plantilla"** para cargar ítems predefinidos de una sola vez (ver sección 13).

### Totales y descuentos

En la sección **Totales** podés configurar:

- **Descuento:** ingresá el importe o porcentaje a descontar
  - Tocá el botón **"$"** para descuento fijo en pesos
  - Tocá el botón **"%"** para descuento porcentual
- **Anticipo:** si el cliente ya pagó algo a cuenta, ingresalo acá. La app calcula el saldo pendiente

### Notas

En la sección **Notas** podés agregar aclaraciones para el cliente (condiciones especiales, materiales incluidos, etc.). Este campo es opcional.

### Guardar

Tocá **"Crear presupuesto"** para guardar. La app te lleva automáticamente al detalle del presupuesto recién creado.

> **Para crear otro presupuesto:** presioná la flecha "Atrás" desde el detalle o tocá la pestaña **"Presupuesto"** en la barra inferior. El formulario estará vacío y listo para el siguiente cliente.

---

## 7. Ver el detalle de un presupuesto

En la pantalla de detalle podés ver toda la información del presupuesto:

- Estado actual y fechas
- Datos del cliente
- Lista de ítems con subtotales
- Total, descuento, anticipo y saldo pendiente
- Datos del emisor (tu negocio al momento de crear)
- Notas

Desde esta pantalla también podés:
- Cambiar el estado
- Editar el presupuesto
- Compartir como PDF
- Enviar por WhatsApp
- Eliminar

---

## 8. Cambiar el estado de un presupuesto

Cada presupuesto puede estar en uno de estos estados:

| Estado | Significado |
|---|---|
| **Borrador** | Creado pero todavía no enviado al cliente |
| **Enviado** | El cliente ya lo recibió |
| **Aceptado** | El cliente confirmó que quiere continuar |
| **Rechazado** | El cliente no aceptó el presupuesto |
| **Pagado** | El trabajo fue abonado |

**Para cambiar el estado:**
1. Abrí el detalle del presupuesto
2. Tocá el botón **"Cambiar"** al lado del estado actual
3. Seleccioná el nuevo estado
4. Tocá **"Confirmar"**

---

## 9. Compartir el presupuesto en PDF

1. Abrí el detalle del presupuesto
2. Tocá **"Compartir PDF"**
3. La app genera el PDF automáticamente
4. Se abre el menú de compartir de tu teléfono
5. Elegí cómo compartirlo: Gmail, Drive, WhatsApp, etc.

El PDF incluye:
- Logo de tu negocio (si lo tenés cargado en el perfil)
- Datos de tu negocio (nombre, WhatsApp, email, dirección, CUIT)
- Datos del cliente
- Lista de ítems con subtotales
- Total, descuento y anticipo
- Notas y condiciones generales
- Fecha de validez
- Numeración de páginas en caso de presupuestos extensos

---

## 10. Enviar por WhatsApp

Esta función abre WhatsApp con un mensaje profesional ya armado que incluye:
- El nombre del cliente
- El número de presupuesto
- El total
- La fecha de validez

**Pasos:**
1. Abrí el detalle del presupuesto
2. Tocá el botón verde **"Enviar por WhatsApp"**
3. WhatsApp se abre con el mensaje pre-armado y el número del cliente ya cargado
4. Tocá enviar

> Necesitás tener WhatsApp instalado y que el cliente tenga número de teléfono cargado.

---

## 11. Editar o eliminar un presupuesto

### Editar

1. Abrí el detalle del presupuesto
2. Tocá el botón **"Editar"** (ícono de lápiz)
3. Modificá lo que necesites
4. Tocá **"Guardar cambios"**

### Eliminar

1. Abrí el detalle del presupuesto
2. Tocá el ícono de **basura** (arriba a la derecha)
3. Confirmá la eliminación en el diálogo

**Atención:** la eliminación es permanente y no se puede deshacer.

---

## 12. Historial de presupuestos

Tocá **"Ver historial"** desde el inicio o usá la pestaña de la barra inferior.

Acá vas a ver todos tus presupuestos ordenados por fecha. Podés:

- Buscar por nombre de cliente o número de presupuesto
- Ver el estado de cada uno con un color indicador
- Tocar cualquier presupuesto para ver su detalle

---

## 13. Plantillas de ítems

Las plantillas te permiten guardar conjuntos de ítems que usás frecuentemente para aplicarlos en un clic al crear un nuevo presupuesto.

### Crear una plantilla

1. Andá a **Ajustes → Mis plantillas**
2. Tocá el botón **"+"** o **"Nueva plantilla"**
3. Poné un nombre a la plantilla (por ej.: "Instalación eléctrica básica")
4. Agregá los ítems con nombre y precio por defecto
5. Tocá **"Guardar"**

### Usar una plantilla al crear un presupuesto

1. En la pantalla de nuevo presupuesto, tocá **"Usar plantilla"**
2. Se abre un listado con tus plantillas guardadas
3. Tocá la plantilla que querés aplicar
4. Los ítems se cargan automáticamente

Podés seguir modificando los ítems después de aplicar la plantilla.

### Editar o eliminar una plantilla

1. Andá a **Ajustes → Mis plantillas**
2. Tocá la plantilla que querés modificar
3. Hacé los cambios y guardá, o eliminá desde el menú

---

## 14. Ajustes y perfil del negocio

Desde la pestaña **"Ajustes"** podés acceder a:

### Perfil del negocio

Editá cualquier dato de tu negocio: nombre, logo, rubro, contacto, CUIT, condiciones generales y validez de los presupuestos.

Los cambios se guardan automáticamente en la nube. Los presupuestos ya creados **no** se modifican cuando cambiás el perfil (cada presupuesto guarda una foto del negocio al momento de crearlo).

### Mis plantillas

Gestioná tus plantillas de ítems (ver sección 13).

---

## 15. Gestión de tu cuenta

Desde **Ajustes → Cuenta** podés:

- Ver el email con el que te registraste
- Cambiar tu contraseña *(disponible próximamente)*
- Cerrar sesión
- Eliminar tu cuenta y todos tus datos

> También podés llegar a esta pantalla tocando el ícono de usuario (silueta) en la esquina superior derecha de la pantalla de inicio.

### Cerrar sesión

1. Andá a **Ajustes → Cuenta**
2. Tocá **"Cerrar sesión"**
3. Confirmá

Tus datos quedan guardados en la nube. La próxima vez que ingreses con tu email y contraseña, todo vuelve a aparecer.

### Eliminar cuenta

Esta acción borra permanentemente tu cuenta, negocio, presupuestos, plantillas y logo. **No se puede deshacer.**

1. Andá a **Ajustes → Cuenta**
2. En la sección **"Zona de peligro"**, tocá **"Eliminar cuenta"**
3. Leé el aviso y tocá **"Continuar"**
4. Confirmá tocando **"Eliminar definitivamente"**
5. Ingresá tu contraseña para verificar tu identidad
6. Tocá **"Eliminar"**

Una vez confirmada, todos tus datos se eliminan de forma permanente y la sesión se cierra automáticamente.

---

## 16. Preguntas frecuentes

**¿Mis datos se guardan si desinstalo la app?**
Sí. Todos tus presupuestos y datos de negocio se almacenan en la nube (Firebase). Al reinstalar la app e iniciar sesión, recuperás todo.

**¿Puedo usar la app sin internet?**
No. PresúFácil requiere conexión a internet para sincronizar los datos con la nube.

**¿Puedo tener más de un negocio?**
Por ahora cada cuenta tiene un solo perfil de negocio. Si tenés varios negocios, podés crear una cuenta de email distinta para cada uno.

**¿Mis clientes pueden ver mis presupuestos?**
No. Tus presupuestos son privados y solo vos podés verlos desde tu cuenta.

**¿El PDF se genera aunque no tenga internet?**
El PDF se genera desde los datos del presupuesto que están cargados en pantalla. Si el presupuesto ya está visible, se puede generar. Sin embargo, se necesita internet para compartirlo por algunas apps.

**¿Cómo elimino mi cuenta y todos mis datos?**
Podés hacerlo directamente desde la app: **Ajustes → Cuenta → Eliminar cuenta**. El proceso requiere confirmar tu contraseña por seguridad y elimina todo de forma inmediata e irreversible. Ver detalle en la sección 15.

**¿La app es gratuita?**
Sí, PresúFácil es gratuita.

---

## Soporte

¿Tenés algún problema o sugerencia?

**Email:** delgadocristian1986@gmail.com

Respondemos dentro de las 48 horas hábiles.

---

*PresúFácil — Copyright © 2026 Cristian Delgado. Todos los derechos reservados.*
