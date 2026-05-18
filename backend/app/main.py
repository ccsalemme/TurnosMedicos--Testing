from __future__ import annotations

from fastapi import APIRouter, FastAPI, Query, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import get_settings
from .errors import ApiException
from .schemas import (
    AppointmentStatus,
    CancelAppointmentIn,
    CreateAvailabilityIn,
    CreateBlockIn,
    CreateDoctorIn,
    CreateSiteIn,
    CreateSpecialtyIn,
    LoginIn,
    RegisterPatientIn,
    ReserveAppointmentIn,
    RescheduleAppointmentIn,
    Role,
    UpdateAvailabilityIn,
    UpdateDoctorIn,
    UpdateMyProfileIn,
    UpdateSettingIn,
    UpdateSiteIn,
    UpdateSpecialtyIn,
    UpdateUserRoleIn,
)
from .store import MockDataStore, now_iso

settings = get_settings()
store = MockDataStore(
    data_file_path=settings.mock_data_file,
    jwt_secret=settings.jwt_secret,
    jwt_expires_in=settings.jwt_expires_in,
    default_cancellation_window_hours=settings.default_cancellation_window_hours
)

app = FastAPI(title='Turnos Medicos API (Python)', version='1.0.0')
app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'] + (settings.cors_origins or []),
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*']
)

router = APIRouter(prefix='/api/v1')


def success_response(request: Request, data: object) -> dict[str, object]:
    return {
        'success': True,
        'data': data,
        'timestamp': now_iso(),
        'path': request.url.path
    }


def error_response(request: Request, status: int, message: str, details: object | None = None) -> dict[str, object]:
    return {
        'success': False,
        'error': {
            'status': status,
            'message': message,
            'details': details
        },
        'timestamp': now_iso(),
        'path': request.url.path
    }


def require_auth(request: Request, roles: list[Role] | None = None) -> dict[str, object]:
    auth_header = request.headers.get('authorization')
    token = auth_header[7:] if auth_header and auth_header.startswith('Bearer ') else None
    user = store.get_auth_user_from_token(token)

    if roles:
        store.ensure_role(user, roles)

    return user


@app.exception_handler(ApiException)
async def api_exception_handler(request: Request, exc: ApiException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status,
        content=error_response(request, exc.status, exc.message, exc.details)
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=400,
        content=error_response(request, 400, 'Error en la solicitud', exc.errors())
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, _: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content=error_response(request, 500, 'Error interno del servidor', None)
    )


@router.post('/auth/register')
def register_patient(request: Request, dto: RegisterPatientIn):
    data = store.register_patient(dto.model_dump())
    return success_response(request, data)


@router.post('/auth/login')
def login(request: Request, dto: LoginIn):
    data = store.login(dto.model_dump())
    return success_response(request, data)


@router.get('/auth/me')
def me(request: Request):
    user = require_auth(request)
    data = store.me(str(user['id']))
    return success_response(request, data)


@router.get('/users/me')
def my_profile(request: Request):
    user = require_auth(request)
    data = store.get_my_profile(str(user['id']))
    return success_response(request, data)


@router.patch('/users/me')
def update_my_profile(request: Request, dto: UpdateMyProfileIn):
    user = require_auth(request)
    data = store.update_my_profile(str(user['id']), dto.model_dump(exclude_none=True))
    return success_response(request, data)


@router.get('/specialties')
def list_specialties(request: Request):
    data = store.list_specialties(True)
    return success_response(request, data)


@router.get('/specialties/admin/all')
def list_all_specialties(request: Request):
    require_auth(request, [Role.ADMIN])
    data = store.list_specialties(False)
    return success_response(request, data)


@router.post('/specialties')
def create_specialty(request: Request, dto: CreateSpecialtyIn):
    user = require_auth(request, [Role.ADMIN])
    data = store.create_specialty(user, dto.model_dump(exclude_none=True))
    return success_response(request, data)


