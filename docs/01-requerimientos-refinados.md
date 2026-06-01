# Requerimientos Refinados y Reglas de Negocio
## Sistema de Gestión de Turnos Médicos

**Proyecto:** TurnosMédicos  
**Versión:** 1.0  
**Fecha:** Junio 2026  
**Equipo:**
- Product Owner: Lara Vitale
- Project Manager: Francisco Jarusz
- Testers: Pilar Jimena García, Manuel Vicente Figuerero
- Developer: Christian Carlos Salemme

---

## 1. Planteo del Problema

### 1.1 Contexto
Las clínicas y consultorios médicos medianos gestionan sus turnos de forma manual o con herramientas genéricas (planillas Excel, WhatsApp), lo que genera:
- Doble booking y conflictos de horario
- Falta de visibilidad del historial de pacientes
- Cancelaciones sin aviso que dejan huecos no reasignados
- Dificultad para coordinar múltiples médicos y sedes

### 1.2 Solución propuesta
Aplicación web full-stack para gestión de turnos médicos con tres perfiles de usuario diferenciados (Paciente, Médico, Administrador), persistencia en archivo JSON local y API REST documentada.

---

## 2. Requerimientos Funcionales Refinados

### RF-01 — Autenticación y Autorización

| ID | Requerimiento | Prioridad |
|---|---|---|
| RF-01.1 | El sistema debe permitir el registro de nuevos pacientes con: nombre, apellido, DNI, fecha de nacimiento, teléfono, email y contraseña | Alta |
| RF-01.2 | El sistema debe permitir el inicio de sesión con email y contraseña para todos los roles | Alta |
| RF-01.3 | El sistema debe rechazar credenciales inválidas con mensaje de error apropiado | Alta |
| RF-01.4 | El sistema debe emitir un token JWT con expiración configurable (default: 8h) | Alta |
| RF-01.5 | El sistema debe cerrar sesión invalidando el token del cliente | Alta |
| RF-01.6 | El sistema debe proteger los endpoints según el rol del usuario (PATIENT, DOCTOR, ADMIN) | Alta |

### RF-02 — Gestión de Perfil

| ID | Requerimiento | Prioridad |
|---|---|---|
| RF-02.1 | El paciente debe poder ver y editar su perfil (nombre, apellido, teléfono, fecha de nacimiento) | Media |
| RF-02.2 | El sistema debe mostrar las especialidades médicas activas disponibles | Media |
| RF-02.3 | El sistema debe filtrar médicos activos por especialidad y sede | Media |

### RF-03 — Reserva de Turnos

| ID | Requerimiento | Prioridad |
|---|---|---|
| RF-03.1 | El paciente debe poder reservar un turno seleccionando: especialidad → médico → fecha/hora → notas opcionales | Alta |
| RF-03.2 | El sistema debe validar que la fecha del turno sea futura | Alta |
| RF-03.3 | El turno recién creado debe quedar en estado PENDIENTE | Alta |
| RF-03.4 | Solo los pacientes autenticados pueden reservar turnos | Alta |

### RF-04 — Gestión de Turnos (Paciente)

| ID | Requerimiento | Prioridad |
|---|---|---|
| RF-04.1 | El paciente debe ver su historial de turnos con filtros de estado y fecha | Alta |
| RF-04.2 | El paciente debe poder cancelar un turno proporcionando una razón | Alta |
| RF-04.3 | El paciente debe poder reprogramar un turno (nueva fecha/hora) | Media |
| RF-04.4 | El sistema no debe permitir cancelar turnos fuera de la ventana de cancelación (default: 24h antes) | Alta |

### RF-05 — Panel del Médico

| ID | Requerimiento | Prioridad |
|---|---|---|
| RF-05.1 | El médico debe ver únicamente sus propios turnos | Alta |
| RF-05.2 | El médico debe poder confirmar un turno PENDIENTE | Alta |
| RF-05.3 | El médico debe poder marcar un turno como COMPLETADO | Alta |
| RF-05.4 | El médico debe poder registrar un NO_SHOW (paciente no se presentó) | Media |
| RF-05.5 | El médico debe poder gestionar su disponibilidad semanal (slots) | Media |
| RF-05.6 | El médico debe poder crear bloqueos de tiempo (vacaciones, licencias) | Media |

### RF-06 — Panel de Administrador

| ID | Requerimiento | Prioridad |
|---|---|---|
| RF-06.1 | El admin debe poder ver todos los turnos con filtros avanzados | Alta |
| RF-06.2 | El admin debe poder gestionar médicos (crear, editar, activar/desactivar) | Alta |
| RF-06.3 | El admin debe poder gestionar especialidades médicas | Alta |
| RF-06.4 | El admin debe poder gestionar sedes (sitios) | Media |
| RF-06.5 | El admin debe poder cambiar el rol de un usuario | Alta |
| RF-06.6 | El admin debe ver el dashboard con métricas del sistema | Media |
| RF-06.7 | El admin debe poder consultar el log de auditoría | Media |
| RF-06.8 | El admin debe poder modificar configuraciones del sistema | Baja |

