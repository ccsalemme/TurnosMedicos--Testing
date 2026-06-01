# Plan de Pruebas — Inicial y Final
## Sistema de Gestión de Turnos Médicos

**Proyecto:** TurnosMédicos  
**Versión del documento:** 1.0  
**Fecha de creación:** Junio 2026  
**Última actualización:** Junio 2026  
**Equipo:**
- Product Owner: Lara Vitale
- Project Manager: Francisco Jarusz
- Testers: Pilar Jimena García, Manuel Vicente Figuerero
- Developer: Christian Carlos Salemme

---

## 1. Introducción

### 1.1 Propósito
Este documento define el plan de pruebas para el sistema TurnosMédicos, una aplicación web de gestión de turnos médicos. El plan describe el alcance, los tipos de prueba, los recursos, el cronograma y los criterios de éxito del proceso de testing.

### 1.2 Alcance
El testing cubre el sistema completo compuesto por:
- **Backend:** API REST construida con FastAPI (Python), corriendo en `http://localhost:3000/api/v1`
- **Frontend:** Aplicación React + Vite, accesible en `http://localhost:5173`
- **Persistencia:** Archivo JSON local (`backend/data/mock-data.json`)

### 1.3 Objetivos del testing
1. Verificar que todos los Requerimientos Funcionales (RF-01 al RF-06) funcionan correctamente
2. Detectar defectos antes de la entrega final
3. Validar el comportamiento del sistema bajo carga (pruebas no funcionales)
4. Garantizar la seguridad básica del sistema (control de acceso por roles)
5. Proporcionar evidencia documentada de la calidad del sistema

### 1.4 Referencias
- `docs/01-requerimientos-refinados.md` — Requerimientos funcionales y reglas de negocio
- `docs/04-casos-de-prueba.md` — Casos de prueba detallados
- `docs/03-matriz-trazabilidad.md` — Trazabilidad RF → Casos → Evidencia
- `postman/TurnosMedicos-Mock.postman_collection.json` — Colección de pruebas de API

---

## 2. Elementos a probar (Scope IN)

| Módulo | Descripción |
|---|---|
| Autenticación | Registro, login, logout, control de roles/permisos |
| Perfil de paciente | Ver y editar datos personales |
| Reserva de turnos | Flujo completo de reserva con validaciones |
| Gestión de turnos | Cancelar, reprogramar, ver historial |
| Panel del médico | Confirmar, completar, no-show, disponibilidad |
| Panel de administrador | Gestión de usuarios, médicos, especialidades, sedes |
| API REST | Todos los endpoints documentados |
| Rendimiento | Tiempos de respuesta bajo carga simulada |

## 2.1 Elementos fuera del alcance (Scope OUT)

| Elemento | Motivo |
|---|---|
| Notificaciones por email | No implementado en el MVP |
| Integración con sistemas externos (HIS, laboratorio) | Fuera del alcance del MVP |
| App mobile nativa | Solo web |
| Pruebas de base de datos relacional | Se usa JSON local |
| Pruebas de infraestructura cloud (Render/GitHub Pages) | Fuera del alcance de testing |

---

## 3. Tipos de Prueba

### 3.1 Pruebas Funcionales Manuales
**Objetivo:** Verificar que cada funcionalidad se comporta según los requerimientos mediante ejecución manual por testers.

**Técnica:** Caja negra — se prueba la interfaz sin conocimiento del código interno.

**Casos cubiertos:** CP-04.3, CP-05.1, CP-05.2, CP-06.1 y casos de exploración ad-hoc.

**Herramientas:** Navegador Chrome/Firefox, DevTools para inspección.

---

### 3.2 Pruebas Funcionales Automatizadas con Selenium
**Objetivo:** Automatizar los casos de prueba más críticos y repetitivos para regresión.

**Herramienta:** Selenium WebDriver 4.x + pytest + webdriver-manager

**Scripts:**
| Archivo | Módulo | Casos cubiertos |
|---|---|---|
| `tests/test_auth.py` | Autenticación | CP-01.1 al CP-01.6 |
| `tests/test_perfil.py` | Perfil | CP-02.1, CP-02.2 |
| `tests/test_turnos.py` | Turnos | CP-03.1, CP-03.2, CP-04.1, CP-04.2 |

**Comando de ejecución:**
```bash
cd /ruta/al/proyecto
python -m pytest tests/ -v --tb=short
```

**Prerrequisitos:**
- Backend corriendo en `http://localhost:3000`
- Frontend corriendo en `http://localhost:5173`
- Google Chrome instalado
- Python 3.10+ con dependencias instaladas

---