@router.patch('/specialties/{specialty_id}')
def update_specialty(request: Request, specialty_id: str, dto: UpdateSpecialtyIn):
    user = require_auth(request, [Role.ADMIN])
    data = store.update_specialty(user, specialty_id, dto.model_dump(exclude_none=True))
    return success_response(request, data)


@router.get('/doctors')
def list_doctors(request: Request, specialtyId: str | None = None, siteId: str | None = None):
    data = store.list_doctors({'specialtyId': specialtyId, 'siteId': siteId})
    return success_response(request, data)


@router.post('/doctors')
def create_doctor(request: Request, dto: CreateDoctorIn):
    user = require_auth(request, [Role.ADMIN])
    data = store.create_doctor(user, dto.model_dump(exclude_none=True))
    return success_response(request, data)


@router.patch('/doctors/{doctor_id}')
def update_doctor(request: Request, doctor_id: str, dto: UpdateDoctorIn):
    user = require_auth(request, [Role.ADMIN])
    data = store.update_doctor(user, doctor_id, dto.model_dump(exclude_none=True))
    return success_response(request, data)


@router.get('/availability/doctor/{doctor_user_id}')
def get_doctor_agenda(
    request: Request,
    doctor_user_id: str,
    from_value: str | None = Query(default=None, alias='from'),
    to_value: str | None = Query(default=None, alias='to')
):
    data = store.get_doctor_agenda(doctor_user_id, from_value, to_value)
    return success_response(request, data)


@router.post('/availability/slots')
def create_availability(request: Request, dto: CreateAvailabilityIn):
    user = require_auth(request, [Role.DOCTOR, Role.ADMIN])
    data = store.create_availability(user, dto.model_dump(exclude_none=True))
    return success_response(request, data)


@router.patch('/availability/slots/{availability_id}')
def update_availability(request: Request, availability_id: str, dto: UpdateAvailabilityIn):
    user = require_auth(request, [Role.DOCTOR, Role.ADMIN])
    data = store.update_availability(user, availability_id, dto.model_dump(exclude_none=True))
    return success_response(request, data)


@router.delete('/availability/slots/{availability_id}')
def delete_availability(request: Request, availability_id: str):
    user = require_auth(request, [Role.DOCTOR, Role.ADMIN])
    data = store.delete_availability(user, availability_id)
    return success_response(request, data)


@router.post('/availability/blocks')
def create_block(request: Request, dto: CreateBlockIn):
    user = require_auth(request, [Role.DOCTOR, Role.ADMIN])
    data = store.create_block(user, dto.model_dump(exclude_none=True))
    return success_response(request, data)


@router.delete('/availability/blocks/{block_id}')
def delete_block(request: Request, block_id: str):
    user = require_auth(request, [Role.DOCTOR, Role.ADMIN])
    data = store.delete_block(user, block_id)
    return success_response(request, data)


@router.post('/appointments/reserve')
def reserve_appointment(request: Request, dto: ReserveAppointmentIn):
    user = require_auth(request, [Role.PATIENT])
    data = store.reserve_appointment(user, dto.model_dump(exclude_none=True))
    return success_response(request, data)


@router.get('/appointments/my')
def my_appointments(
    request: Request,
    status: AppointmentStatus | None = None,
    from_value: str | None = Query(default=None, alias='from'),
    to_value: str | None = Query(default=None, alias='to')
):
    user = require_auth(request, [Role.PATIENT, Role.DOCTOR, Role.ADMIN])
    data = store.get_my_appointments(user, {'status': status, 'from': from_value, 'to': to_value})
    return success_response(request, data)


@router.get('/appointments/admin/board')
def admin_board(
    request: Request,
    status: AppointmentStatus | None = None,
    from_value: str | None = Query(default=None, alias='from'),
    to_value: str | None = Query(default=None, alias='to'),
    doctorId: str | None = None,
    patientId: str | None = None
):
    user = require_auth(request, [Role.ADMIN])
    data = store.get_operational_board(
        user,
        {
            'status': status,
            'from': from_value,
            'to': to_value,
            'doctorId': doctorId,
            'patientId': patientId
        }
    )
    return success_response(request, data)


