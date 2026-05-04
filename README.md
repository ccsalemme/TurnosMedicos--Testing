# Turnos Medicos - MVP Full Stack

MVP robusto de gestion de turnos medicos para clinica con tres roles:
- Paciente
- Medico
- Administrador

Implementa autenticacion, RBAC, agenda medica, reglas de negocio reales de turnos, paneles por rol, catalogos operativos y auditoria basica.

## 1. Stack tecnico

- Frontend: React + TypeScript + Vite
- Backend: Node.js + TypeScript + NestJS
- Base de datos: PostgreSQL
- ORM: Prisma
- Seguridad: JWT + hash bcrypt + validaciones DTO

## 2. Funcionalidades incluidas

- Autenticacion y autorizacion por roles
- Gestion de usuarios y roles (admin)
- Gestion de especialidades medicas
- Agenda y disponibilidad medica
- Bloqueos de agenda (ausencias/indisponibilidad)
- Reserva, cancelacion y reprogramacion de turnos
- Estados de turno: `PENDING`, `CONFIRMED`, `CANCELED`, `COMPLETED`, `NO_SHOW`
- Paneles por rol (paciente, medico, admin)
- Configuracion operativa basica (ej. ventana de cancelacion)
- Auditoria de acciones criticas

## 3. Reglas de negocio implementadas

1. No solapamiento de turnos para un mismo medico.
2. No doble reserva para paciente en la misma franja horaria.
3. Cancelacion permitida solo dentro de ventana configurable (`CANCELLATION_WINDOW_HOURS`).
4. Reprogramacion validando disponibilidad real y bloqueos.
5. Estado `NO_SHOW` para inasistencias.
6. Duracion variable de turno por especialidad (`durationMinutes`).
7. Reservas limitadas por agenda activa y bloqueos.
8. Auditoria basica de operaciones criticas.

## 4. Seguridad aplicada (modo MVP serio)

- Login por email + password
- Password hash con bcrypt (salt rounds 12)
- JWT simple para sesion
- Guards de autenticacion y roles (RBAC)
- Validacion DTO en backend (`ValidationPipe` global)
- Sanitizacion basica de payloads
- Filtro global de errores con respuesta consistente
- Restriccion de acceso a recursos propios por rol

## 5. Arquitectura

### Backend (NestJS modular)

- `src/modules/auth`: login, registro paciente, `me`
- `src/modules/users`: perfil propio
- `src/modules/specialties`: especialidades
- `src/modules/doctors`: alta/edicion/listado de medicos
- `src/modules/availability`: agenda semanal y bloqueos
- `src/modules/appointments`: reserva/cancelacion/reprogramacion/estados
- `src/modules/admin`: usuarios, roles, sedes, settings, tablero
- `src/modules/audit`: consulta y registro de auditoria
- `src/common`: guards, decorators, enums, filtros, interceptores, utilidades
- `src/prisma`: servicio Prisma y modulo global

Reglas de negocio y validaciones centrales viven en `services`, no en controllers.

### Frontend (React por features)

- `src/features/auth`: login y registro
- `src/features/patient`: panel paciente
- `src/features/doctor`: panel medico
- `src/features/admin`: panel admin
- `src/context/AuthContext.tsx`: sesion y usuario
- `src/lib/api.ts`: cliente REST centralizado
- `src/components/ProtectedRoute.tsx`: rutas protegidas por rol
- `src/components/layout/AppShell.tsx`: shell visual por rol

## 6. Estructura de carpetas

```text
.
|-- backend/
|   |-- prisma/
|   |   |-- migrations/202605040001_init/migration.sql
|   |   |-- schema.prisma
|   |   `-- seed.ts
|   |-- src/
|   |   |-- app.module.ts
|   |   |-- main.ts
|   |   |-- common/
|   |   |-- config/
|   |   |-- modules/
|   |   `-- prisma/
|   |-- .env.example
|   |-- package.json
|   `-- tsconfig*.json
|-- frontend/
|   |-- src/
|   |   |-- App.tsx
|   |   |-- main.tsx
|   |   |-- styles.css
|   |   |-- components/
|   |   |-- context/
|   |   |-- features/
|   |   |-- lib/
|   |   `-- types/
|   |-- .env.example
|   |-- package.json
|   `-- tsconfig*.json
|-- .gitignore
|-- package.json
`-- README.md
```

## 7. Modelo de datos del dominio

