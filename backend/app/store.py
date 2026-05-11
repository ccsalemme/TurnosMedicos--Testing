from __future__ import annotations

import json
import os
import random
import re
import string
from datetime import datetime, timedelta, timezone
from pathlib import Path
from threading import RLock
from typing import Any

import jwt

from .errors import BadRequest, Forbidden, NotFound, Unauthorized
from .schemas import AppointmentStatus, Role

TAG_REGEX = re.compile(r'<[^>]*>')
EXPIRY_REGEX = re.compile(r'^(\d+)([smhd])$')

DEFAULT_SETTINGS = [{'key': 'CANCELLATION_WINDOW_HOURS', 'value': '24'}]
ACTIVE_BOOKING_STATUSES = {AppointmentStatus.PENDING.value, AppointmentStatus.CONFIRMED.value}


def sanitize_text(value: str) -> str:
    return TAG_REGEX.sub('', value).strip()


def sanitize_payload(payload: Any) -> Any:
    if payload is None:
        return payload

    if isinstance(payload, str):
        return sanitize_text(payload)

    if isinstance(payload, list):
        return [sanitize_payload(item) for item in payload]

    if isinstance(payload, dict):
        return {key: sanitize_payload(value) for key, value in payload.items()}

    return payload


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def to_iso(value: datetime) -> str:
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc).isoformat().replace('+00:00', 'Z')


def now_iso() -> str:
    return to_iso(now_utc())


def parse_iso_datetime(value: str) -> datetime:
    raw = value.strip()
    if raw.endswith('Z'):
        raw = f"{raw[:-1]}+00:00"

    parsed = datetime.fromisoformat(raw)
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def js_weekday(value: datetime) -> int:
    return (value.weekday() + 1) % 7


def parse_expiry_seconds(value: str) -> int:
    raw = value.strip().lower()
    match = EXPIRY_REGEX.match(raw)

    if not match:
        return 8 * 60 * 60

    amount = int(match.group(1))
    unit = match.group(2)

    if unit == 's':
        return amount
    if unit == 'm':
        return amount * 60
    if unit == 'h':
        return amount * 60 * 60
    if unit == 'd':
        return amount * 24 * 60 * 60

    return 8 * 60 * 60


def role_value(role: Role | str) -> str:
    if isinstance(role, Role):
        return role.value
    return str(role)


def status_value(status: AppointmentStatus | str) -> str:
    if isinstance(status, AppointmentStatus):
        return status.value
    return str(status)


