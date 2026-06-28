import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from conftest_selenium import crear_driver, login, BASE_URL, pause
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC

# RF-02.1: Verifica que el paciente pueda visualizar y editar su perfil desde el panel.
def test_ver_y_editar_perfil():
    driver = crear_driver()
    wait = WebDriverWait(driver, 10)
    try:
        print("RF-02.1: Edición del perfil del paciente")
        login(driver, "paciente@clinica.local", "Paciente123!")
        pause(1.0)
        driver.get(f"{BASE_URL}/patient")
        pause(0.8)

        wait.until(EC.visibility_of_element_located((By.ID, "patient-first-name")))

        first_name = driver.find_element(By.ID, "patient-first-name")
        phone = driver.find_element(By.ID, "patient-phone")

        first_name.clear()
        pause(0.3)
        first_name.send_keys("PacienteEditado")
        pause(0.3)
        phone.clear()
        pause(0.3)
        phone.send_keys("1122334455")
        pause(0.3)

        driver.find_element(By.XPATH, "//button[contains(text(), 'Guardar perfil')]").click()
        pause(2.0)
        print("Perfil guardado")

        driver.refresh()
        wait.until(EC.visibility_of_element_located((By.ID, "patient-first-name")))

        valor = driver.find_element(By.ID, "patient-first-name").get_attribute("value")
        assert valor == "PacienteEditado", f"Se esperaba 'PacienteEditado' pero se obtuvo '{valor}'"
        print("OK - El nombre se mantuvo tras recargar")

    except AssertionError as e:
        print(f"Test fallido: {e}")
    except Exception as e:
        print(f"Error inesperado: {e}")
    finally:
        driver.quit()

# RF-02.2 / RF-02.3: Verifica que se muestren especialidades y que al filtrar por una de ellas aparezcan médicos disponibles.
def test_filtrar_especialidades_y_medicos():
    driver = crear_driver()
    wait = WebDriverWait(driver, 10)
    try:
        print("RF-02.2 / RF-02.3: Visualización y filtrado de especialidades y médicos")
        login(driver, "paciente@clinica.local", "Paciente123!")
        pause(1.0)
        driver.get(f"{BASE_URL}/patient")
        pause(0.8)

        specialty_select = wait.until(EC.presence_of_element_located((By.ID, "booking-specialty")))
        specialty = Select(specialty_select)
        assert len(specialty.options) > 1, "No hay especialidades cargadas"
        print(f"Especialidades encontradas: {len(specialty.options)}")

        specialty.select_by_index(1)
        pause(1.0)

        doctor_select = wait.until(EC.presence_of_element_located((By.ID, "booking-doctor")))
        doctor = Select(doctor_select)
        assert len(doctor.options) > 0, "No hay medicos para la especialidad seleccionada"
        print(f"Medicos encontrados: {len(doctor.options)}")
        print("OK - Filtro de especialidades y medicos funciona")

    except AssertionError as e:
        print(f"Test fallido: {e}")
    except Exception as e:
        print(f"Error inesperado: {e}")
    finally:
        driver.quit()

if __name__ == "__main__":
    print("=== RF-02: Tests de Perfil de Paciente ===\n")
    test_ver_y_editar_perfil()
    test_filtrar_especialidades_y_medicos()
    print("\n=== Fin de tests de perfil ===")
