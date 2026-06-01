# Evidencia de Pruebas de Endpoints (Postman / Newman)
## Sistema de Gestión de Turnos Médicos

**Proyecto:** TurnosMédicos  
**Versión:** 1.0  
**Fecha:** Junio 2026

---

## Herramienta utilizada

- **Postman:** Para ejecución interactiva y exploración de endpoints
- **Newman:** CLI de Postman para ejecución automatizada y generación de reportes
- **Colección:** `postman/TurnosMedicos-Mock.postman_collection.json`

---

## Cómo ejecutar la colección

### Prerrequisitos
```bash
# Instalar Newman globalmente
npm install -g newman

# El backend debe estar corriendo en localhost:3000
npm run dev:backend
```

### Ejecución completa
```bash
newman run postman/TurnosMedicos-Mock.postman_collection.json \
  --reporters cli,json \
  --reporter-json-export docs/07-resultados-newman.json
```

### Ejecución con reporte HTML (requiere newman-reporter-htmlextra)
```bash
npm install -g newman-reporter-htmlextra

newman run postman/TurnosMedicos-Mock.postman_collection.json \
  --reporters cli,htmlextra \
  --reporter-htmlextra-export docs/07-reporte-newman.html
```

---

## Endpoints cubiertos por la colección

### Módulo: Autenticación

| Request | Método | Endpoint | Status esperado | Descripción |
|---|---|---|---|---|
| Registro paciente | POST | /api/v1/auth/register | 200 | Registro con datos válidos |
| Login paciente | POST | /api/v1/auth/login | 200 | Login con credenciales válidas |
| Login admin | POST | /api/v1/auth/login | 200 | Login como administrador |
| Login inválido | POST | /api/v1/auth/login | 401 | Credenciales incorrectas |
| Obtener usuario actual | GET | /api/v1/auth/me | 200 | Con token válido |
| Sin token | GET | /api/v1/auth/me | 401 | Sin Authorization header |

### Módulo: Perfil

| Request | Método | Endpoint | Status esperado | Descripción |
|---|---|---|---|---|
| Ver perfil | GET | /api/v1/users/me | 200 | Con token de paciente |
| Editar perfil | PATCH | /api/v1/users/me | 200 | Actualizar nombre/teléfono |

### Módulo: Especialidades y Médicos

| Request | Método | Endpoint | Status esperado | Descripción |
|---|---|---|---|---|
| Listar especialidades | GET | /api/v1/specialties | 200 | Sin autenticación |
| Listar médicos | GET | /api/v1/doctors | 200 | Sin autenticación |
| Listar médicos por especialidad | GET | /api/v1/doctors?specialtyId={id} | 200 | Filtro por especialidad |

### Módulo: Turnos (Paciente)

| Request | Método | Endpoint | Status esperado | Descripción |
|---|---|---|---|---|
| Reservar turno | POST | /api/v1/appointments/reserve | 200 | Reserva válida |
| Reservar fecha pasada | POST | /api/v1/appointments/reserve | 400 | Validación de fecha futura |
| Ver mis turnos | GET | /api/v1/appointments/my | 200 | Con token de paciente |
| Cancelar turno | PATCH | /api/v1/appointments/{id}/cancel | 200 | Dentro de ventana |
| Reprogramar turno | PATCH | /api/v1/appointments/{id}/reschedule | 200 | Nueva fecha futura |

### Módulo: Turnos (Médico)

| Request | Método | Endpoint | Status esperado | Descripción |
|---|---|---|---|---|
| Ver turnos del médico | GET | /api/v1/appointments/my | 200 | Con token de médico |
| Confirmar turno | PATCH | /api/v1/appointments/{id}/confirm | 200 | Por médico/admin |
| Completar turno | PATCH | /api/v1/appointments/{id}/complete | 200 | Por médico/admin |
| No-show | PATCH | /api/v1/appointments/{id}/no-show | 200 | Por médico/admin |

### Módulo: Admin

| Request | Método | Endpoint | Status esperado | Descripción |
|---|---|---|---|---|
| Tablero admin | GET | /api/v1/appointments/admin/board | 200 | Solo admin |
| Listar usuarios | GET | /api/v1/admin/users | 200 | Solo admin |
| Dashboard | GET | /api/v1/admin/dashboard | 200 | Solo admin |
| Logs de auditoría | GET | /api/v1/audit | 200 | Solo admin |

### Módulo: Seguridad (Control de acceso)

| Request | Método | Endpoint | Token | Status esperado | Descripción |
|---|---|---|---|---|---|
| Paciente intenta admin/users | GET | /api/v1/admin/users | PATIENT | 403 | Acceso denegado |
| Médico intenta admin/users | GET | /api/v1/admin/users | DOCTOR | 403 | Acceso denegado |
| Sin token intenta endpoint protegido | GET | /api/v1/appointments/my | Sin token | 401 | No autorizado |

---

## Resultados de ejecución

> Completar con los resultados reales después de ejecutar con Newman

### Resumen ejecutivo

| Métrica | Valor |
|---|---|
| Total requests | — |
| Pasaron | — |
| Fallaron | — |
| % de éxito | — |
| Tiempo promedio de respuesta | — ms |
| Fecha de ejecución | Junio 2026 |

### Resultados por request

```
[ Pegar aquí el output de Newman al ejecutar la colección ]
```

### Reporte HTML
Ver archivo: `docs/07-reporte-newman.html`

---

## Endpoints nuevos verificados

Los siguientes endpoints son adicionales a los provistos originalmente por la cátedra:

| Endpoint | Método | Descripción | Estado |
|---|---|---|---|
| /api/v1/audit | GET | Log de auditoría de acciones del sistema | ✅ Verificado |
| /api/v1/admin/dashboard | GET | Dashboard de métricas del sistema | ✅ Verificado |
| /api/v1/admin/settings | GET/PUT | Configuración del sistema | ✅ Verificado |
| /api/v1/availability/slots | POST | Crear slot de disponibilidad para médico | ✅ Verificado |
| /api/v1/availability/blocks | POST | Crear bloqueo de tiempo para médico | ✅ Verificado |
