import { Calendar, FileText, Home, Menu, Settings, Stethoscope, X } from 'lucide-react';
import { PropsWithChildren, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { useAuth } from '../../context/AuthContext';

const roleLabels: Record<string, string> = {
  PATIENT: 'Paciente',
  DOCTOR: 'Medico',
  ADMIN: 'Administrador'
};

export function AppShell({ children }: PropsWithChildren) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  console.log('[AppShell] Usuario actual:', user);
  console.log('[AppShell] Location actual:', location.pathname);

  const links =
    user?.role === 'ADMIN'
      ? [
          { path: '/', label: 'Inicio', icon: Home },
          { path: '/admin', label: 'Panel Admin', icon: Settings }
        ]
      : user?.role === 'DOCTOR'
        ? [
            { path: '/', label: 'Inicio', icon: Home },
            { path: '/doctor', label: 'Agenda Medica', icon: Stethoscope }
          ]
        : [
            { path: '/', label: 'Inicio', icon: Home },
            { path: '/patient', label: 'Mis Turnos', icon: Calendar }
          ];

  console.log('[AppShell] Links generados:', links);

  const onLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900">
      <header className="sticky top-0 z-50 border-b bg-white">
        <div className="page-wrap flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-lg font-bold text-white">M+</div>
            <span className="text-xl font-semibold text-slate-900">MediCare</span>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            {links.map(({ path, label, icon: Icon }) => (
              <Link
                key={`${path}-${label}`}
                to={path}
                onClick={() => {
                  console.log('[AppShell] Click en tab:', label, 'hacia ruta:', path);
                }}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive(path)
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-blue-600'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            ))}
            <Link
              to={user?.role === 'PATIENT' ? '/patient' : user?.role === 'DOCTOR' ? '/doctor' : '/admin'}
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-blue-600"
            >
              <FileText className="h-4 w-4" />
              <span>Panel</span>
            </Link>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-900">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-slate-500">{roleLabels[user?.role ?? 'PATIENT']}</p>
            </div>
            <Button variant="outline" size="sm" onClick={onLogout} type="button">
              Cerrar sesion
            </Button>
          </div>

          <button
            type="button"
            className="rounded-md p-2 text-slate-600 md:hidden"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t bg-white md:hidden">
            <div className="page-wrap py-3">
              <nav className="flex flex-col gap-2">
                {links.map(({ path, label, icon: Icon }) => (
                  <Link
                    key={`${path}-${label}-mobile`}
                    to={path}
                    onClick={() => {
                      console.log('[AppShell Mobile] Click en tab:', label, 'hacia ruta:', path);
                      setMobileMenuOpen(false);
                    }}
                    className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                      isActive(path)
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-blue-600'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </Link>
                ))}
                <Button variant="outline" size="sm" onClick={onLogout} type="button" className="justify-start">
                  Cerrar sesion
                </Button>
              </nav>
            </div>
          </div>
        )}
      </header>

      <main className="py-8">
        <div className="page-wrap">{children}</div>
      </main>

      <footer className="mt-8 bg-slate-900 text-slate-300">
        <div className="page-wrap grid grid-cols-1 gap-8 py-10 md:grid-cols-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-lg font-bold text-white">M+</div>
              <span className="text-xl font-semibold text-white">MediCare</span>
            </div>
            <p className="text-sm text-slate-400">
              Plataforma de gestion de turnos medicos con foco en operacion clinica real.
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Accesos</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-blue-300">
                  Inicio
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-blue-300">
                  Ingresar
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-blue-300">
                  Registro paciente
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Servicios</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>Reserva de turnos</li>
              <li>Agenda medica</li>
              <li>Tablero operativo</li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Contacto</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>Av. Principal 123</li>
              <li>+54 11 5555 1234</li>
              <li>contacto@medicare.local</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
          (c) 2026 MediCare. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}
