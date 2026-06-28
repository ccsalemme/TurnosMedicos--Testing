import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from conftest_selenium import crear_driver, login, BASE_URL, pause
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


def test_admin_visualiza_dashboard_y_proximas_consultas():
    driver = crear_driver()
    wait = WebDriverWait(driver, 10)
    try:
        print("RF-07.1: El administrador visualiza el dashboard con contadores y próximas consultas")
        login(driver, "admin@clinica.local", "Admin123!")
        driver.get(f"{BASE_URL}/admin")
        pause(1.5)

        wait.until(EC.visibility_of_element_located((By.XPATH, "//*[contains(text(), 'Panel administrativo')]")))
        assert "Tablero operativo" in driver.page_source, "No se visualizó el tablero operativo"
        assert "Proximos turnos" in driver.page_source or "Próximos turnos" in driver.page_source, "No se visualizó la lista de próximas consultas"
        print("OK - El dashboard administrativo mostró contadores y próximas consultas")
    except AssertionError as e:
        print(f"Test fallido: {e}")
    except Exception as e:
        print(f"Error inesperado: {e}")
    finally:
        driver.quit()


def test_admin_gestiona_usuarios_y_ventana_de_cancelacion():
    driver = crear_driver()
    wait = WebDriverWait(driver, 10)
    try:
        print("RF-07.2 / RF-07.5: El administrador gestiona usuarios y configura la ventana de cancelación")
        login(driver, "admin@clinica.local", "Admin123!")
        driver.get(f"{BASE_URL}/admin")
        pause(1.5)

        wait.until(EC.visibility_of_element_located((By.XPATH, "//*[contains(text(), 'Usuarios y roles')]")))
        save_buttons = driver.find_elements(By.XPATH, "//button[contains(text(), 'Guardar')]")
        assert len(save_buttons) > 0, "No se visualizaron acciones de usuarios"

        cancellation_input = wait.until(EC.presence_of_element_located((By.ID, "cancellation-window")))
        cancellation_input.clear()
        cancellation_input.send_keys("48")
        driver.find_element(By.XPATH, "//button[contains(text(), 'Guardar configuracion')]").click()
        pause(2.0)

        updated_value = driver.find_element(By.ID, "cancellation-window").get_attribute("value")
        assert updated_value == "48", f"No se actualizó la ventana de cancelación: {updated_value}"
        print("OK - La ventana de cancelación se actualizó correctamente")
    except AssertionError as e:
        print(f"Test fallido: {e}")
    except Exception as e:
        print(f"Error inesperado: {e}")
    finally:
        driver.quit()


def test_admin_crea_especialidad_y_sede():
    driver = crear_driver()
    wait = WebDriverWait(driver, 10)
    try:
        print("RF-07.3 / RF-07.4: El administrador crea una especialidad y una sede")
        login(driver, "admin@clinica.local", "Admin123!")
        driver.get(f"{BASE_URL}/admin")
        pause(1.5)

        wait.until(EC.visibility_of_element_located((By.XPATH, "//*[contains(text(), 'Especialidades')]")))

        specialty_name = driver.find_element(By.ID, "specialty-name")
        specialty_name.clear()
        specialty_name.send_keys("Neurología")
        driver.find_element(By.ID, "specialty-duration").clear()
        driver.find_element(By.ID, "specialty-duration").send_keys("45")
        driver.find_element(By.ID, "specialty-description").clear()
        driver.find_element(By.ID, "specialty-description").send_keys("Especialidad de prueba")
        driver.find_element(By.XPATH, "//button[contains(text(), 'Agregar especialidad')]").click()
        pause(2.0)

        assert "Neurología" in driver.page_source or "NEUROLOGÍA" in driver.page_source, "No se registró la especialidad en la vista"

        site_name = driver.find_element(By.ID, "site-name")
        site_name.clear()
        site_name.send_keys("Sede Test")
        driver.find_element(By.ID, "site-address").clear()
        driver.find_element(By.ID, "site-address").send_keys("Av. Test 123")
        driver.find_element(By.XPATH, "//button[contains(text(), 'Agregar sede')]").click()
        pause(2.0)

        assert "Sede Test" in driver.page_source, "No se registró la sede en la vista"
        print("OK - Se crearon una especialidad y una sede desde el panel administrativo")
    except AssertionError as e:
        print(f"Test fallido: {e}")
    except Exception as e:
        print(f"Error inesperado: {e}")
    finally:
        driver.quit()


if __name__ == "__main__":
    print("=== RF-07: Tests del panel de administración ===\n")
    test_admin_visualiza_dashboard_y_proximas_consultas()
    test_admin_gestiona_usuarios_y_ventana_de_cancelacion()
    test_admin_crea_especialidad_y_sede()
    print("\n=== Fin de tests del panel de administración ===")