Modelos principales en Prisma:
- `User`
- `PatientProfile`
- `DoctorProfile`
- `Specialty`
- `ClinicSite`
- `Availability`
- `ScheduleBlock`
- `Appointment`
- `SystemSetting`
- `AuditLog`

Datos obligatorios de paciente incluidos:
- Nombre y apellido
- Documento
- Fecha de nacimiento
- Telefono
- Email (en `User`)

## 8. Concurrencia e integridad

Se aplica doble nivel de proteccion:

1. Logica transaccional en servicios (`Serializable`) para reserva y reprogramacion.
2. Restricciones SQL de base de datos:
   - `EXCLUDE` por medico + rango temporal (estado activo)
   - `EXCLUDE` por paciente + rango temporal (estado activo)

Con esto se evita:
- Dos usuarios tomando el mismo slot en paralelo.
- Reprogramaciones conflictivas simultaneas.

## 9. Requisitos previos

- Node.js 20+
- npm 10+
- PostgreSQL 15+ (solo si usas modo con base de datos)

## 10. Instalacion

Desde raiz del proyecto:

```bash
npm run install:all
```

### Nota para maquina corporativa (Windows)

Si PowerShell bloquea `npm` por politicas de ejecucion, usar Git Bash.

En Git Bash (recomendado):

```bash
cd /c/Users/L66760/OneDrive\ -\ Kimberly-Clark/Documents/UADE/TurnosMedicos-\ Testing
npm run install:all
```

En PowerShell (alternativa):

```powershell
npm.cmd run install:all
```

## 11. Configuracion

### Backend

1. Copiar `backend/.env.example` a `backend/.env`.
2. Modo provisional sin DB: dejar `MOCK_MODE=true`.
3. Modo con DB real: usar `MOCK_MODE=false` y ajustar `DATABASE_URL`.
4. Ajustar `JWT_SECRET`, `CORS_ORIGIN`.

### Frontend

1. Copiar `frontend/.env.example` a `frontend/.env`.
2. Ajustar `VITE_API_BASE_URL` si corresponde.

## 12. Migraciones y seed

Este paso aplica solo para modo con base de datos (`MOCK_MODE=false`).

### Opcion recomendada (Prisma)

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
npm run db:seed
```

### Opcion SQL directa

Si preferis aplicar SQL manual:

```bash
cd backend
psql -U postgres -d turnos_medicos -f prisma/migrations/202605040001_init/migration.sql
```

Luego ejecutar seed:

```bash
npm run db:seed
```

### Nota por entorno corporativo

Si `prisma generate` falla por certificados (`self-signed certificate in certificate chain`), configurar CA corporativa para Node.
Como salida temporal de desarrollo local (no recomendada en produccion):

```powershell
$env:NODE_TLS_REJECT_UNAUTHORIZED='0'
npm run prisma:generate
```

En Git Bash:

```bash
export NODE_TLS_REJECT_UNAUTHORIZED=0
npm run prisma:generate
```

## 13. Ejecucion local

En maquina corporativa, ejecutar estos comandos en Git Bash:

Terminal 1 (backend):

```bash
npm run dev:backend
```

Terminal 2 (frontend):

```bash
npm run dev:frontend
```

- Backend: `http://localhost:3000/api/v1`
- Frontend: `http://localhost:5173`

Con `MOCK_MODE=true`, el backend funciona con usuarios y datos hardcodeados en memoria, sin PostgreSQL ni Prisma.

## 14. Credenciales demo del seed

- Admin: `admin@clinica.local` / `Admin123!`
- Medico: `doctor1@clinica.local` / `Doctor123!`
- Medico: `doctor2@clinica.local` / `Doctor123!`
- Medico: `doctor3@clinica.local` / `Doctor123!`
- Paciente: `paciente@clinica.local` / `Paciente123!`
- Paciente: `paciente2@clinica.local` / `Paciente123!`
- Paciente: `paciente3@clinica.local` / `Paciente123!`

## 15. API REST y contratos

Formato de respuesta:

```json
{
  "success": true,
  "data": { "...": "..." },
  "timestamp": "2026-05-04T00:00:00.000Z",
  "path": "/api/v1/..."
}
```

Formato de error:

```json
{
  "success": false,
  "error": {
    "status": 400,
    "message": "Mensaje de error",
    "details": {}
  },
  "timestamp": "2026-05-04T00:00:00.000Z",
  "path": "/api/v1/..."
}
```

### 15.1 Auth

Endpoint: `POST /api/v1/auth/register`
- Rol: Publico
- Request: `firstName`, `lastName`, `email`, `password`, `document`, `birthDate`, `phone`
- Response: `accessToken`, `user`
- Errores: `400` validacion, email/documento duplicado