### 3.3 Pruebas de API con Postman
**Objetivo:** Verificar que cada endpoint de la API REST responde correctamente con los datos y códigos HTTP esperados.

**Herramienta:** Postman / Newman (CLI)

**Colección:** `postman/TurnosMedicos-Mock.postman_collection.json`

**Estrategia de ejecución:**
1. Ejecutar colección completa con el backend activo
2. Verificar que todos los tests de Postman pasan (assertions de status code, estructura JSON, etc.)

**Comando Newman:**
```bash
npx newman run postman/TurnosMedicos-Mock.postman_collection.json \
  --env-var "baseUrl=http://localhost:3000/api/v1" \
  --reporters cli,json \
  --reporter-json-export docs/07-resultados-newman.json
```

**Endpoints cubiertos:**
| Endpoint | Método | Caso verificado |
|---|---|---|
| /auth/register | POST | Registro exitoso |
| /auth/login | POST | Login válido e inválido |
| /auth/me | GET | Con/sin token |
| /users/me | GET/PATCH | Perfil paciente |
| /specialties | GET | Listado público |
| /doctors | GET | Listado con filtros |
| /appointments/reserve | POST | Reserva válida e inválida |
| /appointments/my | GET | Con filtros de estado |
| /appointments/{id}/cancel | PATCH | Cancelación |
| /appointments/{id}/reschedule | PATCH | Reprogramación |
| /appointments/{id}/confirm | PATCH | Solo DOCTOR/ADMIN |
| /admin/users | GET | Solo ADMIN (403 para otros roles) |
| /admin/dashboard | GET | Solo ADMIN |

---

### 3.4 Pruebas No Funcionales de Rendimiento con JMeter
**Objetivo:** Verificar que el sistema mantiene tiempos de respuesta aceptables bajo carga simulada y cumple los RNFs definidos.

**Herramienta:** Apache JMeter 5.6+

**Plan de prueba:** `jmeter/TurnosMedicos-LoadTest.jmx`

**Escenarios de carga:**

| Escenario | Usuarios concurrentes | Ramp-up | Duración | Endpoint |
|---|---|---|---|---|
| E1 — Login masivo | 50 | 10s | 60s | POST /auth/login |
| E2 — Consulta de turnos | 100 | 20s | 120s | GET /appointments/my |
| E3 — Reservas simultáneas | 20 | 5s | 60s | POST /appointments/reserve |
| E4 — Carga general | 30 | 15s | 180s | Mix de endpoints |

**Criterios de aceptación para rendimiento:**
| Métrica | Criterio |
|---|---|
| Tiempo de respuesta promedio (Login) | < 500ms |
| Tiempo de respuesta promedio (Listado) | < 1000ms |
| Tasa de error | < 1% |
| Throughput mínimo | > 10 req/s |

---

## 4. Criterios de Entrada y Salida

### 4.1 Criterios de entrada (para iniciar las pruebas)
- [ ] El backend está corriendo sin errores en `localhost:3000`
- [ ] El frontend está corriendo en `localhost:5173`
- [ ] Los datos de seed están cargados (`npm run db:seed`)
- [ ] Los casos de prueba están documentados en `docs/04-casos-de-prueba.md`
- [ ] Las herramientas de testing están instaladas (Python, Selenium, Postman/Newman)

### 4.2 Criterios de salida (para dar por finalizado el testing)
- [ ] Al menos el 80% de los casos de prueba ejecutados
- [ ] Todos los defectos de severidad Alta están cerrados o tienen workaround documentado
- [ ] Los tests Selenium pasan con al menos 90% de éxito
- [ ] La colección de Postman pasa en al menos 95% de los requests
- [ ] Las pruebas de carga no superan el 1% de tasa de error
- [ ] El registro de defectos está actualizado

---

## 5. Ambiente de Pruebas

### 5.1 Configuración del ambiente local

| Componente | Detalle |
|---|---|
| Sistema Operativo | Windows 10/11, macOS 12+, Ubuntu 22.04 |
| Node.js | v20+ |
| Python | 3.10+ |
| Navegador | Google Chrome (última versión) |
| Backend URL | `http://localhost:3000/api/v1` |
| Frontend URL | `http://localhost:5173` |
| Base de datos | `backend/data/mock-data.json` (JSON local) |

### 5.2 Instalación del ambiente

```bash
# 1. Clonar/actualizar repositorio
git clone <repo-url>
cd TurnosMedicos--Testing

# 2. Instalar dependencias Node
npm run install:all

# 3. Instalar dependencias Python
pip install -r backend/requirements.txt

# 4. Reinstalar datos de prueba
npm run db:seed

# 5. Iniciar backend (Terminal 1)
npm run dev:backend

# 6. Iniciar frontend (Terminal 2)
npm run dev:frontend
```

