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
