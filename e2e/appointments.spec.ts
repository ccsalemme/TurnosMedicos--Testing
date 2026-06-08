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

    // Poner una fecha futura en la que el médico esté disponible (próximo miércoles a las 12:00 local, que es 15:00 UTC y cae en la franja de 14:00-18:00 UTC)
    let futureDate = dayjs().hour(12).minute(0).second(0);
    while (futureDate.day() !== 3 || futureDate.isBefore(dayjs().add(1, 'hour'))) {
      futureDate = futureDate.add(1, 'day');
    }
    const futureDateStr = futureDate.format('YYYY-MM-DDTHH:mm');
    await startAtInput.fill(futureDateStr);
    
    await notesInput.fill('Consulta de rutina test');

    await reserveButton.click();

    // Verificamos que el turno aparezca en la lista
    // Esperamos a que no este cargando/reservando
    await expect(reserveButton).toBeEnabled();

    // Debe mostrarse en el historial con estado PENDIENTE
    const expectedDateText = futureDate.format('DD/MM/YYYY 12:00');
    const newAppointment = page.locator('.rounded-lg.border.bg-white.p-4', { hasText: expectedDateText })
      .filter({ hasText: 'PENDIENTE' });
    await expect(newAppointment).toBeVisible();
    await expect(newAppointment).toContainText('PENDIENTE', { ignoreCase: true });
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
    // 1. Reservar un turno primero en un horario diferente (13:00 local) para asegurar que existe uno pendiente
    const specialtySelect = page.locator('#booking-specialty');
    const doctorSelect = page.locator('#booking-doctor');
    const startAtInput = page.locator('#booking-start-at');
    const reserveButton = page.locator('button:has-text("Reservar turno")');

    await specialtySelect.selectOption({ index: 1 });
    await doctorSelect.selectOption({ index: 1 });

    let futureDate = dayjs().hour(13).minute(0).second(0);
    while (futureDate.day() !== 3 || futureDate.isBefore(dayjs().add(1, 'hour'))) {
      futureDate = futureDate.add(1, 'day');
    }
    const futureDateStr = futureDate.format('YYYY-MM-DDTHH:mm');
    await startAtInput.fill(futureDateStr);
    await reserveButton.click();
    await expect(reserveButton).toBeEnabled();

    // 2. Ahora que está reservado, procedemos a cancelarlo
    const dateText = futureDate.format('DD/MM/YYYY 13:00');
    const manageableAppointment = page.locator('.rounded-lg.border.bg-white.p-4', {
      hasText: dateText
    }).filter({ has: page.locator('button:has-text("Cancelar")') }).first();
    await expect(manageableAppointment).toBeVisible();

    // Mock window.prompt para la cancelación
    page.on('dialog', dialog => dialog.accept('Test de cancelación'));

    const cancelButton = manageableAppointment.locator('button:has-text("Cancelar")');
    await cancelButton.click();

    // Buscar la tarjeta por su fecha y verificar que cambia de estado a CANCELADO
    const cancelledCard = page.locator('.rounded-lg.border.bg-white.p-4', {
      hasText: dateText
    }).first();
    await expect(cancelledCard).toContainText('CANCELADO', { ignoreCase: true });
  });
});
