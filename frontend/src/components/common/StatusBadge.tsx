import { AppointmentStatus } from '../../types/domain';
import { Badge } from '../ui/badge';

const statusMap: Record<AppointmentStatus, { label: string; className: string }> = {
  PENDING: { label: 'Pendiente', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  CONFIRMED: { label: 'Confirmado', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  CANCELED: { label: 'Cancelado', className: 'bg-red-100 text-red-800 border-red-200' },
  COMPLETED: { label: 'Completado', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  NO_SHOW: { label: 'No Show', className: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200' }
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const item = statusMap[status];
  return <Badge className={item.className}>{item.label}</Badge>;
}
