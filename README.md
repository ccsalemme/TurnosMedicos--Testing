# Turnos Medicos - MVP Full Stack

Aplicacion de gestion de turnos medicos con:
- Frontend: React + Vite
- Backend: FastAPI (Python)
- Persistencia backend: archivo JSON local

## Arquitectura actual

- Backend Python en `backend/app`.
- Punto de entrada API en `backend/app/main.py`.
- Persistencia unica en `backend/data/mock-data.json`.
- Formato de respuesta estandar:
  - Exito: `{ success: true, data, timestamp, path }`
  - Error: `{ success: false, error: { status, message, details }, timestamp, path }`

## Requisitos

- Node.js 20+
- npm 10+
- Python 3.10+

## Instalacion

### Git Bash (recomendado)

```bash
cd /c/Users/L66760/OneDrive\ -\ Kimberly-Clark/Documents/UADE/TurnosMedicos-\ Testing
npm run install:all
python -m pip install -r backend/requirements.txt
```

### PowerShell (alternativa)

```powershell
Set-Location "C:\Users\L66760\OneDrive - Kimberly-Clark\Documents\UADE\TurnosMedicos- Testing"
npm.cmd run install:all
python -m pip install -r backend/requirements.txt
```

Tambien podes instalar dependencias Python con:

```bash
npm run install:backend
```

## Configuracion

Copiar `backend/.env.example` a `backend/.env` y ajustar si hace falta:

```env
PORT=3000
MOCK_DATA_FILE="./data/mock-data.json"
JWT_SECRET="change_this_secret"
JWT_EXPIRES_IN="8h"
CORS_ORIGIN="http://localhost:5173"
DEFAULT_CANCELLATION_WINDOW_HOURS=24
```

Para frontend, copiar `frontend/.env.example` a `frontend/.env`.

## Ejecucion local

Terminal 1 (backend):

```bash
npm run dev:backend
```

Terminal 2 (frontend):

```bash
npm run dev:frontend
```

URLs:
- API: `http://localhost:3000/api/v1`
- Frontend: `http://localhost:5173`

## Seed de datos JSON

Regenerar dataset de ejemplo en `backend/data/mock-data.json`:

```bash
npm run db:seed
```

## Credenciales demo

- Admin: `admin@clinica.local` / `Admin123!`
- Medico: `doctor1@clinica.local` / `Doctor123!`
- Medico: `doctor2@clinica.local` / `Doctor123!`
- Medico: `doctor3@clinica.local` / `Doctor123!`
- Paciente: `paciente@clinica.local` / `Paciente123!`
- Paciente: `paciente2@clinica.local` / `Paciente123!`
- Paciente: `paciente3@clinica.local` / `Paciente123!`

## Deploy publico gratuito (GitHub Pages + Render)

Esta opcion publica la app para usuarios externos:
- Frontend en GitHub Pages (automatico por GitHub Actions).
- Backend FastAPI en Render (plan free).

### 1) Publicar backend en Render

1. Subi el repositorio a GitHub.
2. En Render, crear un nuevo Web Service desde el repo.
3. Render detecta `render.yaml` y precarga configuracion de build/start.
4. Definir variables de entorno obligatorias:
  - `JWT_SECRET`: un secreto fuerte.
  - `CORS_ORIGIN`: URL publica del frontend (por ejemplo `https://<usuario>.github.io/<repo>`).

URL esperada del backend: `https://<tu-servicio>.onrender.com/api/v1`

### 2) Configurar GitHub Pages para frontend

Ya esta incluido el workflow:
- `.github/workflows/deploy-frontend-pages.yml`

Pasos:
1. En GitHub > Settings > Pages, seleccionar `GitHub Actions` como source.
2. En GitHub > Settings > Secrets and variables > Actions > Variables, crear:
  - `VITE_API_BASE_URL` = `https://<tu-servicio>.onrender.com/api/v1`
3. Hacer push a `main` para disparar el deploy.

URL esperada del frontend: `https://<usuario>.github.io/<repo>/`

### 3) Notas importantes

- En Pages se usa hash routing para evitar errores 404 al refrescar rutas.
- El backend free de Render puede "dormirse" y tardar en responder el primer request.
- La persistencia actual usa JSON local (`backend/data/mock-data.json`), por lo que no es ideal para produccion real.
