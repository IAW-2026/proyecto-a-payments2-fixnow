# 💳 FixNow - Payments App (Aplicación de Pagos y Liquidaciones)

### 1. Link al deploy de producción

**[🔗 Visitar FixNow Payments App en Producción](https://proyecto-a-payments2-fixnow.vercel.app/)**

---

### 2. Listado de usuarios disponibles para realizar pruebas

#### Autenticación en la Plataforma (Clerk)
- **Email:** `  payment+clerk_test@iaw.com`
- **Contraseña:** `iawuser#`

#### Autenticación en la Pasarela (Mercado Pago Sandbox)
> ⚠️ **Importante:** Al momento de ser redirigido a la pasarela, inicie sesión con las siguientes credenciales de prueba para actuar como comprador ficticio (no usar cuentas reales):
- **Email / Usuario:** `TESTUSER296946301990483714`
- **Contraseña:** `ezRTTYwmgo`

#### Tarjetas de Prueba (Mercado Pago Sandbox - Argentina)
- **Para pago EXITOSO (Aprobado):**
  - **Número de Tarjeta:** `4517 6601 2345 6789` | **F. Expiración:** Futura | **CVV:** `123` | **Titular:** `APRO`
- **Para pago RECHAZADO (Fondos insuficientes):**
  - **Número de Tarjeta:** `4517 6601 2345 6995` | **Titular:** `CONT`

---

### 3. Instrucciones para utilizar la aplicación

1. **Inicio de sesión:** Autentíquese en la plataforma utilizando las credenciales de Clerk provistas.
2. **Generación de la Preferencia:** En la interfaz de pagos pendientes, seleccione una orden. Al presionar pagar, se inicializará el registro en la base de datos local en estado `pending` y se generará el token de Mercado Pago.
3. **Simulación de Pago:** En la pasarela externa, inicie sesión con el usuario de prueba de Mercado Pago (se sugiere usar modo incógnito para evitar conflictos de sesión) y pague con la tarjeta `APRO`.
4. **Procesamiento de Webhook:** Al finalizar, Mercado Pago enviará una notificación asíncrona HTTP `POST` a nuestro servidor en producción. El webhook validará el evento, actualizará el registro local a estado `paid` y estampará la marca de tiempo de auditoría. La interfaz web se actualizará automáticamente mostrando la transacción cobrada.

---

### 4. Descripción del proyecto

FixNow es una plataforma integral diseñada para organizar, transparentar y facilitar la contratación de servicios de mantenimiento para el hogar (plomería, electricidad y gas). Dentro de este ecosistema, la **Payments App** actúa como la pasarela financiera centralizada encargada de gestionar de forma segura todo el ciclo de facturación, cobro y posterior liquidación de transacciones.

Cuando una solicitud de servicio se da por finalizada, la aplicación toma el control integrando de forma nativa la API de **Mercado Pago (Checkout Pro)**. Esto permite procesar pagos electrónicos de clientes mediante múltiples medios de pago en un entorno seguro y aislado.

La aplicación calcula de forma automática y atómica la comisión correspondiente para la plataforma, registra las marcas de tiempo de auditoría y actualiza el estado de los trabajos mediante el uso de **Webhooks**, garantizando la consistencia eventual y la trazabilidad financiera de todo el sistema.

---

### 5. Notas

- **Arquitectura de Webhooks en Producción:** Se eliminó por completo el uso de túneles locales (Ngrok), migrando la lógica de escucha a una infraestructura 100% nativa en la nube bajo la ruta de producción `/api/payments/webhook`, garantizando disponibilidad absoluta para las respuestas asíncronas de Mercado Pago.
- **Auditoría de Datos:** El modelo incluye campos de control estricto: `createdAt` (inicio del trámite pendiente) y `updatedAt` (modificación milimétrica ante cambios de estado). La convivencia de `updatedAt` junto al campo `paid_at` de Mercado Pago permite contrastar técnicamente los tiempos de respuesta del servidor frente a la acreditación externa de fondos.
- **Datos Precargados:** La base de datos cuenta con un historial extenso de transacciones registradas, permitiendo evaluar la ordenación cronológica descendente, estados de cuenta analíticos y filtros de búsqueda sobre datos reales acumulados.