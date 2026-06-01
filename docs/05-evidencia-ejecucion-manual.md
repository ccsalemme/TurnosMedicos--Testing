# Evidencia de Ejecución Manual
## Sistema de Gestión de Turnos Médicos

**Proyecto:** TurnosMédicos  
**Versión:** 1.0  
**Fecha:** Junio 2026  
**Testers:** Pilar Jimena García / Manuel Vicente Figuerero

---

> **Nota:** Este documento registra los casos de prueba ejecutados manualmente y que no están cubiertos por automatización (Selenium o Postman). Para la evidencia fotográfica (capturas de pantalla), adjuntar imágenes en la carpeta `docs/screenshots/` referenciadas a continuación.

---

## CP-04.3 — Intentar cancelar turno fuera de la ventana de cancelación

**Fecha de ejecución:** Junio 2026  
**Tester:** [Nombre del tester]  
**Ambiente:** Local — `http://localhost:5173`

### Precondiciones
- Backend corriendo en `localhost:3000`
- Frontend corriendo en `localhost:5173`
- Existe un turno con fecha en menos de 24 horas (dentro de la ventana de cancelación)
- Usuario logueado como `paciente@clinica.local`

### Pasos ejecutados
1. Abrir el navegador y navegar a `http://localhost:5173/login`
2. Ingresar email: `paciente@clinica.local` y contraseña: `Paciente123!`
3. Clic en "Ingresar"
4. Navegar al listado de turnos en `/patient`
5. Identificar un turno cuya fecha es en menos de 24 horas
6. Clic en el botón "Cancelar" de ese turno
7. Intentar confirmar la cancelación

### Resultado esperado
El sistema muestra un mensaje de error indicando que no es posible cancelar el turno porque está dentro de la ventana de cancelación de 24 horas.

### Resultado obtenido
```
[ Completar con el resultado real observado ]
[ Adjuntar screenshot: docs/screenshots/CP-04.3-resultado.png ]
```

### Estado: ⚠️ PENDIENTE DE EJECUCIÓN

---

## CP-05.1 — Confirmar turno pendiente (como médico)

**Fecha de ejecución:** Junio 2026  
**Tester:** [Nombre del tester]  
**Ambiente:** Local — `http://localhost:5173`

### Precondiciones
- Backend y frontend corriendo localmente
- Existe al menos un turno en estado PENDING asignado a doctor1@clinica.local

### Pasos ejecutados
1. Navegar a `http://localhost:5173/login`
2. Ingresar credenciales: `doctor1@clinica.local` / `Doctor123!`
3. Clic en "Ingresar"
4. Navegar al panel del médico
5. Localizar un turno en estado PENDIENTE
6. Clic en el botón "Confirmar"

### Resultado esperado
El turno cambia su estado de PENDIENTE a CONFIRMADO en la interfaz.

### Resultado obtenido
```
[ Completar con el resultado real observado ]
[ Adjuntar screenshot: docs/screenshots/CP-05.1-antes.png ]
[ Adjuntar screenshot: docs/screenshots/CP-05.1-despues.png ]
```

### Estado: ⚠️ PENDIENTE DE EJECUCIÓN

---

## CP-05.2 — Registrar no-show

**Fecha de ejecución:** Junio 2026  
**Tester:** [Nombre del tester]  
**Ambiente:** Local — `http://localhost:5173`

### Precondiciones
- Existe un turno en estado CONFIRMED cuya hora de inicio ya pasó
- Usuario logueado como médico (doctor1@clinica.local)

### Pasos ejecutados
1. Login como doctor1@clinica.local
2. Navegar al panel del médico
3. Localizar turno CONFIRMED con fecha pasada
4. Clic en "No se presentó" (No-show)

### Resultado esperado
El turno cambia al estado NO_SHOW. Se registra en el sistema con la acción de auditoría correspondiente.

### Resultado obtenido
```
[ Completar con el resultado real observado ]
[ Adjuntar screenshot: docs/screenshots/CP-05.2-resultado.png ]
```

### Estado: ⚠️ PENDIENTE DE EJECUCIÓN

---

## CP-06.1 — Acceso al dashboard de administrador

**Fecha de ejecución:** Junio 2026  
**Tester:** [Nombre del tester]  
**Ambiente:** Local — `http://localhost:5173`

### Precondiciones
- Usuario logueado como admin@clinica.local

### Pasos ejecutados
1. Login como `admin@clinica.local` / `Admin123!`
2. Navegar al panel de administración
3. Acceder al dashboard de métricas
4. Verificar que se muestran métricas del sistema (total de turnos, usuarios, etc.)

### Resultado esperado
Dashboard visible con métricas: total de turnos por estado, número de médicos, número de pacientes, y cualquier indicador de actividad del sistema.

### Resultado obtenido
```
[ Completar con el resultado real observado ]
[ Adjuntar screenshot: docs/screenshots/CP-06.1-dashboard.png ]
```

### Estado: ⚠️ PENDIENTE DE EJECUCIÓN

---

## Pruebas Exploratorias Adicionales

Durante la ejecución manual se realizaron las siguientes pruebas exploratorias no planificadas:

| # | Área explorada | Hallazgo | Severidad |
|---|---|---|---|
| E-01 | Formulario de registro | Verificar campos obligatorios y mensajes de validación | — |
| E-02 | Navegación entre roles | Intentar acceder a rutas de admin siendo paciente | — |
| E-03 | Responsividad | Verificar visualización en pantalla reducida | — |

```
[ Completar con los hallazgos reales durante la exploración ]
```

---

## Instrucciones para completar este documento

1. Ejecutar cada caso de prueba en el ambiente local configurado
2. Tomar capturas de pantalla de los estados antes/después
3. Guardar capturas en `docs/screenshots/` con el nombre indicado
4. Reemplazar las secciones `[ Completar... ]` con los resultados reales
5. Cambiar el estado de ⚠️ PENDIENTE a ✅ PASADO o ❌ FALLIDO
