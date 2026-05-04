import dayjs from 'dayjs';
import { FormEvent, useEffect, useState } from 'react';
import { CalendarRange, Clock3, NotebookPen } from 'lucide-react';
import { PageState } from '../../components/common/PageState';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useAuth } from '../../context/AuthContext';
import { ApiError, api } from '../../lib/api';
import { AgendaResponse, Appointment } from '../../types/domain';

const weekdayLabel: Record<number, string> = {
  0: 'Domingo',
  1: 'Lunes',
  2: 'Martes',
  3: 'Miercoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sabado'
};

export function DoctorDashboard() {
  const { token, user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [agenda, setAgenda] = useState<AgendaResponse>({ availabilities: [], blocks: [] });

  const [availabilityForm, setAvailabilityForm] = useState({
    weekday: 1,
    startTime: '09:00',
    endTime: '13:00'
  });

  const [blockForm, setBlockForm] = useState({
    startAt: '',
    endAt: '',
    reason: ''
  });

  const loadData = async () => {
    if (!token || !user) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [appointmentData, agendaData] = await Promise.all([
        api.getMyAppointments(token),
        api.getDoctorAgenda(user.id)
      ]);

      setAppointments(appointmentData);
      setAgenda(agendaData);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cargar el panel medico');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [token, user?.id]);

  const updateAppointment = async (
    appointmentId: string,
    action: 'confirm' | 'complete' | 'no_show'
  ) => {
    if (!token) {
      return;
    }

    try {
      if (action === 'confirm') {
        await api.confirmAppointment(token, appointmentId);
      } else if (action === 'complete') {
        await api.completeAppointment(token, appointmentId);
      } else {
        await api.noShowAppointment(token, appointmentId);
      }
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo actualizar el turno');
    }
  };

  const onCreateAvailability = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      return;
    }

    try {
      await api.createAvailability(token, {
        weekday: Number(availabilityForm.weekday),
        startTime: availabilityForm.startTime,
        endTime: availabilityForm.endTime
      });
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo crear la disponibilidad');
    }
  };

  const onCreateBlock = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      return;
    }

    try {
      await api.createBlock(token, {
        startAt: new Date(blockForm.startAt).toISOString(),
        endAt: new Date(blockForm.endAt).toISOString(),
        reason: blockForm.reason || undefined
      });
      setBlockForm({ startAt: '', endAt: '', reason: '' });
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo crear el bloqueo');
    }
  };

  const onDeleteBlock = async (blockId: string) => {
    if (!token) {
      return;
    }

    try {
      await api.deleteBlock(token, blockId);
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo borrar el bloqueo');
    }
  };

  if (loading) {
    return <PageState message="Cargando agenda medica..." />;
  }

  return (
    <div className="space-y-6">
      <header className="rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Portal del medico</h1>
        <p className="mt-1 text-slate-600">Revise su agenda, confirme atenciones y administre su disponibilidad semanal.</p>
      </header>

      {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarRange className="h-5 w-5 text-blue-600" />
              Agenda de turnos
            </CardTitle>
            <CardDescription>Estado actual de citas para sus proximas atenciones.</CardDescription>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <PageState message="No hay turnos para mostrar." />
            ) : (
              <div className="space-y-3">
                {appointments.map((appointment) => (
                  <div key={appointment.id} className="rounded-lg border bg-white p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-slate-900">
                          {appointment.patient.lastName}, {appointment.patient.firstName}
                        </h3>
                        <p className="text-sm text-slate-600">{dayjs(appointment.startAt).format('DD/MM/YYYY HH:mm')}</p>
                        <p className="text-sm text-slate-600">{appointment.specialty.name}</p>
                        <StatusBadge status={appointment.status} />
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {appointment.status === 'PENDING' && (
                          <Button type="button" onClick={() => updateAppointment(appointment.id, 'confirm')}>
                            Confirmar
                          </Button>
                        )}

                        {appointment.status === 'CONFIRMED' && (
                          <>
                            <Button type="button" onClick={() => updateAppointment(appointment.id, 'complete')}>
                              Completar
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              onClick={() => updateAppointment(appointment.id, 'no_show')}
                            >
                              No show
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock3 className="h-5 w-5 text-blue-600" />
              Disponibilidad semanal
            </CardTitle>
            <CardDescription>Configure horarios base por dia de atencion.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={onCreateAvailability}>
              <div className="space-y-2">
                <Label htmlFor="availability-weekday">Dia</Label>
                <select
                  id="availability-weekday"
                  className="border-input bg-input-background h-9 w-full rounded-md border px-3 text-sm"
                  value={availabilityForm.weekday}
                  onChange={(event) =>
                    setAvailabilityForm((prev) => ({ ...prev, weekday: Number(event.target.value) }))
                  }
                >
                  {Object.entries(weekdayLabel).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="availability-start-time">Hora inicio</Label>
                <Input
                  id="availability-start-time"
                  type="time"
                  value={availabilityForm.startTime}
                  onChange={(event) =>
                    setAvailabilityForm((prev) => ({ ...prev, startTime: event.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="availability-end-time">Hora fin</Label>
                <Input
                  id="availability-end-time"
                  type="time"
                  value={availabilityForm.endTime}
                  onChange={(event) => setAvailabilityForm((prev) => ({ ...prev, endTime: event.target.value }))}
                />
              </div>

              <Button type="submit" className="w-full">
                Agregar disponibilidad
              </Button>
            </form>

            <div className="mt-4 space-y-2">
              {agenda.availabilities.map((slot) => (
                <div key={slot.id} className="flex items-center justify-between rounded-lg border bg-slate-50 px-3 py-2 text-sm">
                  <strong>{weekdayLabel[slot.weekday]}</strong>
                  <span>
                    {slot.startTime} - {slot.endTime}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <NotebookPen className="h-5 w-5 text-blue-600" />
              Bloqueos de agenda
            </CardTitle>
            <CardDescription>Registre periodos no disponibles por ausencias o tareas internas.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid grid-cols-1 gap-3 md:grid-cols-4" onSubmit={onCreateBlock}>
              <div className="space-y-2">
                <Label htmlFor="block-start">Inicio</Label>
                <Input
                  id="block-start"
                  type="datetime-local"
                  value={blockForm.startAt}
                  onChange={(event) => setBlockForm((prev) => ({ ...prev, startAt: event.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="block-end">Fin</Label>
                <Input
                  id="block-end"
                  type="datetime-local"
                  value={blockForm.endAt}
                  onChange={(event) => setBlockForm((prev) => ({ ...prev, endAt: event.target.value }))}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="block-reason">Motivo</Label>
                <Input
                  id="block-reason"
                  value={blockForm.reason}
                  onChange={(event) => setBlockForm((prev) => ({ ...prev, reason: event.target.value }))}
                />
              </div>

              <Button type="submit" className="md:col-span-4 md:w-fit">
                Registrar bloqueo
              </Button>
            </form>

            <div className="mt-4 space-y-2">
              {agenda.blocks.map((block) => (
                <div key={block.id} className="flex flex-col gap-3 rounded-lg border bg-slate-50 p-3 md:flex-row md:items-center md:justify-between">
                  <div className="text-sm text-slate-700">
                    <p className="font-semibold">{dayjs(block.startAt).format('DD/MM/YYYY HH:mm')}</p>
                    <p>Hasta {dayjs(block.endAt).format('DD/MM/YYYY HH:mm')}</p>
                    {block.reason && <p className="text-slate-500">{block.reason}</p>}
                  </div>
                  <Button type="button" variant="outline" onClick={() => onDeleteBlock(block.id)}>
                    Eliminar
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
