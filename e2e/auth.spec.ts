import { test, expect } from '@playwright/test';

test.describe('RF-01: Autenticación y Registro', () => {
  const adminCredentials = { email: 'admin@clinica.local', password: 'Admin123!' };
  const doctorCredentials = { email: 'doctor1@clinica.local', password: 'Doctor123!' };
  const patientCredentials = { email: 'paciente@clinica.local', password: 'Paciente123!' };

  test('RF-01.1: Permite el registro de un nuevo paciente', async ({ page }) => {
    await page.goto('/register');
    
    const uniqueEmail = `test_patient_${Date.now()}@clinica.local`;

    await page.fill('#firstName', 'Juan');
    await page.fill('#lastName', 'Test');
    await page.fill('#document', '12345678');
    await page.fill('#birthDate', '1990-01-01');
    await page.fill('#phone', '1122334455');
    await page.fill('#email', uniqueEmail);
    await page.fill('#password', 'TestPass123!');

    await page.click('button[type="submit"]');

    // Debe redirigir al panel del paciente
    await expect(page).toHaveURL(/\/patient/);
  });

  test('RF-01.2 y RF-01.4: Inicio de sesión y redirección para Admin', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', adminCredentials.email);
    await page.fill('#password', adminCredentials.password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/admin/);
  });

  test('RF-01.2 y RF-01.4: Inicio de sesión y redirección para Médico', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', doctorCredentials.email);
    await page.fill('#password', doctorCredentials.password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/doctor/);
  });

  test('RF-01.2 y RF-01.4: Inicio de sesión y redirección para Paciente', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', patientCredentials.email);
    await page.fill('#password', patientCredentials.password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/patient/);
  });

  test('RF-01.3: Emite y mantiene el token JWT', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', patientCredentials.email);
    await page.fill('#password', patientCredentials.password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/patient/);

    // Evaluar si existe el token en localStorage
    const token = await page.evaluate(() => localStorage.getItem('tm_access_token'));
    expect(token).toBeTruthy();
    
    // Si recargamos, sigue autenticado (no vuelve a login)
    await page.reload();
    await expect(page).toHaveURL(/\/patient/);
  });
});
