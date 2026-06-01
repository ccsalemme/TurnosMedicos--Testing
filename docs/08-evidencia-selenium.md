# Evidencia de Automatización con Selenium
## Sistema de Gestión de Turnos Médicos

**Proyecto:** TurnosMédicos  
**Versión:** 1.0  
**Fecha:** Junio 2026

---

## Stack de automatización

| Componente | Versión | Descripción |
|---|---|---|
| Python | 3.10+ | Lenguaje de los scripts |
| Selenium WebDriver | 4.x | Framework de automatización web |
| pytest | 8.x | Framework de ejecución de tests |
| webdriver-manager | 4.x | Gestión automática de ChromeDriver |
| Google Chrome | Última | Navegador utilizado |

---

## Estructura de los scripts

```
tests/
├── conftest_selenium.py      # Helper: crear driver, función login, BASE_URL
├── test_auth.py              # RF-01: Tests de autenticación (6 casos)
├── test_perfil.py            # RF-02: Tests de perfil (2 casos)
└── test_turnos.py            # RF-03/04: Tests de turnos (4 casos)
```

---

## Instalación y ejecución

### Prerrequisitos
```bash
# 1. Activar entorno virtual Python
source .venv/bin/activate   # macOS/Linux
.venv\Scripts\activate      # Windows

# 2. Instalar dependencias
pip install -r backend/requirements.txt
# Dependencias Selenium adicionales:
pip install selenium webdriver-manager pytest
```

### Ejecutar todos los tests
```bash
python -m pytest tests/ -v --tb=short
```

### Ejecutar un módulo específico
```bash
python -m pytest tests/test_auth.py -v
python -m pytest tests/test_turnos.py -v
python -m pytest tests/test_perfil.py -v
```

### Ejecutar un test específico
```bash
python -m pytest tests/test_auth.py::test_login_paciente -v
```

### Ejecutar en modo directo (sin pytest)
```bash
python tests/test_auth.py
python tests/test_turnos.py
python tests/test_perfil.py
```

---

## Tests implementados

### test_auth.py — RF-01: Autenticación

| Test | Caso | RF | Descripción |
|---|---|---|---|
| `test_login_paciente` | CP-01.2 | RF-01.2 | Login exitoso como paciente |
| `test_login_medico` | CP-01.3 | RF-01.2 | Login exitoso como médico |
| `test_login_admin` | CP-01.4 | RF-01.2 | Login exitoso como admin |
| `test_login_credenciales_invalidas` | CP-01.5 | RF-01.3 | Login con datos incorrectos |
| `test_registro_paciente` | CP-01.1 | RF-01.1 | Registro de nuevo paciente |
| `test_cerrar_sesion` | CP-01.6 | RF-01.5 | Logout y redirección |

### test_perfil.py — RF-02: Perfil

| Test | Caso | RF | Descripción |
|---|---|---|---|
| `test_ver_y_editar_perfil` | CP-02.1 | RF-02.1 | Editar nombre y teléfono del paciente |
| `test_filtrar_especialidades_y_medicos` | CP-02.2 | RF-02.2/2.3 | Filtrado dinámico de especialidades y médicos |

### test_turnos.py — RF-03/04: Turnos

| Test | Caso | RF | Descripción |
|---|---|---|---|
| `test_reservar_turno` | CP-03.1 | RF-03.1/3.3 | Reserva exitosa y estado PENDIENTE |
| `test_reservar_turno_fecha_pasada` | CP-03.2 | RF-03.2 | Validación de fecha futura |
| `test_cancelar_turno` | CP-04.1 | RF-04.2 | Cancelación de turno |
| `test_reprogramar_turno` | CP-04.2 | RF-04.3 | Reprogramación de turno |

---

## Resultados de ejecución

> Completar con los resultados reales al ejecutar la suite

### Comando ejecutado
```bash
python -m pytest tests/ -v --tb=short
```

### Output esperado / resultado
```
========================= test session starts ==========================
platform ... -- Python 3.x.x, pytest-8.x.x
collected 12 items

tests/test_auth.py::test_login_paciente           PASSED/FAILED
tests/test_auth.py::test_login_medico             PASSED/FAILED
tests/test_auth.py::test_login_admin              PASSED/FAILED
tests/test_auth.py::test_login_credenciales_invalidas  PASSED/FAILED
tests/test_auth.py::test_registro_paciente        PASSED/FAILED
tests/test_auth.py::test_cerrar_sesion            PASSED/FAILED
tests/test_perfil.py::test_ver_y_editar_perfil    PASSED/FAILED
tests/test_perfil.py::test_filtrar_especialidades_y_medicos  PASSED/FAILED
tests/test_turnos.py::test_reservar_turno         PASSED/FAILED
tests/test_turnos.py::test_reservar_turno_fecha_pasada  PASSED/FAILED
tests/test_turnos.py::test_cancelar_turno         PASSED/FAILED
tests/test_turnos.py::test_reprogramar_turno      PASSED/FAILED

======================== X passed, Y failed in Z.XXs ==================

[ Reemplazar con el output real de la ejecución ]
```

### Resumen de resultados

| Suite | Total | Pasaron | Fallaron | % Éxito |
|---|---|---|---|---|
| test_auth.py | 6 | — | — | — |
| test_perfil.py | 2 | — | — | — |
| test_turnos.py | 4 | — | — | — |
| **Total** | **12** | — | — | — |

---

## Defectos encontrados durante automatización

Ver `docs/06-registro-defectos.md` para el detalle completo.

| Bug | Test afectado | Descripción | Estado |
|---|---|---|---|
| BUG-01 | test_turnos.py | Función `test_reprogramar_turno` duplicada | Corregido |
| BUG-02 | test_auth.py | Selector "Cerrar sesion" sin tilde | Abierto |
| BUG-03 | Todos | Uso de `time.sleep()` fijo | Abierto |
