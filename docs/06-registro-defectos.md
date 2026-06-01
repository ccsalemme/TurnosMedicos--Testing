# Registro de Defectos
## Sistema de Gestión de Turnos Médicos

**Proyecto:** TurnosMédicos  
**Versión:** 1.0  
**Fecha:** Junio 2026

---

## Tabla de Defectos

| ID | Descripción | Módulo | Severidad | Prioridad | Estado |
|---|---|---|---|---|---|
| BUG-01 | Función `test_reprogramar_turno` duplicada en test_turnos.py | Automatización | Media | Media | Corregido |
| BUG-02 | El botón "Cerrar sesión" busca texto exacto sin tilde ("Cerrar sesion") pero el frontend puede usar tilde | Autenticación | Baja | Baja | Abierto |
| BUG-03 | `time.sleep()` fijo en lugar de esperas explícitas en varios tests Selenium | Automatización | Baja | Baja | Abierto |

---

## Detalle de Defectos

### BUG-01 — Función test_reprogramar_turno duplicada

| Campo | Detalle |
|---|---|
| **ID** | BUG-01 |
| **Título** | La función `test_reprogramar_turno` está definida dos veces en `test_turnos.py` |
| **Módulo** | Automatización / Selenium |
| **Severidad** | Media |
| **Prioridad** | Media |
| **Estado** | Corregido |
| **Encontrado en** | `tests/test_turnos.py`, líneas 118 y 162 |
| **Reportado por** | Manuel Figuerero |
| **Fecha** | Junio 2026 |
| **Pasos para reproducir** | 1. Abrir `tests/test_turnos.py` 2. Buscar la función `test_reprogramar_turno` 3. Observar que aparece definida en línea 118 y nuevamente en línea 162 |
| **Resultado esperado** | La función aparece definida una sola vez |
| **Resultado obtenido** | Python ejecuta solo la segunda definición, silenciando silenciosamente la primera. El `if __name__ == "__main__"` duplicado en línea 198 también genera confusión |
| **Impacto** | pytest podría ejecutar la función dos veces, y la primera definición es ignorada por Python en ejecución directa |
| **Corrección aplicada** | Eliminar la definición duplicada (líneas 162–204) y dejar solo la primera |

---

### BUG-02 — Texto de botón "Cerrar sesion" sin tilde

| Campo | Detalle |
|---|---|
| **ID** | BUG-02 |
| **Título** | El selector XPath busca "Cerrar sesion" (sin tilde) pero el frontend podría mostrar "Cerrar sesión" (con tilde) |
| **Módulo** | Autenticación — Selenium |
| **Severidad** | Baja |
| **Prioridad** | Baja |
| **Estado** | Abierto — Requiere verificación |
| **Encontrado en** | `tests/test_auth.py`, línea 122 |
| **Reportado por** | Manuel Figuerero |
| **Fecha** | Junio 2026 |
| **Pasos para reproducir** | 1. Correr `test_cerrar_sesion()` con el frontend activo 2. Observar si el test falla al no encontrar el botón |
| **Resultado esperado** | El selector `//button[contains(text(), 'Cerrar sesion')]` encuentra el botón |
| **Resultado obtenido** | Si el frontend usa la ñ o la tilde, el selector falla con `NoSuchElementException` |
| **Corrección sugerida** | Usar `normalize-space()` o cambiar el selector a `contains(text(), 'Cerrar')` |

---

### BUG-03 — Uso de time.sleep() en lugar de esperas explícitas

| Campo | Detalle |
|---|---|
| **ID** | BUG-03 |
| **Título** | Los tests Selenium usan `time.sleep()` de duración fija en lugar de `WebDriverWait` con condiciones |
| **Módulo** | Automatización / Selenium — Todos los tests |
| **Severidad** | Baja |
| **Prioridad** | Baja |
| **Estado** | Abierto — Mejora de calidad |
| **Encontrado en** | `test_auth.py`, `test_turnos.py`, `test_perfil.py` — múltiples líneas |
| **Reportado por** | Manuel Figuerero |
| **Fecha** | Junio 2026 |
| **Impacto** | Los tests son innecesariamente lentos en máquinas rápidas y pueden fallar en máquinas lentas si el sleep no alcanza |
| **Corrección sugerida** | Reemplazar `time.sleep(N)` por `WebDriverWait(driver, N).until(EC.condition)` donde sea posible |
