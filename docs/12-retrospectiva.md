# Retrospectiva del Equipo
## Sistema de Gestión de Turnos Médicos

**Proyecto:** TurnosMédicos  
**Fecha:** Junio 2026  
**Participantes:** Lara Vitale, Francisco Jarusz, Pilar Jimena García, Manuel Vicente Figuerero, Christian Carlos Salemme

---

## ¿Qué salió bien? ✅

- El sistema fue entregado con todas las funcionalidades principales operativas (autenticación, reserva de turnos, paneles diferenciados por rol)
- Se logró implementar automatización con Selenium cubriendo los flujos críticos (login, reserva, cancelación, edición de perfil)
- La colección de Postman permitió verificar rápidamente todos los endpoints de la API REST
- La separación clara entre roles (PATIENT, DOCTOR, ADMIN) facilitó tanto el desarrollo como el testing
- El sistema de logging del backend facilitó el diagnóstico de problemas durante las pruebas

---

## ¿Qué fue difícil o no salió como esperábamos? ⚠️

- La sincronización entre el frontend y el backend generó varios falsos positivos en los tests Selenium (el sleep fijo de `time.sleep()` no siempre fue suficiente en máquinas lentas)
- La función `test_reprogramar_turno` fue duplicada accidentalmente en `test_turnos.py`, lo que generó confusión durante la ejecución
- La instalación de JMeter y la configuración de los escenarios de carga tomó más tiempo del esperado
- Coordinar la ejecución de pruebas mientras el estado del mock-data.json se modificaba entre tests fue un desafío

---

## ¿Qué aprendimos? 📚

- **Esperas explícitas vs implícitas en Selenium:** Aprendimos la diferencia entre `WebDriverWait` con condiciones específicas vs `time.sleep()`. Las esperas explícitas son más robustas y rápidas.
- **Importancia del seed de datos:** Tener un comando de reset (`npm run db:seed`) antes de cada suite de tests es crítico para garantizar reproducibilidad.
- **Trazabilidad desde el inicio:** Definir la matriz de trazabilidad desde el comienzo del proyecto habría facilitado identificar qué casos de prueba cubren qué requerimientos.
- **Pruebas no funcionales requieren planificación temprana:** Instalar y configurar JMeter fue más complejo de lo esperado; hubiera sido mejor planificarlo desde el inicio del sprint de testing.
- **Control de versiones de tests:** Igual que el código fuente, los scripts de testing deben revisarse en PR para evitar duplicados y errores.

---

## Decisiones relevantes tomadas

| Decisión | Motivo | Impacto |
|---|---|---|
| Usar pytest + Selenium en lugar de Playwright | Familiaridad del equipo con Python y Selenium | Curva de aprendizaje menor, pero playwright tiene mejor soporte para esperas asíncronas |
| Persistencia en JSON local | MVP rápido sin necesidad de DB real | Limitación para pruebas concurrentes reales (el archivo se bloquea) |
| Colección Postman como única fuente de prueba de API | Facilita compartir entre testers | Dependencia de Postman/Newman; considerar OpenAPI testing en el futuro |
| Correr tests con `time.sleep()` fijo | Decisión rápida para el MVP | Fragilidad en máquinas con diferente rendimiento; mejora pendiente |

---

## Próximos pasos recomendados (si el proyecto continuara)

1. Reemplazar `time.sleep()` por `WebDriverWait` explícitas en todos los tests Selenium
2. Agregar tests para el panel del médico (confirmar, completar, no-show) vía Selenium
3. Migrar de JSON local a una base de datos real (PostgreSQL/SQLite) para soporte de concurrencia real
4. Implementar CI/CD con GitHub Actions para ejecutar los tests en cada push
5. Agregar cobertura de código con `pytest-cov`
