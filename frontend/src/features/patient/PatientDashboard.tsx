import dayjs from 'dayjs';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { CalendarClock, UserRound } from 'lucide-react';
import { PageState } from '../../components/common/PageState';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { useAuth } from '../../context/AuthContext';
import { ApiError, api } from '../../lib/api';
import { logger } from '../../lib/logger';
import { Appointment, Doctor, Specialty } from '../../types/domain';

const toInputDateTime = (value: string) => dayjs(value).format('YYYY-MM-DDTHH:mm');

export function PatientDashboard() {
  const { token, user, updateMyProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const [booking, setBooking] = useState({
    specialtyId: '',
    doctorId: '',
    startAt: '',
    notes: ''
  });

  const [profile, setProfile] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    phone: user?.phone ?? '',
    birthDate: user?.patientProfile?.birthDate?.slice(0, 10) ?? ''
  });

  const [rescheduleValues, setRescheduleValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const filteredDoctors = useMemo(() => {
    if (!booking.specialtyId) {
      return doctors;
    }

    return doctors.filter((doctor) =>
      doctor.doctorProfile?.specialties?.some(
        (specialtyRef) => specialtyRef.specialty.id === booking.specialtyId
      )
    );
  }, [booking.specialtyId, doctors]);

  const selectedDoctor = useMemo(
    () => filteredDoctors.find((doctor) => doctor.id === booking.doctorId),
    [booking.doctorId, filteredDoctors]
  );

  const selectedDoctorSiteId = selectedDoctor?.doctorProfile?.site?.id ?? selectedDoctor?.doctorProfile?.siteId;

  const loadData = async () => {
    if (!token) {
      return;
    }

    setLoading(true);
    setError(null);
    logger.info('Cargando datos del dashboard de paciente');

    try {
      const [specialtyData, doctorData, appointmentData] = await Promise.all([
        api.getSpecialties(),
        api.getDoctors(),
        api.getMyAppointments(token)
      ]);

      setSpecialties(specialtyData);
      setDoctors(doctorData);
      setAppointments(appointmentData);
      logger.info('Datos cargados exitosamente', { 
        specialties: specialtyData.length, 
        doctors: doctorData.length, 
        appointments: appointmentData.length 
      });
    } catch (err) {
      logger.error('Error cargando datos del dashboard', err instanceof Error ? err : undefined);
      setError(err instanceof ApiError ? err.message : 'No se pudo cargar el panel');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [token]);

  useEffect(() => {
    setProfile({
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      phone: user?.phone ?? '',
      birthDate: user?.patientProfile?.birthDate?.slice(0, 10) ?? ''
    });
  }, [user]);

  const onReserve = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      return;
    }

    if (!booking.specialtyId || !booking.doctorId || !booking.startAt || !selectedDoctorSiteId) {
      setError('Complete especialidad, medico, fecha/hora y verifique sede del medico.');
      return;
    }

    setSubmitting(true);
    setError(null);
    
    logger.logUserAction('Reservar turno', {
      specialtyId: booking.specialtyId,
      doctorId: booking.doctorId,
      startAt: booking.startAt
    });

    try {
      await api.reserveAppointment(token, {
        doctorId: booking.doctorId,
        specialtyId: booking.specialtyId,
        siteId: selectedDoctorSiteId,
        startAt: new Date(booking.startAt).toISOString(),
        notes: booking.notes || undefined
      });
      
      logger.info('Turno reservado exitosamente');
      setBooking((prev) => ({ ...prev, startAt: '', notes: '' }));
      await loadData();
    } catch (err) {
      logger.error('Error reservando turno', err instanceof Error ? err : undefined);
      setError(err instanceof ApiError ? err.message : 'No se pudo reservar el turno');
    } finally {
      setSubmitting(false);
    }
  };

  const onCancel = async (appointmentId: string) => {
    if (!token) {
      return;
    }

    const reason = window.prompt('Motivo de cancelacion (opcional):') ?? undefined;
    
    logger.logUserAction('Cancelar turno', { appointmentId, reason });

    try {
      await api.cancelAppointment(token, appointmentId, reason);
      logger.info('Turno cancelado exitosamente', { appointmentId });
      await loadData();
    } catch (err) {
      logger.error('Error cancelando turno', err instanceof Error ? err : undefined, { appointmentId });
      setError(err instanceof ApiError ? err.message : 'No se pudo cancelar el turno');
    }
  };

  const onReschedule = async (appointmentId: string) => {
    if (!token) {
      return;
    }

    const newStart = rescheduleValues[appointmentId];
    if (!newStart) {
      setError('Seleccione una nueva fecha y hora para reprogramar.');
      return;
    }
    
    logger.logUserAction('Reprogramar turno', { appointmentId, newStart });

    try {
      await api.rescheduleAppointment(token, appointmentId, new Date(newStart).toISOString());
      logger.info('Turno reprogramado exitosamente', { appointmentId, newStart });
      await loadData();
    } catch (err) {
      logger.error('Error reprogramando turno', err instanceof Error ? err : undefined, { appointmentId });
      setError(err instanceof ApiError ? err.message : 'No se pudo reprogramar el turno');
    }
  };

  const onUpdateProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      await updateMyProfile(profile);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo actualizar el perfil');
    }
  };

  if (loading) {
    return <PageState message="Cargando panel de paciente..." />;
  }

  return (
    <div className="space-y-6">
      <header className="rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Portal del paciente</h1>
        <p className="mt-1 text-slate-600">Reserve nuevos turnos, edite su perfil y gestione sus citas activas.</p>
      </header>

      {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserRound className="h-5 w-5 text-blue-600" />
              Mi perfil
            </CardTitle>
            <CardDescription>Actualice sus datos personales para mantener su historia al dia.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={onUpdateProfile}>
              <div className="space-y-2">
                <Label htmlFor="patient-first-name">Nombre</Label>
                <Input
                  id="patient-first-name"
                  value={profile.firstName}
                  onChange={(event) => setProfile((prev) => ({ ...prev, firstName: event.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="patient-last-name">Apellido</Label>
                <Input
                  id="patient-last-name"
                  value={profile.lastName}
                  onChange={(event) => setProfile((prev) => ({ ...prev, lastName: event.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="patient-phone">Telefono</Label>
                <Input
                  id="patient-phone"
                  value={profile.phone}
                  onChange={(event) => setProfile((prev) => ({ ...prev, phone: event.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="patient-birth-date">Fecha de nacimiento</Label>
                <Input
                  id="patient-birth-date"
                  type="date"
                  value={profile.birthDate}
                  onChange={(event) => setProfile((prev) => ({ ...prev, birthDate: event.target.value }))}
                />
              </div>

              <Button className="md:col-span-2" type="submit">
                Guardar perfil
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarClock className="h-5 w-5 text-blue-600" />
              Reservar turno
            </CardTitle>
            <CardDescription>Seleccione especialidad, profesional y horario de atencion.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onReserve}>
              <div className="space-y-2">
                <Label htmlFor="booking-specialty">Especialidad</Label>
                <select
                  id="booking-specialty"
                  className="border-input bg-input-background h-9 w-full rounded-md border px-3 text-sm"
                  value={booking.specialtyId}
                  onChange={(event) =>
                    setBooking((prev) => ({ ...prev, specialtyId: event.target.value, doctorId: '' }))
                  }
                >
                  <option value="">Seleccione</option>
                  {specialties.map((specialty) => (
                    <option key={specialty.id} value={specialty.id}>
                      {specialty.name} ({specialty.durationMinutes} min)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="booking-doctor">Medico</Label>
                <select
                  id="booking-doctor"
                  className="border-input bg-input-background h-9 w-full rounded-md border px-3 text-sm"
                  value={booking.doctorId}
                  onChange={(event) => setBooking((prev) => ({ ...prev, doctorId: event.target.value }))}
                >
                  <option value="">Seleccione</option>
                  {filteredDoctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.lastName}, {doctor.firstName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="booking-start-at">Fecha y hora</Label>
                <Input
                  id="booking-start-at"
                  type="datetime-local"
                  value={booking.startAt}
                  onChange={(event) => setBooking((prev) => ({ ...prev, startAt: event.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="booking-notes">Notas</Label>
                <Textarea
                  id="booking-notes"
                  value={booking.notes}
                  onChange={(event) => setBooking((prev) => ({ ...prev, notes: event.target.value }))}
                  placeholder="Motivo breve de consulta"
                />
              </div>

              {selectedDoctor?.doctorProfile?.site && (
                <p className="rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-700">
                  Sede: {selectedDoctor.doctorProfile.site.name} - {selectedDoctor.doctorProfile.site.address}
                </p>
              )}

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? 'Reservando...' : 'Reservar turno'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Mis turnos</CardTitle>
          <CardDescription>Consulte estado, cancele o reprograma sus citas activas.</CardDescription>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <PageState message="No tiene turnos registrados." />
          ) : (
            <div className="space-y-3">
              {appointments.map((appointment) => {
                const canManage = appointment.status === 'PENDING' || appointment.status === 'CONFIRMED';

                return (
                  <div key={appointment.id} className="rounded-lg border bg-white p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-slate-900">
                          {appointment.specialty.name} - Dr/a. {appointment.doctor.lastName}
                        </h3>
                        <p className="text-sm text-slate-600">
                          {dayjs(appointment.startAt).format('DD/MM/YYYY HH:mm')} - {appointment.site.name}
                        </p>
                        <StatusBadge status={appointment.status} />
                      </div>

                      {canManage && (
                        <div className="flex w-full flex-col gap-2 md:w-auto md:min-w-[300px]">
                          <Input
                            type="datetime-local"
                            value={rescheduleValues[appointment.id] ?? toInputDateTime(appointment.startAt)}
                            onChange={(event) =>
                              setRescheduleValues((prev) => ({
                                ...prev,
                                [appointment.id]: event.target.value
                              }))
                            }
                          />
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="destructive"
                              className="flex-1"
                              onClick={() => onCancel(appointment.id)}
                            >
                              Cancelar
                            </Button>
                            <Button type="button" className="flex-1" onClick={() => onReschedule(appointment.id)}>
                              Reprogramar
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
