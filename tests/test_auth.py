import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from conftest_selenium import crear_driver, login, BASE_URL, pause
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


def _report_result(caso, ok, detalle=None):
    estado = "PASÓ" if ok else "FALLÓ"
    if detalle:
        print(f"Resultado: {estado} - {caso}: {detalle}")
    else:
        print(f"Resultado: {estado} - {caso}")


# RF-01.2: Verifica el inicio de sesión de un paciente con email y contraseña.
def test_login_paciente():
    driver = crear_driver()
    try:
        print("RF-01.2: Inicio de sesión de paciente")
        wait = login(driver, "paciente@clinica.local", "Paciente123!")
        assert "localhost:5173" in driver.current_url, "No redirigió correctamente"
        _report_result("Inicio de sesión de paciente", True, f"URL: {driver.current_url}")
    except AssertionError as e:
        _report_result("Inicio de sesión de paciente", False, str(e))
    except Exception as e:
        _report_result("Inicio de sesión de paciente", False, f"Error inesperado: {e}")
    finally:
        driver.quit()

# RF-01.2: Verifica el inicio de sesión de un médico con email y contraseña.
def test_login_medico():
    driver = crear_driver()
    try:
        print("RF-01.2: Inicio de sesión de médico")
        wait = login(driver, "doctor1@clinica.local", "Doctor123!")
        assert "localhost:5173" in driver.current_url, "No redirigió correctamente"
        _report_result("Inicio de sesión de médico", True, f"URL: {driver.current_url}")
    except AssertionError as e:
        _report_result("Inicio de sesión de médico", False, str(e))
    except Exception as e:
        _report_result("Inicio de sesión de médico", False, f"Error inesperado: {e}")
    finally:
        driver.quit()

# RF-01.2: Verifica el inicio de sesión de un administrador con email y contraseña.
def test_login_admin():
    driver = crear_driver()
    try:
        print("RF-01.2: Inicio de sesión de administrador")
        wait = login(driver, "admin@clinica.local", "Admin123!")
        assert "localhost:5173" in driver.current_url, "No redirigió correctamente"
        _report_result("Inicio de sesión de administrador", True, f"URL: {driver.current_url}")
    except AssertionError as e:
        _report_result("Inicio de sesión de administrador", False, str(e))
    except Exception as e:
        _report_result("Inicio de sesión de administrador", False, f"Error inesperado: {e}")
    finally:
        driver.quit()

# RF-01.4: Verifica que las credenciales inválidas no permitan el acceso y mantengan al usuario en login.
def test_login_credenciales_invalidas():
    driver = crear_driver()
    wait = WebDriverWait(driver, 10)
    try:
        print("RF-01.4: Login con credenciales inválidas")
        from selenium.webdriver.common.by import By
        driver.get(f"{BASE_URL}/login")
        pause(1.0)
        wait.until(EC.presence_of_element_located((By.ID, "email")))
        driver.find_element(By.ID, "email").send_keys("noexiste@clinica.local")
        pause(0.3)
        driver.find_element(By.ID, "password").send_keys("ClaveIncorrecta123!")
        pause(0.3)
        driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
        pause(2.0)
        assert driver.current_url == f"{BASE_URL}/login", "Deberia mantenerse en login"
        _report_result("Login con credenciales inválidas", True, "Se mantuvo en la página de login")
    except AssertionError as e:
        _report_result("Login con credenciales inválidas", False, str(e))
    except Exception as e:
        _report_result("Login con credenciales inválidas", False, f"Error inesperado: {e}")
    finally:
        driver.quit()

# RF-01.1: Verifica que un paciente pueda registrarse con email, contraseña, nombre, apellido, documento y teléfono.
def test_registro_paciente():
    import time
    from selenium.webdriver.common.by import By
    driver = crear_driver()
    wait = WebDriverWait(driver, 10)
    try:
        print("RF-01.1: Registro de nuevo paciente")
        driver.get(f"{BASE_URL}/register")
        pause(1.0)

        wait.until(EC.presence_of_element_located((By.ID, "firstName")))

        email_unico = f"test_paciente_{int(time.time())}@clinica.local"

        driver.find_element(By.ID, "firstName").send_keys("Juan")
        pause(0.3)
        driver.find_element(By.ID, "lastName").send_keys("Test")
        pause(0.3)
        driver.find_element(By.ID, "document").send_keys("12345678")
        pause(0.3)

        birth_date = driver.find_element(By.ID, "birthDate")
        driver.execute_script("arguments[0].value = '1990-01-01'", birth_date)
        pause(0.3)

        driver.find_element(By.ID, "phone").send_keys("1122334455")
        pause(0.3)
        driver.find_element(By.ID, "email").send_keys(email_unico)
        pause(0.3)
        driver.find_element(By.ID, "password").send_keys("TestPass123!")
        pause(0.3)

        driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
        wait.until(EC.url_contains("/patient"))
        pause(1.0)

        assert "/patient" in driver.current_url, f"No redirigió al panel de paciente, URL actual: {driver.current_url}"
        _report_result("Registro de nuevo paciente", True, f"URL: {driver.current_url}")

    except AssertionError as e:
        _report_result("Registro de nuevo paciente", False, str(e))
    except Exception as e:
        _report_result("Registro de nuevo paciente", False, f"Error inesperado: {e}")
    finally:
        driver.quit()

# RF-01.5: Verifica que el cierre de sesión deje al usuario fuera de la sesión activa.
def test_cerrar_sesion():
    import time
    from selenium.webdriver.common.by import By
    driver = crear_driver()
    wait = WebDriverWait(driver, 10)
    try:
        print("RF-01.5: Cierre de sesión")
        login(driver, "paciente@clinica.local", "Paciente123!")
        pause(1.0)
        driver.get(f"{BASE_URL}/patient")
        pause(1.0)

        boton_cerrar = wait.until(EC.element_to_be_clickable(
            (By.XPATH, "//button[contains(text(), 'Cerrar sesion')]")
        ))
        boton_cerrar.click()
        pause(2.0)

        assert "login" in driver.current_url or driver.current_url == f"{BASE_URL}/", \
            f"No redirigió al login, URL actual: {driver.current_url}"
        _report_result("Cierre de sesión", True, f"URL: {driver.current_url}")

    except AssertionError as e:
        _report_result("Cierre de sesión", False, str(e))
    except Exception as e:
        _report_result("Cierre de sesión", False, f"Error inesperado: {e}")
    finally:
        driver.quit()

if __name__ == "__main__":
    print("=== RF-01: Autenticación y registro ===\n")
    test_registro_paciente()
    test_login_paciente()
    test_login_medico()
    test_login_admin()
    test_login_credenciales_invalidas()
    test_cerrar_sesion()
    print("\n=== Fin de tests de autenticación y registro===")
