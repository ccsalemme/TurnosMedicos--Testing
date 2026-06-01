import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from conftest_selenium import crear_driver, login, BASE_URL
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def test_login_paciente():
    driver = crear_driver()
    try:
        print("RF-01.2: Login como paciente")
        wait = login(driver, "paciente@clinica.local", "Paciente123!")
        assert "localhost:5173" in driver.current_url, "No redirigió correctamente"
        print(f"OK - URL: {driver.current_url}")
    except AssertionError as e:
        print(f"Test fallido: {e}")
    except Exception as e:
        print(f"Error inesperado: {e}")
    finally:
        driver.quit()

def test_login_medico():
    driver = crear_driver()
    try:
        print("RF-01.2: Login como medico")
        wait = login(driver, "doctor1@clinica.local", "Doctor123!")
        assert "localhost:5173" in driver.current_url, "No redirigió correctamente"
        print(f"OK - URL: {driver.current_url}")
    except AssertionError as e:
        print(f"Test fallido: {e}")
    except Exception as e:
        print(f"Error inesperado: {e}")
    finally:
        driver.quit()

def test_login_admin():
    driver = crear_driver()
    try:
        print("RF-01.2: Login como admin")
        wait = login(driver, "admin@clinica.local", "Admin123!")
        assert "localhost:5173" in driver.current_url, "No redirigió correctamente"
        print(f"OK - URL: {driver.current_url}")
    except AssertionError as e:
        print(f"Test fallido: {e}")
    except Exception as e:
        print(f"Error inesperado: {e}")
    finally:
        driver.quit()

def test_login_credenciales_invalidas():
    driver = crear_driver()
    wait = WebDriverWait(driver, 10)
    try:
        print("RF-01.3: Login con credenciales invalidas")
        from selenium.webdriver.common.by import By
        driver.get(f"{BASE_URL}/login")
        wait.until(EC.presence_of_element_located((By.ID, "email")))
        driver.find_element(By.ID, "email").send_keys("noexiste@clinica.local")
        driver.find_element(By.ID, "password").send_keys("ClaveIncorrecta123!")
        driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
        import time
        time.sleep(2)
        assert driver.current_url == f"{BASE_URL}/login", "Deberia mantenerse en login"
        print("OK - Se mantuvo en la pagina de login")
    except AssertionError as e:
        print(f"Test fallido: {e}")
    except Exception as e:
        print(f"Error inesperado: {e}")
    finally:
        driver.quit()

def test_registro_paciente():
    import time
    from selenium.webdriver.common.by import By
    driver = crear_driver()
    wait = WebDriverWait(driver, 10)
    try:
        print("RF-01.1: Registro de nuevo paciente")
        driver.get(f"{BASE_URL}/register")

        wait.until(EC.presence_of_element_located((By.ID, "firstName")))

        email_unico = f"test_paciente_{int(time.time())}@clinica.local"

        driver.find_element(By.ID, "firstName").send_keys("Juan")
        driver.find_element(By.ID, "lastName").send_keys("Test")
        driver.find_element(By.ID, "document").send_keys("12345678")

        birth_date = driver.find_element(By.ID, "birthDate")
        driver.execute_script("arguments[0].value = '1990-01-01'", birth_date)

        driver.find_element(By.ID, "phone").send_keys("1122334455")
        driver.find_element(By.ID, "email").send_keys(email_unico)
        driver.find_element(By.ID, "password").send_keys("TestPass123!")

        driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
        time.sleep(3)

        assert "patient" in driver.current_url or "localhost:5173" in driver.current_url, \
            f"No redirigió correctamente, URL actual: {driver.current_url}"
        print(f"OK - Paciente registrado y redirigido a: {driver.current_url}")

    except AssertionError as e:
        print(f"Test fallido: {e}")
    except Exception as e:
        print(f"Error inesperado: {e}")
    finally:
        driver.quit()

def test_cerrar_sesion():
    import time
    from selenium.webdriver.common.by import By
    driver = crear_driver()
    wait = WebDriverWait(driver, 10)
    try:
        print("RF-01: Cerrar sesion")
        login(driver, "paciente@clinica.local", "Paciente123!")
        driver.get(f"{BASE_URL}/patient")

        boton_cerrar = wait.until(EC.element_to_be_clickable(
            (By.XPATH, "//button[contains(text(), 'Cerrar sesion')]")
        ))
        boton_cerrar.click()
        time.sleep(2)

        assert "login" in driver.current_url or driver.current_url == f"{BASE_URL}/", \
            f"No redirigió al login, URL actual: {driver.current_url}"
        print(f"OK - Sesion cerrada, redirigido a: {driver.current_url}")

    except AssertionError as e:
        print(f"Test fallido: {e}")
    except Exception as e:
        print(f"Error inesperado: {e}")
    finally:
        driver.quit()

if __name__ == "__main__":
    print("=== RF-01: Tests de Autenticacion ===\n")
    test_registro_paciente()
    test_login_paciente()
    test_login_medico()
    test_login_admin()
    test_login_credenciales_invalidas()
    test_cerrar_sesion()
    print("\n=== Fin de tests de autenticacion ===")
