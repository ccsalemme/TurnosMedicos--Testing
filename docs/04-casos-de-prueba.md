# Escenarios y Casos de Prueba
## Sistema de Gestión de Turnos Médicos

**Proyecto:** TurnosMédicos  
**Versión:** 1.0  
**Fecha:** Junio 2026

---

## RF-01 — Autenticación y Autorización

### CP-01.1 — Registro exitoso de paciente
| Campo | Detalle |
|---|---|
| **ID** | CP-01.1 |
| **Módulo** | Autenticación |
| **Tipo** | Funcional positivo |
| **Prioridad** | Alta |
| **Precondición** | El sistema está activo. No existe usuario con el email a utilizar. |
| **Datos de entrada** | firstName: "Juan", lastName: "Test", document: "12345678", birthDate: "1990-01-01", phone: "1122334455", email: "nuevo@clinica.local", password: "TestPass123!" |
| **Pasos** | 1. Navegar a `/register` 2. Completar todos los campos 3. Clic en "Registrarse" |
| **Resultado esperado** | Usuario creado. Redirección a `/patient`. Token JWT emitido. |
| **Automatizado** | ✅ `test_auth.py::test_registro_paciente` |

### CP-01.2 — Login como paciente
| Campo | Detalle |
|---|---|
| **ID** | CP-01.2 |
| **Módulo** | Autenticación |
| **Tipo** | Funcional positivo |
| **Prioridad** | Alta |
| **Precondición** | Existe usuario paciente@clinica.local |
| **Datos de entrada** | email: "paciente@clinica.local", password: "Paciente123!" |
| **Pasos** | 1. Navegar a `/login` 2. Ingresar email y contraseña 3. Clic en "Ingresar" |
| **Resultado esperado** | Login exitoso. Redirección al panel de paciente en `localhost:5173`. |
| **Automatizado** | ✅ `test_auth.py::test_login_paciente` |

### CP-01.3 — Login como médico
| Campo | Detalle |
|---|---|
| **ID** | CP-01.3 |
| **Módulo** | Autenticación |
| **Tipo** | Funcional positivo |
| **Prioridad** | Alta |
| **Precondición** | Existe usuario doctor1@clinica.local |
| **Datos de entrada** | email: "doctor1@clinica.local", password: "Doctor123!" |
| **Pasos** | 1. Navegar a `/login` 2. Ingresar credenciales de médico 3. Clic en "Ingresar" |
| **Resultado esperado** | Login exitoso. Redirección al panel de médico. |
| **Automatizado** | ✅ `test_auth.py::test_login_medico` |

### CP-01.4 — Login como administrador
| Campo | Detalle |
|---|---|
| **ID** | CP-01.4 |
| **Módulo** | Autenticación |
| **Tipo** | Funcional positivo |
| **Prioridad** | Alta |
| **Precondición** | Existe usuario admin@clinica.local |
| **Datos de entrada** | email: "admin@clinica.local", password: "Admin123!" |
| **Pasos** | 1. Navegar a `/login` 2. Ingresar credenciales de admin 3. Clic en "Ingresar" |
| **Resultado esperado** | Login exitoso. Redirección al panel de administrador. |
| **Automatizado** | ✅ `test_auth.py::test_login_admin` |

### CP-01.5 — Login con credenciales inválidas
| Campo | Detalle |
|---|---|
| **ID** | CP-01.5 |
| **Módulo** | Autenticación |
| **Tipo** | Funcional negativo |
| **Prioridad** | Alta |
| **Precondición** | Sistema activo |
| **Datos de entrada** | email: "noexiste@clinica.local", password: "ClaveIncorrecta123!" |
| **Pasos** | 1. Navegar a `/login` 2. Ingresar credenciales incorrectas 3. Clic en "Ingresar" |
| **Resultado esperado** | Mensaje de error visible. Usuario permanece en `/login`. No se emite token. |
| **Automatizado** | ✅ `test_auth.py::test_login_credenciales_invalidas` |

### CP-01.6 — Cerrar sesión
| Campo | Detalle |
|---|---|
| **ID** | CP-01.6 |
| **Módulo** | Autenticación |
| **Tipo** | Funcional positivo |
| **Prioridad** | Media |
| **Precondición** | Usuario autenticado como paciente |
| **Pasos** | 1. Navegar a `/patient` 2. Clic en "Cerrar sesión" |
| **Resultado esperado** | Token eliminado del cliente. Redirección a `/login` o `/`. |
| **Automatizado** | ✅ `test_auth.py::test_cerrar_sesion` |

