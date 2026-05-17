import { test, expect } from '@playwright/test';
import dayjs from 'dayjs';

test.describe('RF-03 y RF-04: Reserva y Gestión de Turnos', () => {
  const patientCredentials = { email: 'paciente@clinica.local', password: 'Paciente123!' };

  test.beforeEach(async ({ page }) => {
    // Iniciar sesión antes de cada prueba
    await page.goto('/login');
    await page.fill('#email', patientCredentials.email);
    await page.fill('#password', patientCredentials.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/patient/);
  });

  test('RF-03.1, RF-03.4 y RF-04.1: Reservar un turno correctamente y verlo en estado PENDIENTE', async ({ page }) => {
    const specialtySelect = page.locator('#booking-specialty');
    const doctorSelect = page.locator('#booking-doctor');
    const startAtInput = page.locator('#booking-start-at');
    const notesInput = page.locator('#booking-notes');
    const reserveButton = page.locator('button:has-text("Reservar turno")');

    // Seleccionar primera especialidad disponible
    await specialtySelect.selectOption({ index: 1 });
    
    // Seleccionar primer doctor disponible
    await doctorSelect.selectOption({ index: 1 });

    // Poner una fecha futura (mañana a las 10:00)
    const futureDate = dayjs().add(1, 'day').hour(10).minute(0).format('YYYY-MM-DDTHH:mm');
    await startAtInput.fill(futureDate);
    
    await notesInput.fill('Consulta de rutina test');

    await reserveButton.click();

    // Verificamos que el turno aparezca en la lista
    // Esperamos a que no este cargando/reservando
    await expect(reserveButton).toBeEnabled();

    // Debe mostrarse en el historial con estado PENDIENTE o similar (dependiendo del idioma de StatusBadge)
    const appointmentsList = page.locator('.rounded-lg.border.bg-white.p-4');
    await expect(appointmentsList.first()).toBeVisible();
    await expect(appointmentsList.first()).toContainText('PENDIENTE', { ignoreCase: true });
  });

  test('RF-04.4: Impedir programar turno en un horario pasado', async ({ page }) => {
    const specialtySelect = page.locator('#booking-specialty');
    const doctorSelect = page.locator('#booking-doctor');
    const startAtInput = page.locator('#booking-start-at');
    const reserveButton = page.locator('button:has-text("Reservar turno")');

    await specialtySelect.selectOption({ index: 1 });
    await doctorSelect.selectOption({ index: 1 });

    // Fecha en el pasado
    const pastDate = dayjs().subtract(1, 'day').hour(10).minute(0).format('YYYY-MM-DDTHH:mm');
    await startAtInput.fill(pastDate);

    await reserveButton.click();

    // Debe mostrar error "Solo puede reservar turnos futuros" (del backend)
    const errorMsg = page.locator('.bg-red-50');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toContainText('futuro', { ignoreCase: true });
  });

  test('RF-04.2: Cancelar un turno', async ({ page }) => {
    // Si no hay turnos, este test asume que el anterior generó uno.
    const firstAppointment = page.locator('.rounded-lg.border.bg-white.p-4').first();
    await expect(firstAppointment).toBeVisible();

    // Mock window.prompt para la cancelación
    page.on('dialog', dialog => dialog.accept('Test de cancelación'));

    const cancelButton = firstAppointment.locator('button:has-text("Cancelar")');
    await cancelButton.click();

    // Verificar que desaparece la opción de gestionar (ya que cambia de estado a CANCELADO)
    // o que el estado cambia
    await expect(firstAppointment).toContainText('CANCELADO', { ignoreCase: true });
  });
});