---

## 3. Requerimientos No Funcionales

| ID | Requerimiento | Criterio de aceptación |
|---|---|---|
| RNF-01 | Rendimiento — Login | El endpoint `/auth/login` debe responder en < 500ms bajo carga normal |
| RNF-02 | Rendimiento — Listado de turnos | El endpoint `/appointments/my` debe responder en < 1000ms |
| RNF-03 | Concurrencia | El sistema debe soportar al menos 50 usuarios concurrentes sin errores 5xx |
| RNF-04 | Disponibilidad | El sistema debe estar disponible el 99% del tiempo en horario de uso (8:00–22:00) |
| RNF-05 | Seguridad — JWT | Los tokens deben expirar en el tiempo configurado y no ser reutilizables |
| RNF-06 | Seguridad — Roles | Un paciente no debe poder acceder a endpoints de admin o médico |
| RNF-07 | Usabilidad | El formulario de reserva de turno debe poder completarse en menos de 3 minutos |

---

## 4. Reglas de Negocio

| ID | Regla | Descripción |
|---|---|---|
| RN-01 | Ventana de cancelación | Un paciente solo puede cancelar un turno si faltan más de `DEFAULT_CANCELLATION_WINDOW_HOURS` (configuración del sistema, default: 24h) para el inicio del turno |
| RN-02 | Fecha futura | No se pueden crear turnos en fechas pasadas. La validación aplica tanto en frontend como en backend |
| RN-03 | Estado inicial | Todo turno recién reservado inicia en estado **PENDING** |
| RN-04 | Flujo de estados | PENDING → CONFIRMED → COMPLETED / NO_SHOW. Un turno CANCELED no puede cambiar de estado |
| RN-05 | Visibilidad de turnos | Un médico solo puede ver/gestionar sus propios turnos. Un paciente solo ve los suyos |
| RN-06 | Admin omnipotente | El administrador puede ver y modificar cualquier turno, usuario, médico o configuración |
| RN-07 | Especialidades activas | Solo las especialidades con `isActive: true` aparecen en el formulario de reserva pública |
| RN-08 | Médicos activos | Solo los médicos con `isActive: true` aparecen en el listado público para reservar turnos |
| RN-09 | Unicidad de email | No pueden existir dos usuarios registrados con el mismo email |
| RN-10 | Contraseña segura | La contraseña debe cumplir el patrón requerido (mínimo 8 caracteres, mayúscula, número, carácter especial) |

---

## 5. Datos de Prueba (credenciales demo)

| Rol | Email | Contraseña |
|---|---|---|
| Administrador | admin@clinica.local | Admin123! |
| Médico 1 | doctor1@clinica.local | Doctor123! |
| Médico 2 | doctor2@clinica.local | Doctor123! |
| Médico 3 | doctor3@clinica.local | Doctor123! |
| Paciente 1 | paciente@clinica.local | Paciente123! |
| Paciente 2 | paciente2@clinica.local | Paciente123! |
| Paciente 3 | paciente3@clinica.local | Paciente123! |

---

## 6. Endpoints principales del sistema

| Método | Endpoint | Rol requerido | Descripción |
|---|---|---|---|
| POST | /api/v1/auth/register | — | Registro de paciente |
| POST | /api/v1/auth/login | — | Inicio de sesión |
| GET | /api/v1/auth/me | Autenticado | Datos del usuario actual |
| GET | /api/v1/users/me | Autenticado | Perfil completo |
| PATCH | /api/v1/users/me | Autenticado | Editar perfil |
| GET | /api/v1/specialties | — | Listar especialidades activas |
| GET | /api/v1/doctors | — | Listar médicos |
| POST | /api/v1/appointments/reserve | PATIENT | Reservar turno |
| GET | /api/v1/appointments/my | Autenticado | Mis turnos |
| PATCH | /api/v1/appointments/{id}/cancel | PATIENT/ADMIN | Cancelar turno |
| PATCH | /api/v1/appointments/{id}/reschedule | PATIENT/ADMIN | Reprogramar turno |
| PATCH | /api/v1/appointments/{id}/confirm | DOCTOR/ADMIN | Confirmar turno |
| PATCH | /api/v1/appointments/{id}/complete | DOCTOR/ADMIN | Completar turno |
| PATCH | /api/v1/appointments/{id}/no-show | DOCTOR/ADMIN | Registrar no-show |
| GET | /api/v1/appointments/admin/board | ADMIN | Tablero admin |
| GET | /api/v1/admin/users | ADMIN | Gestión de usuarios |
| GET | /api/v1/admin/dashboard | ADMIN | Dashboard métricas |
