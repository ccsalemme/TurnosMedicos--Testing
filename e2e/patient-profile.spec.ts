import { test, expect } from '@playwright/test';

test.describe('RF-02: Gestión de Pacientes', () => {
  const patientCredentials = { email: 'paciente@clinica.local', password: 'Paciente123!' };

  test.beforeEach(async ({ page }) => {
    // Iniciar sesión antes de cada prueba
    await page.goto('/login');
    await page.fill('#email', patientCredentials.email);
    await page.fill('#password', patientCredentials.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/patient/);
  });

  test('RF-02.1: El paciente puede ver y editar su perfil', async ({ page }) => {
    // Verificar que los campos de perfil estén visibles
    const firstNameInput = page.locator('#patient-first-name');
    const lastNameInput = page.locator('#patient-last-name');
    const phoneInput = page.locator('#patient-phone');
    const birthDateInput = page.locator('#patient-birth-date');

    await expect(firstNameInput).toBeVisible();
    
    // Editar perfil
    await firstNameInput.fill('PacienteEditado');
    await phoneInput.fill('1122334455');
    
    await page.click('button:has-text("Guardar perfil")');
    
    // Al recargar, los datos deberían mantenerse
    await page.reload();
    await expect(page.locator('#patient-first-name')).toHaveValue('PacienteEditado');
    await expect(page.locator('#patient-phone')).toHaveValue('1122334455');
  });

  test('RF-02.2: Consultar listado de médicos y especialidades con filtro', async ({ page }) => {
    const specialtySelect = page.locator('#booking-specialty');
    const doctorSelect = page.locator('#booking-doctor');

    // Verificar que el select de especialidades tiene opciones (más allá del "Seleccione")
    const specialtyOptions = specialtySelect.locator('option');
    const count = await specialtyOptions.count();
    expect(count).toBeGreaterThan(1);

    // Seleccionar una especialidad válida (ej. índice 1)
    await specialtySelect.selectOption({ index: 1 });

    // Verificar que el select de doctores se haya filtrado (tiene al menos una opción o cambia)
    const doctorOptions = doctorSelect.locator('option');
    // Esto asume que la base de datos o el mock tiene médicos para la primera especialidad
    const doctorCount = await doctorOptions.count();
    expect(doctorCount).toBeGreaterThan(0);
  });
});
