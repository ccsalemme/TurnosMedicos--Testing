import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../lib/api';

const routeByRole: Record<string, string> = {
  PATIENT: '/patient',
  DOCTOR: '/doctor',
  ADMIN: '/admin'
};

export function LoginPage() {
  const navigate = useNavigate();
  const { login, user } = useAuth();

  const [form, setForm] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate(routeByRole[user.role], { replace: true });
    }
  }, [navigate, user]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!form.email || !form.password) {
      setError('Complete email y contrasena');
      return;
    }

    setLoading(true);

    try {
      await login(form);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo iniciar sesion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative min-h-screen overflow-hidden bg-slate-100 px-4 py-10">
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <article className="hidden overflow-hidden rounded-2xl border border-blue-200 bg-blue-600 text-white shadow-xl lg:block">
          <div className="space-y-6 p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-lg font-bold text-blue-600">M+</div>
              <div>
                <h2 className="text-xl font-semibold">MediCare</h2>
                <p className="text-sm text-blue-100">Gestion clinica moderna</p>
              </div>
            </div>
            <h3 className="text-3xl font-semibold leading-tight">
              Ingrese y continue con su operacion de turnos sin fricciones
            </h3>
            <p className="max-w-md text-blue-100">
              Portal unificado para pacientes, medicos y administracion, con acceso seguro por rol.
            </p>
          </div>

          <ImageWithFallback
            src="https://images.unsplash.com/photo-1600880292210-859d66af955b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3NwaXRhbCUyMHRlYW18ZW58MXx8fHwxNzc0NjQwNjQ2fDA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Equipo medico"
            className="h-72 w-full object-cover"
          />
        </article>

        <Card className="rounded-2xl border-0 bg-white shadow-xl">
          <CardHeader className="space-y-2">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-lg font-bold text-white">M+</div>
              <span className="text-xl font-semibold text-slate-900">MediCare</span>
            </div>
            <CardTitle className="text-2xl">Ingreso al sistema</CardTitle>
            <CardDescription>Acceda para gestionar turnos medicos de forma simple y segura.</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="admin@clinica.local"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contrasena</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                  placeholder="********"
                />
              </div>

              {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Ingresando...' : 'Iniciar sesion'}
              </Button>
            </form>

            <div className="mt-6 flex items-center justify-between border-t pt-4 text-sm">
              <span className="text-slate-600">Paciente nuevo?</span>
              <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700">
                Crear cuenta
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
