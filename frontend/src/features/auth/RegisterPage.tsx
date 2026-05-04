import { FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../lib/api';

export function RegisterPage() {
  const navigate = useNavigate();
  const { registerPatient } = useAuth();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    document: '',
    birthDate: '',
    phone: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validations = useMemo(
    () => ({
      firstName: form.firstName.trim().length >= 2,
      lastName: form.lastName.trim().length >= 2,
      document: form.document.trim().length >= 6,
      birthDate: Boolean(form.birthDate),
      phone: form.phone.trim().length >= 8,
      email: /\S+@\S+\.\S+/.test(form.email),
      password: /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/.test(form.password)
    }),
    [form]
  );

  const isFormValid = Object.values(validations).every(Boolean);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!isFormValid) {
      setError('Revise los campos requeridos antes de continuar.');
      return;
    }

    setLoading(true);

    try {
      await registerPatient(form);
      navigate('/patient');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative min-h-screen overflow-hidden bg-slate-100 px-4 py-10">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <article className="hidden overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-500 to-cyan-600 text-white shadow-xl lg:block">
          <div className="space-y-5 p-8">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-lg font-bold text-cyan-600">M+</div>
              <span className="text-xl font-semibold">MediCare</span>
            </div>
            <h2 className="text-3xl font-semibold leading-tight">Registro de pacientes pensado para conversion real</h2>
            <p className="text-sm text-cyan-50">
              Cree su cuenta y acceda a reservas, reprogramaciones y seguimiento de turnos desde cualquier dispositivo.
            </p>
          </div>
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1584515933487-779824d29309?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw0fHxjbGluaWMlMjBwYXRpZW50fGVufDF8fHx8MTc3NDY0MDY5MHww&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Paciente en clinica"
            className="h-80 w-full object-cover"
          />
        </article>

        <Card className="rounded-2xl border-0 bg-white shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Registro de paciente</CardTitle>
            <CardDescription>Complete sus datos para reservar y gestionar turnos en linea.</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nombre</Label>
                <Input
                  id="firstName"
                  value={form.firstName}
                  onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))}
                />
                {!validations.firstName && <p className="text-xs text-amber-700">Minimo 2 caracteres</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Apellido</Label>
                <Input
                  id="lastName"
                  value={form.lastName}
                  onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))}
                />
                {!validations.lastName && <p className="text-xs text-amber-700">Minimo 2 caracteres</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="document">Documento</Label>
                <Input
                  id="document"
                  value={form.document}
                  onChange={(event) => setForm((prev) => ({ ...prev, document: event.target.value }))}
                />
                {!validations.document && <p className="text-xs text-amber-700">Minimo 6 caracteres</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthDate">Fecha de nacimiento</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={form.birthDate}
                  onChange={(event) => setForm((prev) => ({ ...prev, birthDate: event.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefono</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                />
                {!validations.phone && <p className="text-xs text-amber-700">Minimo 8 caracteres</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                />
                {!validations.email && <p className="text-xs text-amber-700">Email invalido</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="password">Contrasena</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                />
                {!validations.password && (
                  <p className="text-xs text-amber-700">8+ chars, mayuscula, minuscula y numero</p>
                )}
              </div>

              {error && (
                <p className="md:col-span-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}

              <Button type="submit" disabled={loading} className="w-full md:col-span-2">
                {loading ? 'Creando cuenta...' : 'Crear cuenta'}
              </Button>
            </form>

            <div className="mt-6 flex items-center justify-between border-t pt-4 text-sm">
              <span className="text-slate-600">Ya tiene cuenta?</span>
              <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">
                Iniciar sesion
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
