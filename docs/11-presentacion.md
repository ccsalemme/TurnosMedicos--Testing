# Presentación Final del Proyecto
## Sistema de Gestión de Turnos Médicos

**Proyecto:** TurnosMédicos  
**Fecha:** Junio 2026

> Este documento contiene el contenido estructurado para la presentación final. Usar como base para armar el PowerPoint.

---

## Slide 1 — Portada

**Título:** Sistema de Gestión de Turnos Médicos — Testing  
**Subtítulo:** TPO — Técnicas y Herramientas de Prueba de Software  
**Equipo:**
- Lara Vitale — Product Owner
- Francisco Jarusz — Project Manager
- Pilar Jimena García — Tester
- Manuel Vicente Figuerero — Tester
- Christian Carlos Salemme — Developer

---

## Slide 2 — El Problema

**Contexto:**
- Las clínicas medianas gestionan turnos con herramientas manuales (Excel, WhatsApp)
- Problemas comunes: doble booking, falta de visibilidad, cancelaciones sin aviso

**Solución implementada:**
- Aplicación web con 3 roles diferenciados: Paciente, Médico, Administrador
- API REST documentada con FastAPI (Python)
- Frontend React + Vite

---

## Slide 3 — Arquitectura del Sistema

```
┌─────────────────────────────────────────────┐
│           Frontend (React + Vite)            │
│         http://localhost:5173                │
└─────────────────┬───────────────────────────┘
                  │ HTTP / REST
┌─────────────────▼───────────────────────────┐
│         Backend (FastAPI Python)             │
│         http://localhost:3000/api/v1         │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│         Persistencia (JSON local)            │
│         backend/data/mock-data.json          │
└─────────────────────────────────────────────┘
```

**Roles del sistema:** PATIENT | DOCTOR | ADMIN

---

## Slide 4 — Requerimientos Funcionales

| RF | Módulo | Funcionalidades clave |
|---|---|---|
| RF-01 | Autenticación | Registro, Login, Logout, JWT, Control de roles |
| RF-02 | Perfil | Ver/editar datos del paciente |
| RF-03 | Reserva de turnos | Selección especialidad → médico → fecha/hora |
| RF-04 | Gestión de turnos | Cancelar, reprogramar, historial |
| RF-05 | Panel del médico | Confirmar, completar, no-show, disponibilidad |
| RF-06 | Panel de admin | Gestión de usuarios, médicos, especialidades, métricas |

**Reglas de negocio clave:**
- Ventana de cancelación: 24 horas antes del turno
- Solo se pueden reservar fechas futuras
- Flujo de estados: PENDING → CONFIRMED → COMPLETED / NO_SHOW

---

## Slide 5 — Estrategia de Testing

**4 tipos de prueba aplicados:**

| Tipo | Herramienta | Casos |
|---|---|---|
| Funcional automatizado | Selenium + pytest | 12 tests |
| Pruebas de API | Postman / Newman | ~20 requests |
| Funcional manual | Navegador | 4 casos |
| Rendimiento | JMeter | 4 escenarios |

**Cobertura total: 87% de los requerimientos funcionales**

---

## Slide 6 — Automatización con Selenium

**Scripts creados:**
- `tests/test_auth.py` — 6 tests de autenticación
- `tests/test_perfil.py` — 2 tests de perfil
- `tests/test_turnos.py` — 4 tests de gestión de turnos

**Ejecución:**
```bash
python -m pytest tests/ -v
```

**Casos cubiertos:** Login (3 roles), registro, logout, edición de perfil, reserva, cancelación, reprogramación

---

## Slide 7 — Pruebas de API con Postman

**Colección:** `postman/TurnosMedicos-Mock.postman_collection.json`

**Módulos verificados:**
- Autenticación (registro, login, token, 401/403)
- Perfil de usuario
- Especialidades y médicos
- Gestión de turnos (reserva, cancelación, reprogramación)
- Panel de médico (confirmar, completar, no-show)
- Panel de admin (tablero, usuarios, dashboard)
- **Seguridad:** Verificación de control de acceso por rol

---

## Slide 8 — Pruebas de Rendimiento (JMeter)

**4 escenarios ejecutados:**

| Escenario | Usuarios | Resultado | ¿Cumplió? |
|---|---|---|---|
| E1 — Login masivo | 50 | — | — |
| E2 — Consulta de turnos | 100 | — | — |
| E3 — Reservas simultáneas | 20 | — | — |
| E4 — Carga general | 30 | — | — |

**Criterios:** Tiempo promedio < 500ms (login), < 1000ms (listados), tasa de error < 1%

---

## Slide 9 — Defectos encontrados

| ID | Descripción | Severidad | Estado |
|---|---|---|---|
| BUG-01 | Función Selenium duplicada en test_turnos.py | Media | ✅ Corregido |
| BUG-02 | Selector XPath "Cerrar sesion" sin tilde | Baja | 🔄 Abierto |
| BUG-03 | time.sleep() fijo en lugar de esperas explícitas | Baja | 🔄 Abierto |

**Defectos críticos: 0**

---

## Slide 10 — Matriz de Trazabilidad (resumen)

| RF | Casos totales | Automatizados | API | Manual | % Cobertura |
|---|---|---|---|---|---|
| RF-01 | 7 | 6 | 1 | 0 | 100% |
| RF-02 | 3 | 2 | 1 | 0 | 100% |
| RF-03 | 3 | 2 | 1 | 0 | 100% |
| RF-04 | 4 | 2 | 1 | 1 | 75% |
| RF-05 | 4 | 0 | 2 | 2 | 50% |
| RF-06 | 6 | 0 | 5 | 1 | 83% |
| **Total** | **27** | **12** | **11** | **4** | **87%** |

---

## Slide 11 — Aprendizajes y Retrospectiva

**✅ Lo que funcionó bien:**
- Automatización Selenium cubrió los flujos críticos
- La colección Postman permitió verificar rápidamente toda la API
- La separación por roles facilitó el testing por módulo

**⚠️ Dificultades:**
- Sincronización en Selenium (`time.sleep()` vs esperas explícitas)
- Configuración de JMeter requirió más tiempo del planificado
- Test duplicado descubierto durante revisión del código de tests

**📚 Decisiones técnicas:**
- Pytest + Selenium (vs Playwright): familiaridad del equipo
- JSON local (vs DB): rapidez del MVP, con la limitación de concurrencia real

---

## Slide 12 — Conclusiones

✅ El sistema cumple con los requerimientos funcionales principales  
✅ 87% de cobertura de requerimientos por casos de prueba  
✅ 0 defectos de severidad Alta  
✅ La automatización garantiza regresión rápida ante cambios  

**Recomendaciones para producción:**
1. Migrar a base de datos real (PostgreSQL)
2. Implementar CI/CD con GitHub Actions
3. Reemplazar `time.sleep()` por esperas explícitas en Selenium
4. Agregar tests para el panel completo del médico

---

## Slide 13 — Demo

> Demostración en vivo del sistema y ejecución de los tests automatizados

**URLs:**
- Frontend: `http://localhost:5173`
- API: `http://localhost:3000/api/v1`

**Credenciales demo:**
- Paciente: `paciente@clinica.local` / `Paciente123!`
- Médico: `doctor1@clinica.local` / `Doctor123!`
- Admin: `admin@clinica.local` / `Admin123!`
