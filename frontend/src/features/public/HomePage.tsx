import { Award, Calendar, Clock, FileText, Shield, Stethoscope, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { useAuth } from '../../context/AuthContext';

const rolePath: Record<string, string> = {
  PATIENT: '/patient',
  DOCTOR: '/doctor',
  ADMIN: '/admin'
};

export function HomePage() {
  const { user } = useAuth();

  console.log('[HomePage] Usuario actual:', user);
  console.log('[HomePage] Rol del usuario:', user?.role);
  console.log('[HomePage] Ruta según rol:', user ? rolePath[user.role] : 'No hay usuario');

  return (
    <div className={user ? '' : 'min-h-screen bg-gradient-to-b from-blue-50 via-slate-50 to-white'}>
      {!user && (
        <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur-sm">
          <div className="page-wrap flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-lg font-bold text-white">M+</div>
              <span className="text-xl font-semibold text-slate-900">MediCare</span>
            </Link>
            <nav className="flex items-center gap-2">
              <>
                {console.log('[HomePage Header] Renderizando sin usuario (modo público)')}
                <Link to="/login" className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-blue-600">
                  Ingresar
                </Link>
                <Link to="/register" className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-blue-600">
                  Registro
                </Link>
              </>
            </nav>
          </div>
        </header>
      )}

      {user && (
        <header className="rounded-xl border bg-white p-6 shadow-sm mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Bienvenido, {user.firstName}!</h1>
          <p className="mt-1 text-slate-600">Desde aquí puedes acceder a todas las funciones de la plataforma.</p>
        </header>
      )}

      <section className={user ? 'grid items-center gap-6 mb-6' : 'page-wrap grid items-center gap-10 py-14 lg:grid-cols-2 lg:py-20'}>
        <div className="space-y-5">
          <h1 className={user ? 'text-2xl font-semibold tracking-tight text-slate-900' : 'text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl'}>
            Calidad medica y gestion digital en una sola plataforma
          </h1>
          <p className="text-lg leading-relaxed text-slate-600">
            Reserve turnos, consulte agendas y administre la operacion clinica con una experiencia clara,
            profesional y responsive.
          </p>
          <div className="flex flex-wrap gap-3">
            {user ? (
              <>
                {console.log('[HomePage Botones] Renderizando botones para usuario logueado')}
                {console.log('[HomePage Botones] Ruta destino:', rolePath[user.role])}
                {console.log('[HomePage Botones] Texto del botón:', user.role === 'PATIENT' ? 'Ir a Mis Turnos' : user.role === 'DOCTOR' ? 'Ir a Mi Agenda' : 'Ir a Panel Admin')}
                <Button asChild size="lg">
                  <Link to={rolePath[user.role]}>
                    <Calendar className="h-5 w-5" />
                    {user.role === 'PATIENT' ? 'Ir a Mis Turnos' : user.role === 'DOCTOR' ? 'Ir a Mi Agenda' : 'Ir a Panel Admin'}
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to={rolePath[user.role]}>
                    <FileText className="h-5 w-5" />
                    Gestionar
                  </Link>
                </Button>
              </>
            ) : (
              <>
                {console.log('[HomePage Botones] Renderizando botones modo público')}
                <Button asChild size="lg">
                  <Link to="/register">
                    <Calendar className="h-5 w-5" />
                    Reservar como paciente
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/login">
                    <FileText className="h-5 w-5" />
                    Ya tengo cuenta
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>

        {!user && (
          <div className="relative">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1758691463198-dc663b8a64e4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwZG9jdG9yJTIwY29uc3VsdGF0aW9ufGVufDF8fHx8MTc3MjExNzgzM3ww&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Consulta medica"
              className="h-auto w-full rounded-2xl border border-blue-100 shadow-xl"
            />
          </div>
        )}
      </section>

      <section className={user ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3' : 'page-wrap grid gap-4 pb-14 md:grid-cols-2 lg:grid-cols-3'}>
        <Card className="shadow-sm transition-shadow hover:shadow-md">
          <CardHeader>
            <div className="mb-2 w-fit rounded-lg bg-blue-100 p-2 text-blue-600">
              <Calendar className="h-5 w-5" />
            </div>
            <CardTitle>Reserva en minutos</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-slate-600">
            Pacientes reservan segun disponibilidad real, sin solapamientos ni fricciones.
          </CardContent>
        </Card>

        <Card className="shadow-sm transition-shadow hover:shadow-md">
          <CardHeader>
            <div className="mb-2 w-fit rounded-lg bg-emerald-100 p-2 text-emerald-600">
              <Stethoscope className="h-5 w-5" />
            </div>
            <CardTitle>Agenda profesional</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-slate-600">
            Medicos gestionan agenda semanal, bloqueos, confirmaciones, completados y no_show.
          </CardContent>
        </Card>

        <Card className="shadow-sm transition-shadow hover:shadow-md">
          <CardHeader>
            <div className="mb-2 w-fit rounded-lg bg-purple-100 p-2 text-purple-600">
              <Users className="h-5 w-5" />
            </div>
            <CardTitle>Control operativo</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-slate-600">
            Administradores controlan usuarios, catalogos, sedes, configuracion y auditoria.
          </CardContent>
        </Card>

        <Card className="shadow-sm transition-shadow hover:shadow-md">
          <CardHeader>
            <div className="mb-2 w-fit rounded-lg bg-cyan-100 p-2 text-cyan-600">
              <Clock className="h-5 w-5" />
            </div>
            <CardTitle>Operacion 24/7</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-slate-600">
            Sistema disponible para gestion clinica diaria desde desktop y movil.
          </CardContent>
        </Card>

        <Card className="shadow-sm transition-shadow hover:shadow-md">
          <CardHeader>
            <div className="mb-2 w-fit rounded-lg bg-red-100 p-2 text-red-600">
              <Shield className="h-5 w-5" />
            </div>
            <CardTitle>Seguridad base robusta</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-slate-600">
            JWT, RBAC, validaciones DTO y trazabilidad de acciones criticas.
          </CardContent>
        </Card>

        <Card className="shadow-sm transition-shadow hover:shadow-md">
          <CardHeader>
            <div className="mb-2 w-fit rounded-lg bg-amber-100 p-2 text-amber-600">
              <Award className="h-5 w-5" />
            </div>
            <CardTitle>Experiencia profesional</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-slate-600">
            Interfaz clara e intuitiva para pacientes, medicos y administracion.
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
