# Evidencia de Pruebas No Funcionales con JMeter
## Sistema de Gestión de Turnos Médicos

**Proyecto:** TurnosMédicos  
**Versión:** 1.0  
**Fecha:** Junio 2026

---

## Herramienta utilizada

- **Apache JMeter 5.6+** — Herramienta open source para pruebas de carga y rendimiento
- **Plan de prueba:** `jmeter/TurnosMedicos-LoadTest.jmx`
- **Backend bajo prueba:** `http://localhost:3000/api/v1`

---

## Instalación de JMeter

```bash
# Descargar JMeter desde:
# https://jmeter.apache.org/download_jmeter.cgi

# macOS con Homebrew:
brew install jmeter

# Ejecutar GUI:
jmeter

# Ejecutar en modo headless (no-GUI, recomendado para carga):
jmeter -n -t jmeter/TurnosMedicos-LoadTest.jmx \
  -l jmeter/resultados.jtl \
  -e -o jmeter/reporte-html/
```

---

## Escenarios de carga diseñados

### Escenario E1 — Login masivo

| Parámetro | Valor |
|---|---|
| **Objetivo** | Verificar que el endpoint de login soporta múltiples usuarios simultáneos |
| **Endpoint** | POST `/api/v1/auth/login` |
| **Usuarios concurrentes** | 50 |
| **Ramp-up** | 10 segundos |
| **Duración** | 60 segundos |
| **Datos de entrada** | Email y password de los usuarios de prueba (rotación) |
| **Criterio de aceptación** | Tiempo promedio < 500ms, tasa de error < 1% |

### Escenario E2 — Consulta de turnos

| Parámetro | Valor |
|---|---|
| **Objetivo** | Verificar el rendimiento del endpoint de listado de turnos con múltiples usuarios |
| **Endpoint** | GET `/api/v1/appointments/my` |
| **Usuarios concurrentes** | 100 |
| **Ramp-up** | 20 segundos |
| **Duración** | 120 segundos |
| **Headers** | Authorization: Bearer {token} |
| **Criterio de aceptación** | Tiempo promedio < 1000ms, tasa de error < 1% |

### Escenario E3 — Reservas simultáneas

| Parámetro | Valor |
|---|---|
| **Objetivo** | Verificar que el sistema maneja correctamente reservas concurrentes sin inconsistencias |
| **Endpoint** | POST `/api/v1/appointments/reserve` |
| **Usuarios concurrentes** | 20 |
| **Ramp-up** | 5 segundos |
| **Duración** | 60 segundos |
| **Body** | JSON con doctorId, specialtyId, siteId, startAt válido |
| **Criterio de aceptación** | Tasa de error < 5%, no se generan turnos duplicados |

### Escenario E4 — Carga general mixta

| Parámetro | Valor |
|---|---|
| **Objetivo** | Simular un uso real del sistema con múltiples tipos de operaciones concurrentes |
| **Endpoints** | Mix: login, ver turnos, listar especialidades, listar médicos |
| **Usuarios concurrentes** | 30 |
| **Ramp-up** | 15 segundos |
| **Duración** | 180 segundos |
| **Criterio de aceptación** | Throughput > 10 req/s, tasa de error < 1% |

---

## Criterios de Aceptación de Rendimiento

| Métrica | Criterio | Endpoint |
|---|---|---|
| Tiempo promedio de respuesta (Login) | < 500 ms | POST /auth/login |
| Tiempo promedio de respuesta (Listado turnos) | < 1000 ms | GET /appointments/my |
| Percentil 95 de respuesta | < 2000 ms | Todos los endpoints |
| Tasa de error | < 1% | Todos los endpoints |
| Throughput mínimo | > 10 req/s | Carga general |

---

## Resultados de ejecución

> Completar con los resultados reales al ejecutar los escenarios con JMeter

### Resumen de resultados

| Escenario | Usuarios | Requests totales | Promedio (ms) | P95 (ms) | Tasa error | ¿Cumple? |
|---|---|---|---|---|---|---|
| E1 — Login masivo | 50 | — | — | — | — | — |
| E2 — Consulta turnos | 100 | — | — | — | — | — |
| E3 — Reservas simultáneas | 20 | — | — | — | — | — |
| E4 — Carga general | 30 | — | — | — | — | — |

### Detalle Escenario E1 — Login masivo
```
[ Pegar aquí el resumen del reporte JMeter para E1 ]
[ Adjuntar screenshot: docs/screenshots/jmeter-E1-summary.png ]
```

### Detalle Escenario E2 — Consulta de turnos
```
[ Pegar aquí el resumen del reporte JMeter para E2 ]
[ Adjuntar screenshot: docs/screenshots/jmeter-E2-summary.png ]
```

### Detalle Escenario E3 — Reservas simultáneas
```
[ Pegar aquí el resumen del reporte JMeter para E3 ]
[ Adjuntar screenshot: docs/screenshots/jmeter-E3-summary.png ]
```

### Detalle Escenario E4 — Carga general
```
[ Pegar aquí el resumen del reporte JMeter para E4 ]
[ Adjuntar screenshot: docs/screenshots/jmeter-E4-summary.png ]
```

---

## Reporte HTML de JMeter

Ejecutar con el siguiente comando para generar el reporte HTML interactivo:

```bash
jmeter -n -t jmeter/TurnosMedicos-LoadTest.jmx \
  -l jmeter/resultados.jtl \
  -e -o jmeter/reporte-html/
```

El reporte estará disponible en: `jmeter/reporte-html/index.html`

---

## Observaciones y conclusiones

```
[ Completar con las observaciones del equipo tras ejecutar las pruebas ]
[ Ejemplos:
  - "El endpoint de login respondió en promedio 150ms con 50 usuarios, cumpliendo el criterio"
  - "Se detectaron timeouts ocasionales en el escenario E3 bajo alta concurrencia"
  - "El sistema requeriría una base de datos real para soportar producción real"
]
```
