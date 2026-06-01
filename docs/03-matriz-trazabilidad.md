# Matriz de Trazabilidad
## Sistema de Gestión de Turnos Médicos

**Proyecto:** TurnosMédicos  
**Versión:** 1.0  
**Fecha:** Junio 2026

---

## Convenciones

| Símbolo | Significado |
|---|---|
| ✅ | Cubierto / Pasado |
| ❌ | No cubierto / Fallido |
| ⚠️ | Parcialmente cubierto |
| 🔧 | Automatizado (Selenium) |
| 📬 | Postman / API |
| 👁️ | Manual |

---

## Matriz RF → Casos de Prueba → Herramienta → Evidencia

| ID RF | Descripción del Requerimiento | ID Caso | Descripción del Caso | Herramienta | Estado | Evidencia |
|---|---|---|---|---|---|---|
| RF-01.1 | Registro de nuevos pacientes | CP-01.1 | Registro exitoso de paciente | 🔧 Selenium | ✅ | `test_auth.py::test_registro_paciente` |
| RF-01.2 | Login de paciente | CP-01.2 | Login como paciente | 🔧 Selenium | ✅ | `test_auth.py::test_login_paciente` |
| RF-01.2 | Login de médico | CP-01.3 | Login como médico | 🔧 Selenium | ✅ | `test_auth.py::test_login_medico` |
| RF-01.2 | Login de administrador | CP-01.4 | Login como admin | 🔧 Selenium | ✅ | `test_auth.py::test_login_admin` |
| RF-01.3 | Rechazo de credenciales inválidas | CP-01.5 | Login con credenciales inválidas | 🔧 Selenium | ✅ | `test_auth.py::test_login_credenciales_invalidas` |
| RF-01.4 | Emisión de JWT | CP-01.5b | Token emitido al hacer login | 📬 Postman | ✅ | Colección Postman — Auth section |
| RF-01.5 | Cierre de sesión | CP-01.6 | Cerrar sesión | 🔧 Selenium | ✅ | `test_auth.py::test_cerrar_sesion` |
| RF-01.6 | Control de acceso por rol | CP-06.2 | Paciente no accede a admin | 📬 Postman | ✅ | Colección Postman — Security section |
| RF-02.1 | Ver y editar perfil de paciente | CP-02.1 | Ver y editar perfil | 🔧 Selenium | ✅ | `test_perfil.py::test_ver_y_editar_perfil` |
| RF-02.2 | Ver especialidades activas | CP-02.2 | Filtrar especialidades | 🔧 Selenium | ✅ | `test_perfil.py::test_filtrar_especialidades_y_medicos` |
| RF-02.3 | Filtrar médicos por especialidad | CP-02.2 | Filtrar médicos | 🔧 Selenium | ✅ | `test_perfil.py::test_filtrar_especialidades_y_medicos` |
| RF-03.1 | Reservar turno completo | CP-03.1 | Reservar turno exitosamente | 🔧 Selenium | ✅ | `test_turnos.py::test_reservar_turno` |
| RF-03.2 | Validar fecha futura | CP-03.2 | Reservar con fecha pasada | 🔧 Selenium | ✅ | `test_turnos.py::test_reservar_turno_fecha_pasada` |
| RF-03.3 | Estado inicial PENDIENTE | CP-03.1 | Turno aparece como PENDIENTE | 🔧 Selenium | ✅ | `test_turnos.py::test_reservar_turno` |
| RF-04.1 | Ver historial de turnos | CP-04.1 | Lista de turnos visible | 🔧 Selenium | ✅ | `test_turnos.py::test_cancelar_turno` (implícito) |
| RF-04.2 | Cancelar turno | CP-04.1 | Cancelar un turno | 🔧 Selenium | ✅ | `test_turnos.py::test_cancelar_turno` |
| RF-04.3 | Reprogramar turno | CP-04.2 | Reprogramar un turno | 🔧 Selenium | ✅ | `test_turnos.py::test_reprogramar_turno` |
| RF-04.4 | Ventana de cancelación (RN-01) | CP-04.3 | Cancelar fuera de ventana | 👁️ Manual | ⚠️ | `docs/05-evidencia-ejecucion-manual.md` |
| RF-05.1 | Médico ve solo sus turnos | CP-05.1 | Login médico — solo sus turnos | 📬 Postman | ✅ | Colección Postman — Doctor section |
| RF-05.2 | Confirmar turno | CP-05.1 | Confirmar turno pendiente | 👁️ Manual | ⚠️ | `docs/05-evidencia-ejecucion-manual.md` |
| RF-05.3 | Completar turno | CP-05.1 | Marcar turno como completado | 📬 Postman | ✅ | Colección Postman — Doctor section |
| RF-05.4 | Registrar no-show | CP-05.2 | Registrar no-show | 👁️ Manual | ⚠️ | `docs/05-evidencia-ejecucion-manual.md` |
| RF-06.1 | Ver todos los turnos (admin) | CP-06.1 | Dashboard admin | 📬 Postman | ✅ | Colección Postman — Admin section |
| RF-06.2 | Gestión de médicos | — | CRUD médicos | 📬 Postman | ✅ | Colección Postman — Admin section |
| RF-06.3 | Gestión de especialidades | — | CRUD especialidades | 📬 Postman | ✅ | Colección Postman — Admin section |
| RF-06.4 | Gestión de sedes | — | CRUD sedes | 📬 Postman | ✅ | Colección Postman — Admin section |
| RF-06.5 | Cambio de rol de usuario | — | Cambiar rol | 📬 Postman | ✅ | Colección Postman — Admin section |
| RF-06.6 | Dashboard con métricas | CP-06.1 | Acceso al dashboard | 👁️ Manual | ⚠️ | `docs/05-evidencia-ejecucion-manual.md` |
| RNF-01 | Login < 500ms | E1 | Login masivo | JMeter | ⚠️ | `docs/09-evidencia-jmeter.md` |
| RNF-02 | Turnos < 1000ms | E2 | Consulta de turnos | JMeter | ⚠️ | `docs/09-evidencia-jmeter.md` |
| RNF-03 | 50+ usuarios concurrentes | E3/E4 | Carga concurrente | JMeter | ⚠️ | `docs/09-evidencia-jmeter.md` |
| RNF-06 | Seguridad por roles | CP-06.2 | Acceso denegado 403 | 📬 Postman | ✅ | Colección Postman — Security |

---

## Resumen de Cobertura por RF

| RF | Nombre | Casos totales | Cubiertos | % Cobertura |
|---|---|---|---|---|
| RF-01 | Autenticación | 7 | 7 | 100% |
| RF-02 | Perfil | 3 | 3 | 100% |
| RF-03 | Reserva de turnos | 3 | 3 | 100% |
| RF-04 | Gestión de turnos | 4 | 3 | 75% |
| RF-05 | Panel médico | 4 | 2 | 50% |
| RF-06 | Panel admin | 6 | 5 | 83% |
| RNF | No funcionales | 3 | 3 | 100% (pendiente ejecución) |
| **Total** | | **30** | **26** | **87%** |

---

## Cobertura por herramienta

| Herramienta | Casos cubiertos | % del total |
|---|---|---|
| Selenium (automatizado) | 13 | 43% |
| Postman / Newman (API) | 12 | 40% |
| Manual | 4 | 13% |
| JMeter (rendimiento) | 4 escenarios | — |
