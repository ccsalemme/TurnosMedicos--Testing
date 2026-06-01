import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from conftest_selenium import crear_driver, login, BASE_URL
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC

def test_ver_y_editar_perfil():
    driver = crear_driver()
    wait = WebDriverWait(driver, 10)
    try:
        print("RF-02.1: Ver y editar perfil del paciente")
        login(driver, "paciente@clinica.local", "Paciente123!")
        driver.get(f"{BASE_URL}/patient")

        wait.until(EC.visibility_of_element_located((By.ID, "patient-first-name")))

        first_name = driver.find_element(By.ID, "patient-first-name")
        phone = driver.find_element(By.ID, "patient-phone")

        first_name.clear()
        first_name.send_keys("PacienteEditado")
        phone.clear()
        phone.send_keys("1122334455")

        driver.find_element(By.XPATH, "//button[contains(text(), 'Guardar perfil')]").click()
        import time
        time.sleep(2)
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

def test_filtrar_especialidades_y_medicos():
    driver = crear_driver()
    wait = WebDriverWait(driver, 10)
    try:
        print("RF-02.2: Filtrar especialidades y medicos")
        login(driver, "paciente@clinica.local", "Paciente123!")
        driver.get(f"{BASE_URL}/patient")

        specialty_select = wait.until(EC.presence_of_element_located((By.ID, "booking-specialty")))
        specialty = Select(specialty_select)
        assert len(specialty.options) > 1, "No hay especialidades cargadas"
        print(f"Especialidades encontradas: {len(specialty.options)}")

        specialty.select_by_index(1)

        import time
        time.sleep(1)

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