Endpoint: `POST /api/v1/auth/login`
- Rol: Publico
- Request: `email`, `password`
- Response: `accessToken`, `user`
- Errores: `401` credenciales invalidas

Endpoint: `GET /api/v1/auth/me`
- Rol: Autenticado
- Request: Header `Authorization: Bearer <token>`
- Response: `user`
- Errores: `401` token invalido

### 15.2 Usuarios y perfiles

Endpoint: `GET /api/v1/users/me`
- Rol: Autenticado
- Request: JWT
- Response: perfil propio
- Errores: `401`, `404`

Endpoint: `PATCH /api/v1/users/me`
- Rol: Autenticado
- Request: `firstName?`, `lastName?`, `phone?`, `birthDate?`
- Response: perfil actualizado
- Errores: `400`, `401`, `404`

### 15.3 Especialidades y medicos

Endpoint: `GET /api/v1/specialties`
- Rol: Publico
- Request: sin body
- Response: especialidades activas
- Errores: `500`

Endpoint: `GET /api/v1/specialties/admin/all`
- Rol: ADMIN
- Request: JWT
- Response: todas las especialidades
- Errores: `401`, `403`

Endpoint: `POST /api/v1/specialties`
- Rol: ADMIN
- Request: `name`, `description?`, `durationMinutes`, `isActive?`
- Response: especialidad creada
- Errores: `400`, `401`, `403`

Endpoint: `PATCH /api/v1/specialties/:id`
- Rol: ADMIN
- Request: campos parciales
- Response: especialidad actualizada
- Errores: `400`, `401`, `403`, `404`

Endpoint: `GET /api/v1/doctors`
- Rol: Publico
- Request: query `specialtyId?`, `siteId?`
- Response: listado de medicos
- Errores: `500`

Endpoint: `POST /api/v1/doctors`
- Rol: ADMIN
- Request: datos medico + `specialtyIds[]`
- Response: medico creado
- Errores: `400`, `401`, `403`

Endpoint: `PATCH /api/v1/doctors/:doctorId`
- Rol: ADMIN
- Request: campos parciales medico
- Response: medico actualizado
- Errores: `400`, `401`, `403`, `404`

### 15.4 Agenda y bloqueos

Endpoint: `GET /api/v1/availability/doctor/:doctorUserId`
- Rol: Publico
- Request: query `from?`, `to?`
- Response: `{ availabilities, blocks }`
- Errores: `404`

Endpoint: `POST /api/v1/availability/slots`
- Rol: DOCTOR, ADMIN
- Request: `weekday`, `startTime`, `endTime`, `doctorUserId?`
- Response: disponibilidad creada
- Errores: `400`, `401`, `403`, `404`

Endpoint: `PATCH /api/v1/availability/slots/:availabilityId`
- Rol: DOCTOR, ADMIN
- Request: campos parciales
- Response: disponibilidad actualizada
- Errores: `400`, `401`, `403`, `404`

Endpoint: `DELETE /api/v1/availability/slots/:availabilityId`
- Rol: DOCTOR, ADMIN
- Request: JWT
- Response: `{ deleted: true }`
- Errores: `401`, `403`, `404`

Endpoint: `POST /api/v1/availability/blocks`
- Rol: DOCTOR, ADMIN
- Request: `startAt`, `endAt`, `reason?`, `doctorUserId?`
- Response: bloqueo creado
- Errores: `400`, `401`, `403`, `404`

Endpoint: `DELETE /api/v1/availability/blocks/:blockId`
- Rol: DOCTOR, ADMIN
- Request: JWT
- Response: `{ deleted: true }`
- Errores: `401`, `403`, `404`

### 15.5 Turnos

Endpoint: `POST /api/v1/appointments/reserve`
- Rol: PATIENT
- Request: `doctorId`, `specialtyId`, `siteId`, `startAt`, `notes?`
- Response: turno creado
- Errores: `400`, `401`, `403`, `404`, `409`

Endpoint: `GET /api/v1/appointments/my`
- Rol: Autenticado
- Request: query `status?`, `from?`, `to?`
- Response: turnos segun rol actual
- Errores: `401`

Endpoint: `GET /api/v1/appointments/admin/board`
- Rol: ADMIN
- Request: filtros opcionales
- Response: tablero operativo de turnos
- Errores: `401`, `403`