---

## RF-02 — Gestión de Perfil

### CP-02.1 — Ver y editar perfil de paciente
| Campo | Detalle |
|---|---|
| **ID** | CP-02.1 |
| **Módulo** | Perfil |
| **Tipo** | Funcional positivo |
| **Prioridad** | Media |
| **Precondición** | Paciente autenticado |
| **Datos de entrada** | firstName: "PacienteEditado", phone: "1122334455" |
| **Pasos** | 1. Login como paciente 2. Navegar a `/patient` 3. Editar nombre y teléfono 4. Clic en "Guardar perfil" 5. Recargar página |
| **Resultado esperado** | Los cambios persisten tras la recarga. Campo firstName muestra "PacienteEditado". |
| **Automatizado** | ✅ `test_perfil.py::test_ver_y_editar_perfil` |

### CP-02.2 — Filtrar especialidades y médicos
| Campo | Detalle |
|---|---|
| **ID** | CP-02.2 |
| **Módulo** | Perfil / Reserva |
| **Tipo** | Funcional positivo |
| **Prioridad** | Alta |
| **Precondición** | Paciente autenticado. Existen especialidades activas con médicos asignados. |
| **Pasos** | 1. Login como paciente 2. Navegar a `/patient` 3. Verificar que el select de especialidades tiene opciones 4. Seleccionar una especialidad 5. Verificar que el select de médicos se actualiza |
| **Resultado esperado** | Lista de especialidades con al menos 1 opción. Al seleccionar especialidad, aparecen médicos disponibles. |
| **Automatizado** | ✅ `test_perfil.py::test_filtrar_especialidades_y_medicos` |

---

## RF-03 y RF-04 — Reserva y Gestión de Turnos

### CP-03.1 — Reservar turno exitosamente
| Campo | Detalle |
|---|---|
| **ID** | CP-03.1 |
| **Módulo** | Turnos |
| **Tipo** | Funcional positivo |
| **Prioridad** | Alta |
| **Precondición** | Paciente autenticado. Existe al menos una especialidad activa con médico asignado. |
| **Datos de entrada** | especialidad: índice 1, médico: índice 1, fecha: mañana 10:00, notas: "Consulta de rutina test" |
| **Pasos** | 1. Login como paciente 2. Seleccionar especialidad 3. Seleccionar médico 4. Ingresar fecha futura 5. Ingresar notas 6. Clic en "Reservar turno" |
| **Resultado esperado** | Turno creado y visible en la lista con estado PENDIENTE. |
| **Automatizado** | ✅ `test_turnos.py::test_reservar_turno` |

### CP-03.2 — Intentar reservar turno en fecha pasada
| Campo | Detalle |
|---|---|
| **ID** | CP-03.2 |
| **Módulo** | Turnos |
| **Tipo** | Funcional negativo |
| **Prioridad** | Alta |
| **Precondición** | Paciente autenticado. Existe al menos una especialidad activa. |
| **Datos de entrada** | fecha: ayer 10:00 |
| **Pasos** | 1. Login como paciente 2. Seleccionar especialidad y médico 3. Ingresar fecha pasada 4. Clic en "Reservar turno" |
| **Resultado esperado** | Mensaje de error indicando que la fecha debe ser futura. Turno no se crea. |
| **Automatizado** | ✅ `test_turnos.py::test_reservar_turno_fecha_pasada` |

### CP-04.1 — Cancelar un turno
| Campo | Detalle |
|---|---|
| **ID** | CP-04.1 |
| **Módulo** | Turnos |
| **Tipo** | Funcional positivo |
| **Prioridad** | Alta |
| **Precondición** | Paciente autenticado. Existe al menos un turno en estado PENDIENTE con fecha futura > 24h. |
| **Pasos** | 1. Login como paciente 2. Navegar a `/patient` 3. Localizar primer turno 4. Clic en "Cancelar" 5. Confirmar razón |
| **Resultado esperado** | El turno cambia a estado CANCELADO en la lista. |
| **Automatizado** | ✅ `test_turnos.py::test_cancelar_turno` |