@router.patch('/appointments/{appointment_id}/cancel')
def cancel_appointment(request: Request, appointment_id: str, dto: CancelAppointmentIn):
    user = require_auth(request, [Role.PATIENT, Role.ADMIN])
    data = store.cancel_appointment(user, appointment_id, dto.model_dump(exclude_none=True))
    return success_response(request, data)


@router.patch('/appointments/{appointment_id}/reschedule')
def reschedule_appointment(request: Request, appointment_id: str, dto: RescheduleAppointmentIn):
    user = require_auth(request, [Role.PATIENT, Role.ADMIN])
    data = store.reschedule_appointment(user, appointment_id, dto.model_dump(exclude_none=True))
    return success_response(request, data)


@router.patch('/appointments/{appointment_id}/confirm')
def confirm_appointment(request: Request, appointment_id: str):
    user = require_auth(request, [Role.DOCTOR, Role.ADMIN])
    data = store.confirm_appointment(user, appointment_id)
    return success_response(request, data)


@router.patch('/appointments/{appointment_id}/complete')
def complete_appointment(request: Request, appointment_id: str):
    user = require_auth(request, [Role.DOCTOR, Role.ADMIN])
    data = store.complete_appointment(user, appointment_id)
    return success_response(request, data)


@router.patch('/appointments/{appointment_id}/no-show')
def no_show_appointment(request: Request, appointment_id: str):
    user = require_auth(request, [Role.DOCTOR, Role.ADMIN])
    data = store.no_show_appointment(user, appointment_id)
    return success_response(request, data)


@router.get('/admin/users')
def admin_users(request: Request, role: Role | None = None):
    user = require_auth(request, [Role.ADMIN])
    data = store.admin_users(user, role)
    return success_response(request, data)


@router.patch('/admin/users/{user_id}/role')
def admin_update_user_role(request: Request, user_id: str, dto: UpdateUserRoleIn):
    user = require_auth(request, [Role.ADMIN])
    data = store.admin_update_user_role(user, user_id, dto.model_dump(exclude_none=True))
    return success_response(request, data)


@router.get('/admin/sites')
def admin_sites(request: Request):
    user = require_auth(request, [Role.ADMIN])
    data = store.admin_sites(user)
    return success_response(request, data)


@router.post('/admin/sites')
def admin_create_site(request: Request, dto: CreateSiteIn):
    user = require_auth(request, [Role.ADMIN])
    data = store.admin_create_site(user, dto.model_dump(exclude_none=True))
    return success_response(request, data)


@router.patch('/admin/sites/{site_id}')
def admin_update_site(request: Request, site_id: str, dto: UpdateSiteIn):
    user = require_auth(request, [Role.ADMIN])
    data = store.admin_update_site(user, site_id, dto.model_dump(exclude_none=True))
    return success_response(request, data)


@router.get('/admin/settings')
def admin_settings(request: Request):
    user = require_auth(request, [Role.ADMIN])
    data = store.admin_settings(user)
    return success_response(request, data)


@router.put('/admin/settings/{key}')
def admin_update_setting(request: Request, key: str, dto: UpdateSettingIn):
    user = require_auth(request, [Role.ADMIN])
    data = store.admin_update_setting(user, key, dto.value)
    return success_response(request, data)


@router.get('/admin/dashboard')
def admin_dashboard(request: Request):
    user = require_auth(request, [Role.ADMIN])
    data = store.admin_dashboard(user)
    return success_response(request, data)


@router.get('/audit')
def audit_logs(
    request: Request,
    action: str | None = None,
    entity: str | None = None,
    actorId: str | None = None,
    from_value: str | None = Query(default=None, alias='from'),
    to_value: str | None = Query(default=None, alias='to')
):
    user = require_auth(request, [Role.ADMIN])
    data = store.audit_logs(
        user,
        {
            'action': action,
            'entity': entity,
            'actorId': actorId,
            'from': from_value,
            'to': to_value
        }
    )
    return success_response(request, data)


app.include_router(router)