### 5.3 Credenciales de prueba

| Rol | Email | Contraseña |
|---|---|---|
| Admin | admin@clinica.local | Admin123! |
| Médico | doctor1@clinica.local | Doctor123! |
| Paciente | paciente@clinica.local | Paciente123! |

---

## 6. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| El frontend cambia IDs de elementos HTML rompe los tests Selenium | Media | Alto | Usar selectores robustos (`By.ID` preferido sobre `By.CSS`). Coordinar con desarrollador antes de cambios de UI. |
| El archivo mock-data.json se corrompe entre tests | Media | Alto | Hacer backup antes de cada sesión de testing. Correr `npm run db:seed` antes de cada suite. |
| Versión de ChromeDriver incompatible con Chrome instalado | Baja | Alto | Usar `webdriver-manager` que descarga automáticamente la versión correcta. |
| JMeter no disponible en la máquina de testing | Media | Medio | Documentar que se requiere instalación previa. Alternativa: usar `locust` (Python). |
| El backend free de Render "se duerme" en pruebas de producción | Alta | Medio | Todas las pruebas se realizan en ambiente local. |

---

## 7. Estrategia de Datos de Prueba

### 7.1 Datos fijos (seed)
Los datos del archivo `backend/data/mock-data.json` proveen:
- 1 usuario administrador
- 3 médicos con especialidades y disponibilidad
- 3 pacientes
- Turnos en distintos estados (PENDING, CONFIRMED, COMPLETED, CANCELED)

### 7.2 Datos dinámicos en tests
Los tests de Selenium que crean nuevos datos usan timestamps para evitar conflictos:
```python
email_unico = f"test_paciente_{int(time.time())}@clinica.local"
```

### 7.3 Reset entre sesiones
```bash
npm run db:seed  # Restaura el mock-data.json al estado inicial
```

---

## 8. Cronograma de Pruebas

| Fase | Actividad | Responsable | Duración estimada |
|---|---|---|---|
| Fase 1 | Configuración del ambiente | Pilar García | 1 día |
| Fase 2 | Ejecución de pruebas manuales | Pilar García | 2 días |
| Fase 3 | Ejecución de pruebas Selenium | Manuel Figuerero | 1 día |
| Fase 4 | Ejecución de pruebas Postman/Newman | Manuel Figuerero | 1 día |
| Fase 5 | Pruebas de carga JMeter | Manuel Figuerero | 1 día |
| Fase 6 | Registro de defectos y reporte final | Ambos testers | 1 día |
| **Total** | | | **7 días** |

---

## 9. Métricas y Reportes

### 9.1 Métricas de ejecución
| Métrica | Fórmula | Meta |
|---|---|---|
| % Casos ejecutados | Ejecutados / Total × 100 | ≥ 80% |
| % Casos pasados | Pasados / Ejecutados × 100 | ≥ 85% |
| Densidad de defectos | Defectos / Casos ejecutados | Informativo |
| Defectos críticos abiertos | Conteo directo | 0 |

### 9.2 Reportes a generar
1. **Reporte Selenium:** Output de `pytest -v` con resultados por test
2. **Reporte Newman:** JSON generado por newman con resultados de cada request
3. **Reporte JMeter:** HTML generado por JMeter con gráficos de rendimiento
4. **Registro de defectos:** `docs/06-registro-defectos.md` actualizado

---

## 10. Actualización Final del Plan

> Esta sección se completa al finalizar la ejecución de las pruebas.

### 10.1 Resumen de ejecución final

| Tipo de prueba | Casos planificados | Casos ejecutados | Pasados | Fallidos |
|---|---|---|---|---|
| Manual | 4 | — | — | — |
| Selenium | 13 | — | — | — |
| Postman | 16 | — | — | — |
| JMeter (escenarios) | 4 | — | — | — |
| **Total** | **37** | — | — | — |

### 10.2 Defectos encontrados

| Severidad | Encontrados | Cerrados | Abiertos |
|---|---|---|---|
| Alta | — | — | — |
| Media | 1 (BUG-01) | 1 | 0 |
| Baja | 2 (BUG-02, BUG-03) | 0 | 2 |

### 10.3 Conclusión final
> _A completar al finalizar la ejecución._

### 10.4 Recomendaciones
- Implementar esperas explícitas en todos los tests Selenium para mayor robustez
- Agregar un endpoint de health-check (`/health`) para facilitar el monitoreo
- Considerar agregar tests de integración automatizados para el flujo completo paciente → reserva → médico confirma