### CP-04.2 — Reprogramar un turno
| Campo | Detalle |
|---|---|
| **ID** | CP-04.2 |
| **Módulo** | Turnos |
| **Tipo** | Funcional positivo |
| **Prioridad** | Media |
| **Precondición** | Paciente autenticado. Existe al menos un turno en estado PENDIENTE. |
| **Datos de entrada** | nueva fecha: en 3 días a las 11:00 |
| **Pasos** | 1. Login como paciente 2. Localizar primer turno 3. Clic en "Reprogramar" 4. Ingresar nueva fecha/hora 5. Confirmar |
| **Resultado esperado** | El turno aparece actualizado con la nueva fecha en la lista. |
| **Automatizado** | ✅ `test_turnos.py::test_reprogramar_turno` |

### CP-04.3 — Intentar cancelar turno fuera de ventana
| Campo | Detalle |
|---|---|
| **ID** | CP-04.3 |
| **Módulo** | Turnos |
| **Tipo** | Funcional negativo |
| **Prioridad** | Alta |
| **Precondición** | Existe turno con fecha en menos de 24 horas |
| **Pasos** | 1. Login como paciente 2. Intentar cancelar turno próximo |
| **Resultado esperado** | Error indicando que no se puede cancelar por estar dentro de la ventana de cancelación. |
| **Automatizado** | ❌ Manual |

---

## RF-05 — Panel del Médico

### CP-05.1 — Confirmar turno pendiente
| Campo | Detalle |
|---|---|
| **ID** | CP-05.1 |
| **Módulo** | Panel Médico |
| **Tipo** | Funcional positivo |
| **Prioridad** | Alta |
| **Precondición** | Médico autenticado. Existe turno PENDING asignado al médico. |
| **Pasos** | 1. Login como doctor1@clinica.local 2. Ver lista de turnos 3. Clic en "Confirmar" sobre un turno PENDING |
| **Resultado esperado** | El turno cambia a estado CONFIRMED. |
| **Automatizado** | ❌ Manual |

### CP-05.2 — Registrar no-show
| Campo | Detalle |
|---|---|
| **ID** | CP-05.2 |
| **Módulo** | Panel Médico |
| **Tipo** | Funcional positivo |
| **Prioridad** | Media |
| **Precondición** | Médico autenticado. Existe turno CONFIRMED cuya hora ya pasó. |
| **Pasos** | 1. Login como médico 2. Clic en "No se presentó" en un turno |
| **Resultado esperado** | El turno cambia a estado NO_SHOW. |
| **Automatizado** | ❌ Manual |

---

## RF-06 — Panel de Administrador

### CP-06.1 — Acceso al dashboard de admin
| Campo | Detalle |
|---|---|
| **ID** | CP-06.1 |
| **Módulo** | Admin |
| **Tipo** | Funcional positivo |
| **Prioridad** | Alta |
| **Precondición** | Usuario autenticado como ADMIN |
| **Pasos** | 1. Login como admin 2. Navegar al dashboard |
| **Resultado esperado** | Dashboard visible con métricas del sistema. |
| **Automatizado** | ❌ Manual |

### CP-06.2 — Paciente no puede acceder a endpoints de admin
| Campo | Detalle |
|---|---|
| **ID** | CP-06.2 |
| **Módulo** | Seguridad / Roles |
| **Tipo** | Seguridad |
| **Prioridad** | Alta |
| **Precondición** | Usuario autenticado como PATIENT |
| **Pasos** | 1. Login como paciente 2. Hacer GET a `/api/v1/admin/users` con el token del paciente |
| **Resultado esperado** | HTTP 403 Forbidden. Mensaje de error de autorización. |
| **Automatizado** | ✅ Postman (CP-06.2 en colección) |

---

## Resumen de cobertura

| RF | Casos totales | Automatizados | Manuales |
|---|---|---|---|
| RF-01 | 6 | 6 | 0 |
| RF-02 | 2 | 2 | 0 |
| RF-03 | 2 | 2 | 0 |
| RF-04 | 3 | 2 | 1 |
| RF-05 | 2 | 0 | 2 |
| RF-06 | 2 | 1 | 1 |
| **Total** | **17** | **13** | **4** |