class MockDataStore:
    def __init__(
        self,
        data_file_path: Path,
        jwt_secret: str,
        jwt_expires_in: str,
        default_cancellation_window_hours: int
    ):
        self.data_file_path = data_file_path
        self.jwt_secret = jwt_secret
        self.jwt_expires_in = jwt_expires_in
        self.default_cancellation_window_hours = default_cancellation_window_hours

        self._lock = RLock()

        self.users: list[dict[str, Any]] = []
        self.specialties: list[dict[str, Any]] = []
        self.sites: list[dict[str, Any]] = []
        self.availabilities: list[dict[str, Any]] = []
        self.blocks: list[dict[str, Any]] = []
        self.appointments: list[dict[str, Any]] = []
        self.settings: list[dict[str, Any]] = []
        self.audits: list[dict[str, Any]] = []

        self.initialize_store()

    def get_auth_user_from_token(self, token: str | None) -> dict[str, Any]:
        if not token:
            raise Unauthorized('Token requerido')

        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=['HS256'])
            user_id = payload.get('sub')

            user = next(
                (item for item in self.users if item.get('id') == user_id and item.get('isActive')),
                None
            )

            if not user:
                raise Unauthorized('Usuario no encontrado o inactivo')

            return {
                'id': user['id'],
                'email': user['email'],
                'role': user['role'],
                'firstName': user['firstName'],
                'lastName': user['lastName']
            }
        except Unauthorized:
            raise
        except Exception:
            raise Unauthorized('Token invalido')

    def ensure_role(self, user: dict[str, Any], roles: list[Role | str]) -> None:
        allowed_roles = {role_value(role) for role in roles}
        if user.get('role') not in allowed_roles:
            raise Forbidden('No autorizado')

    def register_patient(self, input_data: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            dto = sanitize_payload(input_data)
            email = dto['email'].lower()

            if any(user.get('email') == email for user in self.users):
                raise BadRequest('El email ya esta registrado')

            if any(user.get('patientProfile', {}).get('document') == dto['document'] for user in self.users):
                raise BadRequest('El documento ya esta registrado')

            user_id = self.new_id('usr')
            profile = {
                'id': self.new_id('pat'),
                'userId': user_id,
                'document': dto['document'],
                'birthDate': to_iso(parse_iso_datetime(dto['birthDate'])),
                'phone': dto['phone']
            }

            user = {
                'id': user_id,
                'email': email,
                'password': dto['password'],
                'role': Role.PATIENT.value,
                'isActive': True,
                'firstName': dto['firstName'],
                'lastName': dto['lastName'],
                'phone': dto['phone'],
                'patientProfile': profile
            }

            self.users.append(user)
            self.record_audit('PATIENT_REGISTER', 'USER', user['id'], user['id'], {'email': user['email']})
            return self.build_auth_response(user)

    def login(self, input_data: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            dto = sanitize_payload(input_data)
            email = dto['email'].lower()
            user = next((item for item in self.users if item.get('email') == email), None)

            if not user or user.get('password') != dto['password']:
                raise Unauthorized('Credenciales invalidas')

            if not user.get('isActive'):
                raise Unauthorized('Usuario inactivo')

            self.record_audit('LOGIN', 'USER', user['id'], user['id'])
            return self.build_auth_response(user)

    def me(self, user_id: str) -> dict[str, Any]:
        user = next((item for item in self.users if item.get('id') == user_id), None)
        if not user:
            raise Unauthorized('Usuario no encontrado')
        return self.to_public_user(user)

    def get_my_profile(self, user_id: str) -> dict[str, Any]:
        return self.me(user_id)

    def update_my_profile(self, user_id: str, input_data: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            dto = sanitize_payload(input_data)
            user = self.find_user(user_id)

            if dto.get('firstName'):
                user['firstName'] = dto['firstName']
            if dto.get('lastName'):
                user['lastName'] = dto['lastName']
            if dto.get('phone'):
                user['phone'] = dto['phone']
                if user.get('patientProfile'):
                    user['patientProfile']['phone'] = dto['phone']
            if dto.get('birthDate') and user.get('patientProfile'):
                user['patientProfile']['birthDate'] = to_iso(parse_iso_datetime(dto['birthDate']))

            self.record_audit('PROFILE_UPDATE', 'USER', user['id'], user['id'], {
                'updatedFields': list(dto.keys())
            })

            return self.to_public_user(user)

    def list_specialties(self, active_only: bool = True) -> list[dict[str, Any]]:
        return sorted(
            [item for item in self.specialties if item.get('isActive') or not active_only],
            key=lambda item: item.get('name', '')
        )

    def create_specialty(self, actor: dict[str, Any], input_data: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            self.ensure_role(actor, [Role.ADMIN])
            dto = sanitize_payload(input_data)

            if any(item.get('name', '').lower() == dto['name'].lower() for item in self.specialties):
                raise BadRequest('La especialidad ya existe')

            specialty = {
                'id': self.new_id('spc'),
                'name': dto['name'],
                'description': dto.get('description'),
                'durationMinutes': dto['durationMinutes'],
                'isActive': dto.get('isActive', True)
            }

            self.specialties.append(specialty)
            self.record_audit('SPECIALTY_CREATE', 'SPECIALTY', specialty['id'], actor['id'], {'name': specialty['name']})
            return specialty

    def update_specialty(self, actor: dict[str, Any], specialty_id: str, input_data: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            self.ensure_role(actor, [Role.ADMIN])
            dto = sanitize_payload(input_data)

            specialty = next((item for item in self.specialties if item.get('id') == specialty_id), None)
            if not specialty:
                raise NotFound('Especialidad no encontrada')

            if 'name' in dto and dto.get('name'):
                specialty['name'] = dto['name']
            if 'description' in dto:
                specialty['description'] = dto.get('description')
            if 'durationMinutes' in dto and dto.get('durationMinutes') is not None:
                specialty['durationMinutes'] = dto['durationMinutes']
            if 'isActive' in dto and dto.get('isActive') is not None:
                specialty['isActive'] = dto['isActive']

            self.record_audit('SPECIALTY_UPDATE', 'SPECIALTY', specialty_id, actor['id'], {
                'updatedFields': list(dto.keys())
            })
            return specialty

    def list_doctors(self, query: dict[str, Any] | None = None) -> list[dict[str, Any]]:
        payload = query or {}
        doctors = [
            user for user in self.users
            if user.get('role') == Role.DOCTOR.value and user.get('isActive')
        ]

        result: list[dict[str, Any]] = []
        for doctor in doctors:
            profile = doctor.get('doctorProfile')
            if not profile:
                continue

            if payload.get('siteId') and profile.get('siteId') != payload.get('siteId'):
                continue

            if payload.get('specialtyId') and payload.get('specialtyId') not in profile.get('specialties', []):
                continue

            result.append(self.to_public_doctor(doctor))

        return result

    def create_doctor(self, actor: dict[str, Any], input_data: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            self.ensure_role(actor, [Role.ADMIN])
            dto = sanitize_payload(input_data)

            if any(item.get('email') == dto['email'].lower() for item in self.users):
                raise BadRequest('El email ya esta registrado')

            if any(item.get('doctorProfile', {}).get('licenseNumber') == dto['licenseNumber'] for item in self.users):
                raise BadRequest('La matricula ya esta registrada')

            self.ensure_specialties_exist(dto.get('specialtyIds', []))

            user_id = self.new_id('usr')
            profile = {
                'id': self.new_id('docp'),
                'userId': user_id,
                'licenseNumber': dto['licenseNumber'],
                'siteId': dto.get('siteId'),
                'bio': dto.get('bio'),
                'specialties': list(dto.get('specialtyIds', []))
            }

            doctor = {
                'id': user_id,
                'email': dto['email'].lower(),
                'password': dto['password'],
                'role': Role.DOCTOR.value,
                'isActive': True,
                'firstName': dto['firstName'],
                'lastName': dto['lastName'],
                'phone': dto['phone'],
                'doctorProfile': profile
            }

            self.users.append(doctor)
            self.record_audit('DOCTOR_CREATE', 'USER', doctor['id'], actor['id'], {
                'specialtyIds': dto.get('specialtyIds', [])
            })

            return self.to_public_doctor(doctor)

    def update_doctor(self, actor: dict[str, Any], doctor_user_id: str, input_data: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            self.ensure_role(actor, [Role.ADMIN])
            dto = sanitize_payload(input_data)

            doctor = self.find_user(doctor_user_id)
            if doctor.get('role') != Role.DOCTOR.value or not doctor.get('doctorProfile'):
                raise NotFound('Medico no encontrado')

            if 'specialtyIds' in dto:
                specialty_ids = dto.get('specialtyIds') or []
                self.ensure_specialties_exist(specialty_ids)
                doctor['doctorProfile']['specialties'] = list(specialty_ids)

            if dto.get('firstName'):
                doctor['firstName'] = dto['firstName']
            if dto.get('lastName'):
                doctor['lastName'] = dto['lastName']
            if dto.get('phone'):
                doctor['phone'] = dto['phone']
            if 'siteId' in dto:
                doctor['doctorProfile']['siteId'] = dto.get('siteId')
            if 'bio' in dto:
                doctor['doctorProfile']['bio'] = dto.get('bio')
            if 'isActive' in dto and dto.get('isActive') is not None:
                doctor['isActive'] = dto['isActive']

            self.record_audit('DOCTOR_UPDATE', 'USER', doctor['id'], actor['id'], {
                'updatedFields': list(dto.keys())
            })

            return self.to_public_doctor(doctor)

    def get_doctor_agenda(self, doctor_user_id: str, from_value: str | None = None, to_value: str | None = None) -> dict[str, Any]:
        doctor = self.find_user(doctor_user_id)
        if doctor.get('role') != Role.DOCTOR.value or not doctor.get('doctorProfile'):
            raise NotFound('Medico no encontrado')

        start = parse_iso_datetime(from_value).timestamp() if from_value else float('-inf')
        end = parse_iso_datetime(to_value).timestamp() if to_value else float('inf')
        doctor_profile_id = doctor['doctorProfile']['id']

        availabilities = sorted(
            [item for item in self.availabilities if item.get('doctorId') == doctor_profile_id],
            key=lambda item: item.get('weekday', 0)
        )

        blocks = []
        for item in self.blocks:
            if item.get('doctorId') != doctor_profile_id:
                continue

            start_at = parse_iso_datetime(item['startAt']).timestamp()
            end_at = parse_iso_datetime(item['endAt']).timestamp()
            if start_at >= start and end_at <= end:
                blocks.append(item)

        return {
            'availabilities': availabilities,
            'blocks': blocks
        }

    def create_availability(self, actor: dict[str, Any], input_data: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            dto = sanitize_payload(input_data)
            doctor_profile_id = self.resolve_doctor_profile_id(actor, dto.get('doctorUserId'))

            if dto['endTime'] <= dto['startTime']:
                raise BadRequest('La hora de fin debe ser mayor a la de inicio')

            availability = {
                'id': self.new_id('avl'),
                'doctorId': doctor_profile_id,
                'weekday': dto['weekday'],
                'startTime': dto['startTime'],
                'endTime': dto['endTime'],
                'isActive': dto.get('isActive', True)
            }

            self.availabilities.append(availability)
            self.record_audit('AVAILABILITY_CREATE', 'AVAILABILITY', availability['id'], actor['id'])
            return availability

    def update_availability(self, actor: dict[str, Any], availability_id: str, input_data: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            dto = sanitize_payload(input_data)

            availability = next((item for item in self.availabilities if item.get('id') == availability_id), None)
            if not availability:
                raise NotFound('Disponibilidad no encontrada')

            doctor_user_id = self.find_doctor_user_id_by_profile_id(availability['doctorId'])
            self.authorize_doctor_resource(actor, doctor_user_id)

            start_time = dto.get('startTime', availability['startTime'])
            end_time = dto.get('endTime', availability['endTime'])

            if end_time <= start_time:
                raise BadRequest('La hora de fin debe ser mayor a la de inicio')

            if 'weekday' in dto and dto.get('weekday') is not None:
                availability['weekday'] = dto['weekday']
            if 'startTime' in dto and dto.get('startTime') is not None:
                availability['startTime'] = dto['startTime']
            if 'endTime' in dto and dto.get('endTime') is not None:
                availability['endTime'] = dto['endTime']
            if 'isActive' in dto and dto.get('isActive') is not None:
                availability['isActive'] = dto['isActive']

            self.record_audit('AVAILABILITY_UPDATE', 'AVAILABILITY', availability['id'], actor['id'])
            return availability

    def delete_availability(self, actor: dict[str, Any], availability_id: str) -> dict[str, Any]:
        with self._lock:
            index = next((idx for idx, item in enumerate(self.availabilities) if item.get('id') == availability_id), -1)
            if index < 0:
                raise NotFound('Disponibilidad no encontrada')

            availability = self.availabilities[index]
            doctor_user_id = self.find_doctor_user_id_by_profile_id(availability['doctorId'])
            self.authorize_doctor_resource(actor, doctor_user_id)

            self.availabilities.pop(index)
            self.record_audit('AVAILABILITY_DELETE', 'AVAILABILITY', availability_id, actor['id'])
            return {'deleted': True}

    def create_block(self, actor: dict[str, Any], input_data: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            dto = sanitize_payload(input_data)
            doctor_profile_id = self.resolve_doctor_profile_id(actor, dto.get('doctorUserId'))

            start_at = parse_iso_datetime(dto['startAt'])
            end_at = parse_iso_datetime(dto['endAt'])

            if end_at <= start_at:
                raise BadRequest('El bloque debe tener una ventana valida')

            block = {
                'id': self.new_id('blk'),
                'doctorId': doctor_profile_id,
                'startAt': to_iso(start_at),
                'endAt': to_iso(end_at),
                'reason': dto.get('reason')
            }

            self.blocks.append(block)
            self.record_audit('AGENDA_BLOCK_CREATE', 'SCHEDULE_BLOCK', block['id'], actor['id'])
            return block

    def delete_block(self, actor: dict[str, Any], block_id: str) -> dict[str, Any]:
        with self._lock:
            index = next((idx for idx, item in enumerate(self.blocks) if item.get('id') == block_id), -1)
            if index < 0:
                raise NotFound('Bloque no encontrado')

            block = self.blocks[index]
            doctor_user_id = self.find_doctor_user_id_by_profile_id(block['doctorId'])
            self.authorize_doctor_resource(actor, doctor_user_id)

            self.blocks.pop(index)
            self.record_audit('AGENDA_BLOCK_DELETE', 'SCHEDULE_BLOCK', block_id, actor['id'])
            return {'deleted': True}

    def reserve_appointment(self, actor: dict[str, Any], input_data: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            self.ensure_role(actor, [Role.PATIENT])
            dto = sanitize_payload(input_data)

            doctor = self.find_user(dto['doctorId'])
            if doctor.get('role') != Role.DOCTOR.value or not doctor.get('doctorProfile') or not doctor.get('isActive'):
                raise NotFound('Medico no encontrado')

            specialty = self.find_specialty(dto['specialtyId'])
            if specialty['id'] not in doctor['doctorProfile'].get('specialties', []):
                raise BadRequest('El medico no atiende esta especialidad')

            self.find_site(dto['siteId'])

            start_at = parse_iso_datetime(dto['startAt'])
            if start_at <= now_utc():
                raise BadRequest('Solo puede reservar turnos futuros')

            end_at = start_at + timedelta(minutes=specialty['durationMinutes'])
            self.assert_agenda_availability(doctor['doctorProfile']['id'], start_at, end_at)
            self.assert_conflicts(doctor['id'], actor['id'], start_at, end_at)

            appointment = {
                'id': self.new_id('apt'),
                'patientId': actor['id'],
                'doctorId': doctor['id'],
                'specialtyId': specialty['id'],
                'siteId': dto['siteId'],
                'startAt': to_iso(start_at),
                'endAt': to_iso(end_at),
                'status': AppointmentStatus.PENDING.value,
                'notes': dto.get('notes'),
                'createdAt': now_iso(),
                'createdById': actor['id']
            }

            self.appointments.append(appointment)
            self.record_audit('APPOINTMENT_RESERVE', 'APPOINTMENT', appointment['id'], actor['id'])
            return self.to_public_appointment(appointment)

    def get_my_appointments(self, actor: dict[str, Any], query: dict[str, Any]) -> list[dict[str, Any]]:
        if actor.get('role') == Role.ADMIN.value:
            return self.list_appointments(query)

        if actor.get('role') == Role.DOCTOR.value:
            return self.list_appointments({**query, 'doctorId': actor['id']})

        return self.list_appointments({**query, 'patientId': actor['id']})

    def get_operational_board(self, actor: dict[str, Any], query: dict[str, Any]) -> list[dict[str, Any]]:
        self.ensure_role(actor, [Role.ADMIN])
        return self.list_appointments(query)

    def cancel_appointment(self, actor: dict[str, Any], appointment_id: str, input_data: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            dto = sanitize_payload(input_data)
            appointment = self.find_appointment(appointment_id)

            is_owner = appointment['patientId'] == actor['id']
            is_admin = actor.get('role') == Role.ADMIN.value

            if not is_owner and not is_admin:
                raise Forbidden('No autorizado para cancelar este turno')

            if appointment['status'] not in ACTIVE_BOOKING_STATUSES:
                raise BadRequest('Solo se pueden cancelar turnos pendientes o confirmados')

            if is_owner:
                diff_hours = (parse_iso_datetime(appointment['startAt']) - now_utc()).total_seconds() / 3600
                setting_value = next(
                    (item.get('value') for item in self.settings if item.get('key') == 'CANCELLATION_WINDOW_HOURS'),
                    str(self.default_cancellation_window_hours)
                )
                hours_window = float(setting_value)

                if diff_hours < hours_window:
                    raise BadRequest(f'Solo se puede cancelar con {int(hours_window)} horas de anticipacion')

            appointment['status'] = AppointmentStatus.CANCELED.value
            appointment['cancellationReason'] = dto.get('reason')
            appointment['updatedById'] = actor['id']

            self.record_audit('APPOINTMENT_CANCEL', 'APPOINTMENT', appointment['id'], actor['id'])
            return self.to_public_appointment(appointment)

    def reschedule_appointment(self, actor: dict[str, Any], appointment_id: str, input_data: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            dto = sanitize_payload(input_data)
            appointment = self.find_appointment(appointment_id)

            is_owner = appointment['patientId'] == actor['id']
            is_admin = actor.get('role') == Role.ADMIN.value

            if not is_owner and not is_admin:
                raise Forbidden('No autorizado para reprogramar este turno')

            if appointment['status'] not in ACTIVE_BOOKING_STATUSES:
                raise BadRequest('Solo se pueden reprogramar turnos pendientes o confirmados')

            new_start_at = parse_iso_datetime(dto['newStartAt'])
            if new_start_at <= now_utc():
                raise BadRequest('La nueva fecha debe ser valida y futura')

            specialty = self.find_specialty_for_any_state(appointment['specialtyId'])
            new_end_at = new_start_at + timedelta(minutes=specialty['durationMinutes'])

            doctor = self.find_user(appointment['doctorId'])
            if not doctor.get('doctorProfile'):
                raise NotFound('Perfil medico no encontrado')

            self.assert_agenda_availability(doctor['doctorProfile']['id'], new_start_at, new_end_at)
            self.assert_conflicts(appointment['doctorId'], appointment['patientId'], new_start_at, new_end_at, appointment['id'])

            appointment['startAt'] = to_iso(new_start_at)
            appointment['endAt'] = to_iso(new_end_at)
            appointment['status'] = AppointmentStatus.PENDING.value
            appointment['updatedById'] = actor['id']

            self.record_audit('APPOINTMENT_RESCHEDULE', 'APPOINTMENT', appointment['id'], actor['id'])
            return self.to_public_appointment(appointment)

    def confirm_appointment(self, actor: dict[str, Any], appointment_id: str) -> dict[str, Any]:
        return self.transition_by_doctor(
            actor,
            appointment_id,
            AppointmentStatus.CONFIRMED,
            [AppointmentStatus.PENDING.value]
        )

    def complete_appointment(self, actor: dict[str, Any], appointment_id: str) -> dict[str, Any]:
        return self.transition_by_doctor(
            actor,
            appointment_id,
            AppointmentStatus.COMPLETED,
            [AppointmentStatus.CONFIRMED.value]
        )

    def no_show_appointment(self, actor: dict[str, Any], appointment_id: str) -> dict[str, Any]:
        return self.transition_by_doctor(
            actor,
            appointment_id,
            AppointmentStatus.NO_SHOW,
            [AppointmentStatus.CONFIRMED.value]
        )

    def admin_users(self, actor: dict[str, Any], role: Role | str | None = None) -> list[dict[str, Any]]:
        self.ensure_role(actor, [Role.ADMIN])
        target_role = role_value(role) if role else None

        return [
            self.to_public_user(item)
            for item in sorted(
                [item for item in self.users if not target_role or item.get('role') == target_role],
                key=lambda item: f"{item.get('role', '')}-{item.get('lastName', '')}"
            )
        ]

    def admin_update_user_role(self, actor: dict[str, Any], user_id: str, input_data: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            self.ensure_role(actor, [Role.ADMIN])
            dto = sanitize_payload(input_data)

            if actor['id'] == user_id and dto.get('isActive') is False:
                raise BadRequest('No puede desactivarse a si mismo')

            user = self.find_user(user_id)
            user['role'] = role_value(dto['role'])

            if 'isActive' in dto and dto.get('isActive') is not None:
                user['isActive'] = dto['isActive']

            self.record_audit('ADMIN_UPDATE_USER_ROLE', 'USER', user['id'], actor['id'])
            return self.to_public_user(user)

    def admin_sites(self, actor: dict[str, Any]) -> list[dict[str, Any]]:
        self.ensure_role(actor, [Role.ADMIN])
        return sorted([*self.sites], key=lambda item: item.get('name', ''))

    def admin_create_site(self, actor: dict[str, Any], input_data: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            self.ensure_role(actor, [Role.ADMIN])
            dto = sanitize_payload(input_data)

            site = {
                'id': self.new_id('ste'),
                'name': dto['name'],
                'address': dto['address'],
                'isActive': dto.get('isActive', True)
            }

            self.sites.append(site)
            self.record_audit('SITE_CREATE', 'SITE', site['id'], actor['id'])
            return site

    def admin_update_site(self, actor: dict[str, Any], site_id: str, input_data: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            self.ensure_role(actor, [Role.ADMIN])
            dto = sanitize_payload(input_data)

            site = self.find_site(site_id)
            if dto.get('name'):
                site['name'] = dto['name']
            if dto.get('address'):
                site['address'] = dto['address']
            if 'isActive' in dto and dto.get('isActive') is not None:
                site['isActive'] = dto['isActive']

            self.record_audit('SITE_UPDATE', 'SITE', site['id'], actor['id'])
            return site

    def admin_settings(self, actor: dict[str, Any]) -> list[dict[str, Any]]:
        self.ensure_role(actor, [Role.ADMIN])
        return [*self.settings]

    def admin_update_setting(self, actor: dict[str, Any], key: str, value: str) -> dict[str, Any]:
        with self._lock:
            self.ensure_role(actor, [Role.ADMIN])

            setting = next((item for item in self.settings if item.get('key') == key), None)
            if setting:
                setting['value'] = value
                self.record_audit('SETTING_UPDATE', 'SYSTEM_SETTING', key, actor['id'], {'value': value})
                return setting

            created = {'key': key, 'value': value}
            self.settings.append(created)
            self.record_audit('SETTING_UPDATE', 'SYSTEM_SETTING', key, actor['id'], {'value': value})
            return created

    def admin_dashboard(self, actor: dict[str, Any]) -> dict[str, Any]:
        self.ensure_role(actor, [Role.ADMIN])

        current = now_utc()
        next_week = current + timedelta(days=7)

        counters = {
            'totalAppointments': len(self.appointments),
            'pendingAppointments': len([a for a in self.appointments if a.get('status') == AppointmentStatus.PENDING.value]),
            'confirmedAppointments': len([a for a in self.appointments if a.get('status') == AppointmentStatus.CONFIRMED.value]),
            'completedAppointments': len([a for a in self.appointments if a.get('status') == AppointmentStatus.COMPLETED.value]),
            'noShowAppointments': len([a for a in self.appointments if a.get('status') == AppointmentStatus.NO_SHOW.value]),
            'canceledAppointments': len([a for a in self.appointments if a.get('status') == AppointmentStatus.CANCELED.value])
        }

        upcoming = []
        for appointment in self.appointments:
            status = appointment.get('status')
            start = parse_iso_datetime(appointment['startAt'])
            if status not in ACTIVE_BOOKING_STATUSES:
                continue
            if not (start > current and start < next_week):
                continue
            upcoming.append(appointment)

        upcoming = sorted(upcoming, key=lambda item: item['startAt'])[:20]

        return {
            'counters': counters,
            'upcoming': [self.to_public_appointment(item) for item in upcoming]
        }

    def audit_logs(self, actor: dict[str, Any], query: dict[str, Any] | None = None) -> list[dict[str, Any]]:
        self.ensure_role(actor, [Role.ADMIN])
        payload = query or {}

        from_ts = parse_iso_datetime(payload['from']).timestamp() if payload.get('from') else float('-inf')
        to_ts = parse_iso_datetime(payload['to']).timestamp() if payload.get('to') else float('inf')

        filtered = []
        for item in self.audits:
            if payload.get('action') and item.get('action') != payload.get('action'):
                continue
            if payload.get('entity') and item.get('entity') != payload.get('entity'):
                continue
            if payload.get('actorId') and item.get('actorId') != payload.get('actorId'):
                continue

            created_ts = parse_iso_datetime(item['createdAt']).timestamp()
            if created_ts < from_ts or created_ts > to_ts:
                continue

            filtered.append(item)

        result = []
        for item in sorted(filtered, key=lambda value: value['createdAt'], reverse=True)[:200]:
            actor_data = None
            if item.get('actorId'):
                actor_user = next((user for user in self.users if user.get('id') == item['actorId']), None)
                if actor_user:
                    actor_data = {
                        'id': actor_user['id'],
                        'firstName': actor_user['firstName'],
                        'lastName': actor_user['lastName'],
                        'email': actor_user['email'],
                        'role': actor_user['role']
                    }

            result.append({
                'id': item['id'],
                'action': item['action'],
                'entity': item['entity'],
                'entityId': item.get('entityId'),
                'createdAt': item['createdAt'],
                'actor': actor_data,
                'metadata': item.get('metadata')
            })

        return result

    def reset_to_bootstrap(self) -> None:
        with self._lock:
            self.users.clear()
            self.specialties.clear()
            self.sites.clear()
            self.availabilities.clear()
            self.blocks.clear()
            self.appointments.clear()
            self.settings.clear()
            self.audits.clear()
            self.bootstrap_data()
            self.persist_store()

    def initialize_store(self) -> None:
        loaded = self.load_store_from_disk()

        if loaded:
            self.apply_store(loaded)
            return

        self.bootstrap_data()
        self.persist_store()

    def load_store_from_disk(self) -> dict[str, Any] | None:
        if not self.data_file_path.exists():
            return None

        try:
            parsed = json.loads(self.data_file_path.read_text(encoding='utf-8'))

            return {
                'users': parsed.get('users', []) if isinstance(parsed.get('users'), list) else [],
                'specialties': parsed.get('specialties', []) if isinstance(parsed.get('specialties'), list) else [],
                'sites': parsed.get('sites', []) if isinstance(parsed.get('sites'), list) else [],
                'availabilities': parsed.get('availabilities', []) if isinstance(parsed.get('availabilities'), list) else [],
                'blocks': parsed.get('blocks', []) if isinstance(parsed.get('blocks'), list) else [],
                'appointments': parsed.get('appointments', []) if isinstance(parsed.get('appointments'), list) else [],
                'settings': parsed.get('settings', []) if isinstance(parsed.get('settings'), list) and len(parsed.get('settings')) > 0 else [*DEFAULT_SETTINGS],
                'audits': parsed.get('audits', []) if isinstance(parsed.get('audits'), list) else []
            }
        except Exception:
            return None

    def apply_store(self, store: dict[str, Any]) -> None:
        self.users = list(store['users'])
        self.specialties = list(store['specialties'])
        self.sites = list(store['sites'])
        self.availabilities = list(store['availabilities'])
        self.blocks = list(store['blocks'])
        self.appointments = list(store['appointments'])
        self.settings = list(store['settings']) if store['settings'] else [*DEFAULT_SETTINGS]
        self.audits = list(store['audits'])

    def get_store_snapshot(self) -> dict[str, Any]:
        return {
            'users': self.users,
            'specialties': self.specialties,
            'sites': self.sites,
            'availabilities': self.availabilities,
            'blocks': self.blocks,
            'appointments': self.appointments,
            'settings': self.settings,
            'audits': self.audits
        }

    def persist_store(self) -> None:
        self.data_file_path.parent.mkdir(parents=True, exist_ok=True)

        payload = json.dumps(self.get_store_snapshot(), indent=2)
        temp_path = Path(f'{self.data_file_path}.tmp')

        temp_path.write_text(payload, encoding='utf-8')
        os.replace(temp_path, self.data_file_path)

    def transition_by_doctor(
        self,
        actor: dict[str, Any],
        appointment_id: str,
        target: AppointmentStatus,
        allowed_current: list[str]
    ) -> dict[str, Any]:
        with self._lock:
            appointment = self.find_appointment(appointment_id)

            is_doctor_owner = actor.get('role') == Role.DOCTOR.value and appointment['doctorId'] == actor['id']
            is_admin = actor.get('role') == Role.ADMIN.value

            if not is_doctor_owner and not is_admin:
                raise Forbidden('No autorizado para actualizar este turno')

            if appointment['status'] not in allowed_current:
                raise BadRequest('Transicion de estado no permitida')

            appointment['status'] = target.value
            appointment['updatedById'] = actor['id']

            self.record_audit(f'APPOINTMENT_STATUS_{target.value}', 'APPOINTMENT', appointment['id'], actor['id'])
            return self.to_public_appointment(appointment)

    def list_appointments(self, query: dict[str, Any]) -> list[dict[str, Any]]:
        status = query.get('status')
        status_filter = status_value(status) if status else None

        from_ts = parse_iso_datetime(query['from']).timestamp() if query.get('from') else float('-inf')
        to_ts = parse_iso_datetime(query['to']).timestamp() if query.get('to') else float('inf')

        items = []
        for appointment in self.appointments:
            if status_filter and appointment.get('status') != status_filter:
                continue
            if query.get('doctorId') and appointment.get('doctorId') != query.get('doctorId'):
                continue
            if query.get('patientId') and appointment.get('patientId') != query.get('patientId'):
                continue

            start_ts = parse_iso_datetime(appointment['startAt']).timestamp()
            if start_ts < from_ts or start_ts > to_ts:
                continue

            items.append(appointment)

        return [self.to_public_appointment(item) for item in sorted(items, key=lambda item: item['startAt'])]

    def assert_agenda_availability(self, doctor_profile_id: str, start_at: datetime, end_at: datetime) -> None:
        weekday = js_weekday(start_at)
        start_time = start_at.strftime('%H:%M')
        end_time = end_at.strftime('%H:%M')

        in_availability = any(
            slot.get('doctorId') == doctor_profile_id
            and slot.get('isActive')
            and slot.get('weekday') == weekday
            and slot.get('startTime') <= start_time
            and slot.get('endTime') >= end_time
            for slot in self.availabilities
        )

        if not in_availability:
            raise BadRequest('La franja no se encuentra en agenda activa del medico')

        overlap_block = any(
            block.get('doctorId') == doctor_profile_id
            and parse_iso_datetime(block['startAt']) < end_at
            and parse_iso_datetime(block['endAt']) > start_at
            for block in self.blocks
        )

        if overlap_block:
            raise BadRequest('La franja seleccionada esta bloqueada por indisponibilidad')

    def assert_conflicts(
        self,
        doctor_id: str,
        patient_id: str,
        start_at: datetime,
        end_at: datetime,
        exclude_appointment_id: str | None = None
    ) -> None:
        has_doctor_conflict = any(
            (not exclude_appointment_id or appointment.get('id') != exclude_appointment_id)
            and appointment.get('doctorId') == doctor_id
            and appointment.get('status') in ACTIVE_BOOKING_STATUSES
            and parse_iso_datetime(appointment['startAt']) < end_at
            and parse_iso_datetime(appointment['endAt']) > start_at
            for appointment in self.appointments
        )

        if has_doctor_conflict:
            raise BadRequest('El medico ya tiene un turno en esa franja')

        has_patient_conflict = any(
            (not exclude_appointment_id or appointment.get('id') != exclude_appointment_id)
            and appointment.get('patientId') == patient_id
            and appointment.get('status') in ACTIVE_BOOKING_STATUSES
            and parse_iso_datetime(appointment['startAt']) < end_at
            and parse_iso_datetime(appointment['endAt']) > start_at
            for appointment in self.appointments
        )

        if has_patient_conflict:
            raise BadRequest('Ya tiene un turno reservado en esa franja')

    def resolve_doctor_profile_id(self, actor: dict[str, Any], target_doctor_user_id: str | None = None) -> str:
        if actor.get('role') == Role.DOCTOR.value:
            if target_doctor_user_id and target_doctor_user_id != actor['id']:
                raise Forbidden('No puede modificar agenda de otro medico')

            profile_id = self.find_user(actor['id']).get('doctorProfile', {}).get('id')
            if not profile_id:
                raise NotFound('Perfil medico no encontrado')

            return profile_id

        self.ensure_role(actor, [Role.ADMIN])

        if not target_doctor_user_id:
            raise BadRequest('doctorUserId es obligatorio para admin')

        target = self.find_user(target_doctor_user_id)
        if not target.get('doctorProfile'):
            raise NotFound('Perfil medico no encontrado')

        return target['doctorProfile']['id']

    def authorize_doctor_resource(self, actor: dict[str, Any], doctor_user_id: str) -> None:
        if actor.get('role') == Role.ADMIN.value:
            return

        if actor.get('role') != Role.DOCTOR.value or actor.get('id') != doctor_user_id:
            raise Forbidden('No autorizado para este recurso')

    def find_doctor_user_id_by_profile_id(self, profile_id: str) -> str:
        doctor = next((user for user in self.users if user.get('doctorProfile', {}).get('id') == profile_id), None)
        if not doctor:
            raise NotFound('Perfil medico no encontrado')
        return doctor['id']

    def find_user(self, user_id: str) -> dict[str, Any]:
        user = next((item for item in self.users if item.get('id') == user_id), None)
        if not user:
            raise NotFound('Usuario no encontrado')
        return user

    def find_specialty(self, specialty_id: str) -> dict[str, Any]:
        specialty = next(
            (item for item in self.specialties if item.get('id') == specialty_id and item.get('isActive')),
            None
        )
        if not specialty:
            raise NotFound('Especialidad no encontrada')
        return specialty

    def find_site(self, site_id: str) -> dict[str, Any]:
        site = next((item for item in self.sites if item.get('id') == site_id and item.get('isActive')), None)
        if not site:
            raise NotFound('Sede no disponible')
        return site

    def find_appointment(self, appointment_id: str) -> dict[str, Any]:
        appointment = next((item for item in self.appointments if item.get('id') == appointment_id), None)
        if not appointment:
            raise NotFound('Turno no encontrado')
        return appointment

    def ensure_specialties_exist(self, specialty_ids: list[str]) -> None:
        valid_ids = [item['id'] for item in self.specialties if item.get('isActive')]
        if not all(specialty_id in valid_ids for specialty_id in specialty_ids):
            raise BadRequest('Una o mas especialidades no son validas')

    def to_public_user(self, user: dict[str, Any]) -> dict[str, Any]:
        doctor_profile = user.get('doctorProfile')

        public_doctor_profile = None
        if doctor_profile:
            site = None
            if doctor_profile.get('siteId'):
                site = next((item for item in self.sites if item.get('id') == doctor_profile['siteId']), None)

            specialties = [
                {'specialty': next((item for item in self.specialties if item.get('id') == specialty_id), None)}
                for specialty_id in doctor_profile.get('specialties', [])
            ]

            public_doctor_profile = {
                **doctor_profile,
                'site': site,
                'specialties': specialties
            }

        return {
            'id': user['id'],
            'email': user['email'],
            'role': user['role'],
            'firstName': user['firstName'],
            'lastName': user['lastName'],
            'phone': user.get('phone'),
            'isActive': user.get('isActive'),
            'patientProfile': user.get('patientProfile') if user.get('patientProfile') else None,
            'doctorProfile': public_doctor_profile
        }

    def to_public_doctor(self, user: dict[str, Any]) -> dict[str, Any]:
        public_user = self.to_public_user(user)
        return {
            'id': public_user['id'],
            'firstName': public_user['firstName'],
            'lastName': public_user['lastName'],
            'email': public_user['email'],
            'phone': public_user.get('phone'),
            'doctorProfile': public_user.get('doctorProfile')
        }

    def to_public_appointment(self, appointment: dict[str, Any]) -> dict[str, Any]:
        patient = self.find_user(appointment['patientId'])
        doctor = self.find_user(appointment['doctorId'])
        specialty = self.find_specialty_for_any_state(appointment['specialtyId'])
        site = self.find_site_for_any_state(appointment['siteId'])

        return {
            'id': appointment['id'],
            'patientId': appointment['patientId'],
            'doctorId': appointment['doctorId'],
            'specialtyId': appointment['specialtyId'],
            'siteId': appointment['siteId'],
            'startAt': appointment['startAt'],
            'endAt': appointment['endAt'],
            'status': appointment['status'],
            'notes': appointment.get('notes'),
            'cancellationReason': appointment.get('cancellationReason'),
            'createdAt': appointment['createdAt'],
            'patient': {
                'id': patient['id'],
                'firstName': patient['firstName'],
                'lastName': patient['lastName'],
                'email': patient['email']
            },
            'doctor': {
                'id': doctor['id'],
                'firstName': doctor['firstName'],
                'lastName': doctor['lastName'],
                'email': doctor['email']
            },
            'specialty': specialty,
            'site': site
        }

    def find_specialty_for_any_state(self, specialty_id: str) -> dict[str, Any]:
        specialty = next((item for item in self.specialties if item.get('id') == specialty_id), None)
        if not specialty:
            raise NotFound('Especialidad no encontrada')
        return specialty

    def find_site_for_any_state(self, site_id: str) -> dict[str, Any]:
        site = next((item for item in self.sites if item.get('id') == site_id), None)
        if not site:
            raise NotFound('Sede no encontrada')
        return site

    def build_auth_response(self, user: dict[str, Any]) -> dict[str, Any]:
        access_token = self.create_access_token(user)
        return {
            'accessToken': access_token,
            'user': self.to_public_user(user)
        }

    def create_access_token(self, user: dict[str, Any]) -> str:
        exp_seconds = parse_expiry_seconds(self.jwt_expires_in)
        payload = {
            'sub': user['id'],
            'email': user['email'],
            'role': user['role'],
            'exp': now_utc() + timedelta(seconds=exp_seconds)
        }
        return jwt.encode(payload, self.jwt_secret, algorithm='HS256')

    def new_id(self, prefix: str) -> str:
        suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
        return f'{prefix}_{suffix}'

    def record_audit(
        self,
        action: str,
        entity: str,
        entity_id: str | None = None,
        actor_id: str | None = None,
        metadata: dict[str, Any] | None = None
    ) -> None:
        self.audits.append({
            'id': self.new_id('adt'),
            'action': action,
            'entity': entity,
            'entityId': entity_id,
            'actorId': actor_id,
            'metadata': metadata,
            'createdAt': now_iso()
        })
        self.persist_store()

    def bootstrap_data(self) -> None:
        site_centro = {
            'id': 'site_centro',
            'name': 'Sede Centro',
            'address': 'Av. Principal 123',
            'isActive': True
        }
        site_norte = {
            'id': 'site_norte',
            'name': 'Sede Norte',
            'address': 'Calle Salud 456',
            'isActive': True
        }
        site_sur = {
            'id': 'site_sur',
            'name': 'Sede Sur',
            'address': 'Bv. Bienestar 789',
            'isActive': True
        }
        self.sites.extend([site_centro, site_norte, site_sur])

        cardiologia = {
            'id': 'spc_cardiologia',
            'name': 'Cardiologia',
            'description': 'Atencion cardiologica integral',
            'durationMinutes': 30,
            'isActive': True
        }
        pediatria = {
            'id': 'spc_pediatria',
            'name': 'Pediatria',
            'description': 'Atencion de ninos y adolescentes',
            'durationMinutes': 20,
            'isActive': True
        }
        dermatologia = {
            'id': 'spc_dermatologia',
            'name': 'Dermatologia',
            'description': 'Atencion de piel y anexos',
            'durationMinutes': 25,
            'isActive': True
        }
        clinica_general = {
            'id': 'spc_clinicageneral',
            'name': 'Clinica General',
            'description': 'Consultas medicas generales',
            'durationMinutes': 30,
            'isActive': True
        }
        self.specialties.extend([cardiologia, pediatria, dermatologia, clinica_general])

        admin = {
            'id': 'usr_admin',
            'email': 'admin@clinica.local',
            'password': 'Admin123!',
            'role': Role.ADMIN.value,
            'isActive': True,
            'firstName': 'Alicia',
            'lastName': 'Admin',
            'phone': '+5491100000001'
        }

        doctor1 = {
            'id': 'usr_doc1',
            'email': 'doctor1@clinica.local',
            'password': 'Doctor123!',
            'role': Role.DOCTOR.value,
            'isActive': True,
            'firstName': 'Laura',
            'lastName': 'Medina',
            'phone': '+5491100000002',
            'doctorProfile': {
                'id': 'docp_1',
                'userId': 'usr_doc1',
                'licenseNumber': 'MN-12345',
                'siteId': site_centro['id'],
                'bio': 'Especialista en cardiologia y clinica general.',
                'specialties': [cardiologia['id'], clinica_general['id']]
            }
        }

        doctor2 = {
            'id': 'usr_doc2',
            'email': 'doctor2@clinica.local',
            'password': 'Doctor123!',
            'role': Role.DOCTOR.value,
            'isActive': True,
            'firstName': 'Martin',
            'lastName': 'Rios',
            'phone': '+5491100000003',
            'doctorProfile': {
                'id': 'docp_2',
                'userId': 'usr_doc2',
                'licenseNumber': 'MN-67890',
                'siteId': site_norte['id'],
                'bio': 'Pediatria ambulatoria y seguimiento integral.',
                'specialties': [pediatria['id']]
            }
        }

        doctor3 = {
            'id': 'usr_doc3',
            'email': 'doctor3@clinica.local',
            'password': 'Doctor123!',
            'role': Role.DOCTOR.value,
            'isActive': True,
            'firstName': 'Valeria',
            'lastName': 'Costa',
            'phone': '+5491100000005',
            'doctorProfile': {
                'id': 'docp_3',
                'userId': 'usr_doc3',
                'licenseNumber': 'MN-44556',
                'siteId': site_sur['id'],
                'bio': 'Dermatologia clinica y control preventivo.',
                'specialties': [dermatologia['id']]
            }
        }

        paciente1 = {
            'id': 'usr_pat1',
            'email': 'paciente@clinica.local',
            'password': 'Paciente123!',
            'role': Role.PATIENT.value,
            'isActive': True,
            'firstName': 'Sofia',
            'lastName': 'Perez',
            'phone': '+5491100000004',
            'patientProfile': {
                'id': 'pat_1',
                'userId': 'usr_pat1',
                'document': '30111222',
                'birthDate': to_iso(parse_iso_datetime('1993-04-15')),
                'phone': '+5491100000004'
            }
        }

        paciente2 = {
            'id': 'usr_pat2',
            'email': 'paciente2@clinica.local',
            'password': 'Paciente123!',
            'role': Role.PATIENT.value,
            'isActive': True,
            'firstName': 'Lucas',
            'lastName': 'Gomez',
            'phone': '+5491100000006',
            'patientProfile': {
                'id': 'pat_2',
                'userId': 'usr_pat2',
                'document': '32444555',
                'birthDate': to_iso(parse_iso_datetime('1989-11-03')),
                'phone': '+5491100000006'
            }
        }

        paciente3 = {
            'id': 'usr_pat3',
            'email': 'paciente3@clinica.local',
            'password': 'Paciente123!',
            'role': Role.PATIENT.value,
            'isActive': True,
            'firstName': 'Carla',
            'lastName': 'Suarez',
            'phone': '+5491100000007',
            'patientProfile': {
                'id': 'pat_3',
                'userId': 'usr_pat3',
                'document': '28999000',
                'birthDate': to_iso(parse_iso_datetime('1978-02-21')),
                'phone': '+5491100000007'
            }
        }

        self.users.extend([admin, doctor1, doctor2, doctor3, paciente1, paciente2, paciente3])

        self.availabilities.extend([
            {'id': 'avl_1', 'doctorId': 'docp_1', 'weekday': 1, 'startTime': '09:00', 'endTime': '13:00', 'isActive': True},
            {'id': 'avl_2', 'doctorId': 'docp_1', 'weekday': 3, 'startTime': '14:00', 'endTime': '18:00', 'isActive': True},
            {'id': 'avl_3', 'doctorId': 'docp_2', 'weekday': 2, 'startTime': '08:00', 'endTime': '12:00', 'isActive': True},
            {'id': 'avl_4', 'doctorId': 'docp_2', 'weekday': 4, 'startTime': '10:00', 'endTime': '16:00', 'isActive': True},
            {'id': 'avl_5', 'doctorId': 'docp_3', 'weekday': 5, 'startTime': '09:00', 'endTime': '14:00', 'isActive': True}
        ])

        block_start = (now_utc() + timedelta(days=6)).replace(hour=12, minute=0, second=0, microsecond=0)
        block_end = (now_utc() + timedelta(days=6)).replace(hour=14, minute=0, second=0, microsecond=0)
        self.blocks.append({
            'id': 'blk_1',
            'doctorId': 'docp_1',
            'startAt': to_iso(block_start),
            'endAt': to_iso(block_end),
            'reason': 'Capacitacion'
        })

        apt1_start = (now_utc() + timedelta(days=2)).replace(hour=10, minute=0, second=0, microsecond=0)
        apt2_start = (now_utc() + timedelta(days=3)).replace(hour=11, minute=0, second=0, microsecond=0)
        apt3_start = (now_utc() + timedelta(days=4)).replace(hour=15, minute=0, second=0, microsecond=0)

        self.appointments.extend([
            {
                'id': 'apt_1',
                'patientId': 'usr_pat1',
                'doctorId': 'usr_doc1',
                'specialtyId': cardiologia['id'],
                'siteId': site_centro['id'],
                'startAt': to_iso(apt1_start),
                'endAt': to_iso(apt1_start + timedelta(minutes=30)),
                'status': AppointmentStatus.PENDING.value,
                'notes': 'Control anual',
                'createdAt': now_iso(),
                'createdById': 'usr_pat1'
            },
            {
                'id': 'apt_2',
                'patientId': 'usr_pat2',
                'doctorId': 'usr_doc2',
                'specialtyId': pediatria['id'],
                'siteId': site_norte['id'],
                'startAt': to_iso(apt2_start),
                'endAt': to_iso(apt2_start + timedelta(minutes=20)),
                'status': AppointmentStatus.CONFIRMED.value,
                'notes': 'Consulta pediatrica',
                'createdAt': now_iso(),
                'createdById': 'usr_pat2',
                'updatedById': 'usr_doc2'
            },
            {
                'id': 'apt_3',
                'patientId': 'usr_pat3',
                'doctorId': 'usr_doc3',
                'specialtyId': dermatologia['id'],
                'siteId': site_sur['id'],
                'startAt': to_iso(apt3_start),
                'endAt': to_iso(apt3_start + timedelta(minutes=25)),
                'status': AppointmentStatus.CANCELED.value,
                'cancellationReason': 'Cancelado por motivo personal',
                'createdAt': now_iso(),
                'createdById': 'usr_pat3',
                'updatedById': 'usr_pat3'
            }
        ])

        self.settings.extend([*DEFAULT_SETTINGS])

        self.record_audit('SYSTEM_MOCK_BOOTSTRAP', 'SYSTEM', 'mock_init', admin['id'], {
            'users': len(self.users),
            'appointments': len(self.appointments)
        })