Endpoint: `PATCH /api/v1/appointments/:appointmentId/cancel`
- Rol: PATIENT (propio), ADMIN
- Request: `reason?`
- Response: turno actualizado a `CANCELED`
- Errores: `400`, `401`, `403`, `404`

Endpoint: `PATCH /api/v1/appointments/:appointmentId/reschedule`
- Rol: PATIENT (propio), ADMIN
- Request: `newStartAt`
- Response: turno reprogramado
- Errores: `400`, `401`, `403`, `404`, `409`

Endpoint: `PATCH /api/v1/appointments/:appointmentId/confirm`
- Rol: DOCTOR (propio), ADMIN
- Request: JWT
- Response: turno `CONFIRMED`
- Errores: `400`, `401`, `403`, `404`

Endpoint: `PATCH /api/v1/appointments/:appointmentId/complete`
- Rol: DOCTOR (propio), ADMIN
- Request: JWT
- Response: turno `COMPLETED`
- Errores: `400`, `401`, `403`, `404`

Endpoint: `PATCH /api/v1/appointments/:appointmentId/no-show`
- Rol: DOCTOR (propio), ADMIN
- Request: JWT
- Response: turno `NO_SHOW`
- Errores: `400`, `401`, `403`, `404`

### 15.6 Administracion

Endpoint: `GET /api/v1/admin/users`
- Rol: ADMIN
- Request: query `role?`
- Response: usuarios con perfiles
- Errores: `401`, `403`

Endpoint: `PATCH /api/v1/admin/users/:userId/role`
- Rol: ADMIN
- Request: `role`, `isActive?`
- Response: usuario actualizado
- Errores: `400`, `401`, `403`, `404`

Endpoint: `GET /api/v1/admin/sites`
- Rol: ADMIN
- Request: JWT
- Response: sedes
- Errores: `401`, `403`

Endpoint: `POST /api/v1/admin/sites`
- Rol: ADMIN
- Request: `name`, `address`, `isActive?`
- Response: sede creada
- Errores: `400`, `401`, `403`

Endpoint: `PATCH /api/v1/admin/sites/:siteId`
- Rol: ADMIN
- Request: campos parciales
- Response: sede actualizada
- Errores: `400`, `401`, `403`, `404`

Endpoint: `GET /api/v1/admin/settings`
- Rol: ADMIN
- Request: JWT
- Response: configuraciones
- Errores: `401`, `403`

Endpoint: `PUT /api/v1/admin/settings/:key`
- Rol: ADMIN
- Request: `value`
- Response: setting actualizado
- Errores: `400`, `401`, `403`

Endpoint: `GET /api/v1/admin/dashboard`
- Rol: ADMIN
- Request: JWT
- Response: contadores + proximos turnos
- Errores: `401`, `403`

### 15.7 Auditoria

Endpoint: `GET /api/v1/audit`
- Rol: ADMIN
- Request: filtros `action?`, `entity?`, `actorId?`, `from?`, `to?`
- Response: eventos de auditoria
- Errores: `401`, `403`

## 16. Decisiones de arquitectura

1. Monorepo npm workspaces para separar frontend/backend y compartir ciclo de desarrollo.
2. Prisma + PostgreSQL por velocidad de desarrollo y consistencia de esquema.
3. Services con reglas de negocio y controllers delgados.
4. Respuesta estandar con interceptor + filtro global de errores.
5. Cliente REST frontend centralizado para manejo consistente de token y errores.
6. RBAC declarativo con `@Roles` + `JwtAuthGuard` + `RolesGuard`.

## 17. Supuestos de negocio documentados

1. Zona horaria: se asume timezone unica de clinica para agenda.
2. Reserva de turno se habilita solo para pacientes autenticados.
3. Reprogramacion vuelve el estado a `PENDING` para revalidacion operativa.
4. Un medico puede pertenecer a una sede principal (`siteId`) para MVP.
5. Agenda semanal por franjas `weekday/startTime/endTime`.

## 18. Restriccion solicitada

No se implementaron pruebas automaticas ni plan de testing en esta entrega.
La arquitectura fue dejada preparada para agregar testing posteriormente.

## 19. Roadmap breve

1. Notificaciones asincronas (email/SMS/WhatsApp).
2. Vista calendario avanzada (drag and drop) por medico y sede.
3. Politicas mas ricas de disponibilidad (feriados globales por sede, cupos dinamicos).
4. Soporte multi-tenant para varias clinicas.
5. Endurecimiento de seguridad (rotacion JWT, refresh token, rate limiting, 2FA opcional).
