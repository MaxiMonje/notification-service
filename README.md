# 🔔 Notification MS

Microservicio de **notificaciones** (email-first) que actúa como **intermediario** entre tus apps (ej.: _turnos_) y tu **mail-service**.  
Usa **BullMQ + Redis** para encolar trabajos, reintentos con _exponential backoff_ y **programar envíos** con `scheduleAt`.

---

## ✨ Características

- API simple: `POST /api/notifications/email`
- **Colas** con BullMQ (Redis)
- **Reintentos** con _exponential backoff_
- **Programación** de envíos (`scheduleAt` ISO/Epoch)
- **Consulta de estado** del job
- **API Key** (`X-API-Key`) entre servicios
- Lista para extender a WhatsApp/SMS/Push

---

## 🧱 Arquitectura

```
[Your App (Turnos, etc)]
        │  POST /api/notifications/email
        ▼
[Notification-MS]  --(jobs)-->  [Redis]
        │
        └── Worker (email) ──► [Mail-Service] ──► Proveedor real (SMTP/SES/Sendgrid)
```

- Este MS **no envía mails directamente**: delega en tu **mail-service**.
- Redis es **requerido** (Docker recomendado).

---

## 📁 Estructura

```
src/
  controllers/
    notifications.controller.ts     # Encola el email (delay/retries)
  routes/
    notifications.routes.ts         # Endpoints (POST email, GET estado)
  services/
    mailClient.ts                   # Cliente HTTP al mail-service
  validations/
    notifications.schema.ts         # Zod: validación del request
  queue/
    connection.ts                   # Conexión BullMQ
    email.queue.ts                  # Cola "email-queue"
  workers/
    email.worker.ts                 # Worker que procesa los jobs
  server.ts                         # Bootstrap (API + worker)
```

---

## ⚙️ Variables de entorno

Crea `.env`:

```env
# Server
PORT=4010

# Seguridad (API Key entre servicios)
API_KEY_NOTIF=super-secret-key

# Redis (si mapeaste 6380:6379 en Docker)
REDIS_HOST=127.0.0.1
REDIS_PORT=6380
REDIS_PASSWORD=

# Cola
QUEUE_ATTEMPTS=5
QUEUE_BACKOFF_MS=15000

# Mail service (tu propio MS)
MAIL_SERVICE_BASE_URL=http://localhost:3010/api/mail/send
MAIL_SERVICE_API_KEY=mail-service-key   # si tu mail-ms no usa API key, borrá esta línea

# Remitente por defecto
DEFAULT_FROM_NAME=ReservOZ Notifier
DEFAULT_FROM_EMAIL=no-reply@reservoz.local
```

---

## 🐳 Redis con Docker

`docker-compose.yml` mínimo:

```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6380:6379" # host:container (ajusta si 6379 está libre)
    command: ["redis-server", "--save", "60", "1", "--loglevel", "warning"]
    restart: unless-stopped
```

**Arrancar:**

```bash
docker compose up -d
```

---

## 🚀 Instalación & ejecución

```bash
# deps principales (si faltan)
npm i express cors dotenv axios zod bullmq ioredis dayjs
npm i -D typescript ts-node-dev @types/node @types/express @types/cors

# dev
npm run dev

# build + start
npm run build && npm start
```

Deberías ver:

```
[notification-ms] listening on http://localhost:4010
```

---

## 🔌 API

### 1) Encolar email

`POST /api/notifications/email`

**Headers**

- `Content-Type: application/json`
- `X-API-Key: super-secret-key`

**Body (uno de `html` o `text` es obligatorio):**

```json
{
  "app": "turnos",
  "to": "cliente@example.com",
  "subject": "Turno confirmado",
  "html": "<h2>Hola {{name}}</h2><p>Tu turno es el {{date}} a las {{time}}.</p>",
  "metadata": { "appointmentId": 123, "serviceId": 1, "userId": 42 },

  "scheduleAt": "2025-10-10T18:30:00.000Z" // opcional (ISO o epoch ms). Si no, envía ahora.
}
```

**Respuesta (202)**

```json
{
  "status": "queued", // "scheduled" si tiene delay
  "jobId": "7",
  "queue": "email-queue",
  "delayMs": 0
}
```

> **Reintentos**: `QUEUE_ATTEMPTS` y `QUEUE_BACKOFF_MS` (exponencial).  
> **Idempotencia (opcional)**: podés incluir un `dedupKey` y usarlo como `jobId` (ver Roadmap).

---

### 2) Estado de un job

`GET /api/notifications/job/:id`

**Headers**

- `X-API-Key: super-secret-key`

**Respuesta**

```json
{
  "id": "7",
  "state": "completed", // failed | delayed | active | waiting ...
  "attemptsMade": 1,
  "returnvalue": {
    "provider": "mail-service",
    "result": { "messageId": "<...>" }
  },
  "failedReason": null
}
```

---

## 🧪 Ejemplos rápidos

**cURL (inmediato)**

```bash
curl -X POST http://localhost:4010/api/notifications/email   -H "Content-Type: application/json"   -H "X-API-Key: super-secret-key"   -d '{
    "app":"turnos",
    "to":"cliente@example.com",
    "subject":"Turno confirmado",
    "text":"Hola! Tu turno es mañana a las 15:30."
  }'
```

**cURL (programado)**

```bash
curl -X POST "http://localhost:4010/api/notifications/email"   -H "Content-Type: application/json"   -H "X-API-Key: super-secret-key"   -d '{
    "app":"turnos",
    "to":"cliente@example.com",
    "subject":"Recordatorio",
    "text":"Te esperamos mañana 15:30.",
    "scheduleAt":"2025-10-10T18:30:00.000Z"
  }'
```

**Estado**

```bash
curl -H "X-API-Key: super-secret-key"   http://localhost:4010/api/notifications/job/<jobId>
```

---

## 🔐 Seguridad

- API Key obligatoria vía header `X-API-Key` (coincide con `API_KEY_NOTIF`).
- Recomendado detrás de API Gateway y/o _rate limiting_ si se expone públicamente.

---

## 🧰 Troubleshooting

- **`ECONNREFUSED` a Redis** → asegurá Docker/Redis arriba y puerto correcto (`REDIS_PORT`).
- **`401 Unauthorized`** → falta/incorrecta `X-API-Key`.
- **Job no avanza** → verificá logs del worker (deberían verse eventos `completed/failed`).
- **Mail falla** → revisá logs del **mail-service** y `MAIL_SERVICE_BASE_URL`.

---
