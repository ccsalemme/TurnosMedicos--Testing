import dayjs from 'dayjs';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Building2, ListChecks, Settings, ShieldCheck, Stethoscope, UsersRound } from 'lucide-react';
import { PageState } from '../../components/common/PageState';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useAuth } from '../../context/AuthContext';
import { ApiError, api } from '../../lib/api';
import {
  AdminDashboard as AdminDashboardType,
  AuditLogEntry,
  ClinicSite,
  Specialty,
  User,
  UserRole
} from '../../types/domain';

const roleOptions: UserRole[] = ['PATIENT', 'DOCTOR', 'ADMIN'];

export function AdminDashboard() {
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dashboard, setDashboard] = useState<AdminDashboardType | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [sites, setSites] = useState<ClinicSite[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [settings, setSettings] = useState<{ key: string; value: string }[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  const [siteForm, setSiteForm] = useState({ name: '', address: '' });
  const [specialtyForm, setSpecialtyForm] = useState({
    name: '',
    durationMinutes: 30,
    description: ''
  });

  const [userEdits, setUserEdits] = useState<Record<string, { role: UserRole; isActive: boolean }>>({});

  const cancellationWindow = useMemo(
    () => settings.find((setting) => setting.key === 'CANCELLATION_WINDOW_HOURS')?.value ?? '24',
    [settings]
  );

  const [windowHours, setWindowHours] = useState(cancellationWindow);

  useEffect(() => {
    setWindowHours(cancellationWindow);
  }, [cancellationWindow]);

  const loadData = async () => {
    if (!token) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [dashboardData, usersData, sitesData, settingsData, auditData, specialtiesData] =
        await Promise.all([
          api.adminDashboard(token),
          api.adminUsers(token),
          api.adminSites(token),
          api.adminSettings(token),
          api.auditLogs(token),
          api.getAdminSpecialties(token)
        ]);

      setDashboard(dashboardData);
      setUsers(usersData);
      setSites(sitesData);
      setSettings(settingsData);
      setAuditLogs(auditData);
      setSpecialties(specialtiesData);

      setUserEdits(
        usersData.reduce<Record<string, { role: UserRole; isActive: boolean }>>((acc, item) => {
          acc[item.id] = {
            role: item.role,
            isActive: item.isActive ?? true
          };
          return acc;
        }, {})
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cargar el panel admin');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [token]);

  const onCreateSite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      return;
    }

    try {
      await api.adminCreateSite(token, siteForm);
      setSiteForm({ name: '', address: '' });
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo crear la sede');
    }
  };

  const onCreateSpecialty = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      return;
    }

    try {
      await api.createSpecialty(token, {
        name: specialtyForm.name,
        description: specialtyForm.description,
        durationMinutes: Number(specialtyForm.durationMinutes),
        isActive: true
      });
      setSpecialtyForm({ name: '', durationMinutes: 30, description: '' });
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo crear la especialidad');
    }
  };

  const onSaveUser = async (userId: string) => {
    if (!token) {
      return;
    }

    try {
      const edit = userEdits[userId];
      await api.adminUpdateUserRole(token, userId, {
        role: edit.role,
        isActive: edit.isActive
      });
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo actualizar el usuario');
    }
  };

  const onUpdateWindow = async () => {
    if (!token) {
      return;
    }

    try {
      await api.adminUpdateSetting(token, 'CANCELLATION_WINDOW_HOURS', windowHours);
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo actualizar la configuracion');
    }
  };

  if (loading) {
    return <PageState message="Cargando panel administrativo..." />;
  }

  return (
    <div className="space-y-6">
      <header className="rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Panel administrativo</h1>
        <p className="mt-1 text-slate-600">Controle operacion, usuarios, catalogos clinicos y auditoria del sistema.</p>
      </header>

      {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <section className="grid gap-4 2xl:grid-cols-3">
        <Card className="2xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ListChecks className="h-5 w-5 text-blue-600" />
              Tablero operativo
            </CardTitle>
            <CardDescription>Metricas de volumen y estado actual de turnos.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              <div className="rounded-lg border bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Total</p>
                <p className="text-xl font-semibold">{dashboard?.counters.totalAppointments ?? 0}</p>
              </div>
              <div className="rounded-lg border bg-amber-50 p-3">
                <p className="text-xs text-slate-500">Pendientes</p>
                <p className="text-xl font-semibold text-amber-700">{dashboard?.counters.pendingAppointments ?? 0}</p>
              </div>
              <div className="rounded-lg border bg-emerald-50 p-3">
                <p className="text-xs text-slate-500">Confirmados</p>
                <p className="text-xl font-semibold text-emerald-700">{dashboard?.counters.confirmedAppointments ?? 0}</p>
              </div>
              <div className="rounded-lg border bg-blue-50 p-3">
                <p className="text-xs text-slate-500">Completados</p>
                <p className="text-xl font-semibold text-blue-700">{dashboard?.counters.completedAppointments ?? 0}</p>
              </div>
              <div className="rounded-lg border bg-fuchsia-50 p-3">
                <p className="text-xs text-slate-500">No show</p>
                <p className="text-xl font-semibold text-fuchsia-700">{dashboard?.counters.noShowAppointments ?? 0}</p>
              </div>
              <div className="rounded-lg border bg-red-50 p-3">
                <p className="text-xs text-slate-500">Cancelados</p>
                <p className="text-xl font-semibold text-red-700">{dashboard?.counters.canceledAppointments ?? 0}</p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <h3 className="text-sm font-semibold text-slate-700">Proximos turnos</h3>
              {dashboard?.upcoming.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between rounded-lg border bg-white px-3 py-2">
                  <div>
                    <p className="font-medium text-slate-900">
                      {appointment.patient.lastName}, {appointment.patient.firstName}
                    </p>
                    <p className="text-sm text-slate-600">
                      {dayjs(appointment.startAt).format('DD/MM HH:mm')} - Dr/a. {appointment.doctor.lastName}
                    </p>
                  </div>
                  <StatusBadge status={appointment.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="h-5 w-5 text-blue-600" />
              Configuracion operativa
            </CardTitle>
            <CardDescription>Ventana de cancelacion para toda la clinica.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="cancellation-window">Ventana de cancelacion (horas)</Label>
              <Input
                id="cancellation-window"
                type="number"
                min={1}
                max={168}
                value={windowHours}
                onChange={(event) => setWindowHours(event.target.value)}
              />
            </div>
            <Button type="button" onClick={onUpdateWindow}>
              Guardar configuracion
            </Button>
          </CardContent>
        </Card>

        <Card className="2xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UsersRound className="h-5 w-5 text-blue-600" />
              Usuarios y roles
            </CardTitle>
            <CardDescription>Gestione permisos y estados de acceso.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-slate-600">
                    <th className="px-3 py-2 font-medium">Usuario</th>
                    <th className="px-3 py-2 font-medium">Rol</th>
                    <th className="px-3 py-2 font-medium">Activo</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((currentUser) => (
                    <tr key={currentUser.id} className="border-b align-middle">
                      <td className="px-3 py-2">
                        <p className="font-medium text-slate-900">
                          {currentUser.lastName}, {currentUser.firstName}
                        </p>
                        <p className="text-xs text-slate-500">{currentUser.email}</p>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          className="border-input bg-input-background h-9 w-full rounded-md border px-2 text-sm"
                          value={userEdits[currentUser.id]?.role ?? currentUser.role}
                          onChange={(event) =>
                            setUserEdits((prev) => ({
                              ...prev,
                              [currentUser.id]: {
                                role: event.target.value as UserRole,
                                isActive: prev[currentUser.id]?.isActive ?? currentUser.isActive ?? true
                              }
                            }))
                          }
                        >
                          {roleOptions.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <label className="inline-flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={userEdits[currentUser.id]?.isActive ?? currentUser.isActive ?? true}
                            onChange={(event) =>
                              setUserEdits((prev) => ({
                                ...prev,
                                [currentUser.id]: {
                                  role: prev[currentUser.id]?.role ?? currentUser.role,
                                  isActive: event.target.checked
                                }
                              }))
                            }
                          />
                          <span>Activo</span>
                        </label>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Button type="button" size="sm" onClick={() => onSaveUser(currentUser.id)}>
                          Guardar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Stethoscope className="h-5 w-5 text-blue-600" />
              Especialidades
            </CardTitle>
            <CardDescription>Alta rapida de catalogo clinico.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={onCreateSpecialty}>
              <div className="space-y-2">
                <Label htmlFor="specialty-name">Nombre</Label>
                <Input
                  id="specialty-name"
                  value={specialtyForm.name}
                  onChange={(event) => setSpecialtyForm((prev) => ({ ...prev, name: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialty-duration">Duracion (min)</Label>
                <Input
                  id="specialty-duration"
                  type="number"
                  min={10}
                  value={specialtyForm.durationMinutes}
                  onChange={(event) =>
                    setSpecialtyForm((prev) => ({ ...prev, durationMinutes: Number(event.target.value) }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialty-description">Descripcion</Label>
                <Input
                  id="specialty-description"
                  value={specialtyForm.description}
                  onChange={(event) =>
                    setSpecialtyForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                />
              </div>
              <Button type="submit" className="w-full">
                Agregar especialidad
              </Button>
            </form>

            <div className="mt-4 space-y-2">
              {specialties.map((specialty) => (
                <div key={specialty.id} className="rounded-lg border bg-slate-50 px-3 py-2 text-sm">
                  <strong>{specialty.name}</strong> - {specialty.durationMinutes} min
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-blue-600" />
              Sedes
            </CardTitle>
            <CardDescription>Gestion de ubicaciones de atencion.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={onCreateSite}>
              <div className="space-y-2">
                <Label htmlFor="site-name">Nombre</Label>
                <Input
                  id="site-name"
                  value={siteForm.name}
                  onChange={(event) => setSiteForm((prev) => ({ ...prev, name: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="site-address">Direccion</Label>
                <Input
                  id="site-address"
                  value={siteForm.address}
                  onChange={(event) => setSiteForm((prev) => ({ ...prev, address: event.target.value }))}
                />
              </div>
              <Button type="submit" className="w-full">
                Agregar sede
              </Button>
            </form>

            <div className="mt-4 space-y-2">
              {sites.map((site) => (
                <div key={site.id} className="rounded-lg border bg-slate-50 px-3 py-2 text-sm">
                  <strong>{site.name}</strong> - {site.address}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="2xl:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              Auditoria
            </CardTitle>
            <CardDescription>Ultimos eventos criticos registrados por el sistema.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {auditLogs.slice(0, 25).map((entry) => (
                <div key={entry.id} className="rounded-lg border bg-slate-50 p-3">
                  <p className="font-semibold text-slate-900">{entry.action}</p>
                  <p className="text-sm text-slate-600">
                    {entry.entity} - {entry.entityId ?? 'N/A'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {dayjs(entry.createdAt).format('DD/MM/YYYY HH:mm')} por{' '}
                    {entry.actor ? `${entry.actor.firstName} ${entry.actor.lastName}` : 'Sistema'}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
