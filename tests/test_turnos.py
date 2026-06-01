import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from conftest_selenium import crear_driver, login, BASE_URL
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from datetime import datetime, timedelta
import time

def test_reservar_turno():
    driver = crear_driver()
    wait = WebDriverWait(driver, 10)
    try:
        print("RF-03.1 y RF-04.1: Reservar turno y verlo en estado PENDIENTE")
        login(driver, "paciente@clinica.local", "Paciente123!")
        driver.get(f"{BASE_URL}/patient")

        specialty_select = wait.until(EC.presence_of_element_located((By.ID, "booking-specialty")))
        Select(specialty_select).select_by_index(1)
        time.sleep(1)

        doctor_select = wait.until(EC.presence_of_element_located((By.ID, "booking-doctor")))
        Select(doctor_select).select_by_index(1)

        fecha_futura = (datetime.now() + timedelta(days=1)).replace(hour=10, minute=0, second=0)
        fecha_str = fecha_futura.strftime("%Y-%m-%dT%H:%M")
        start_at = driver.find_element(By.ID, "booking-start-at")
        driver.execute_script("arguments[0].value = arguments[1]", start_at, fecha_str)

        notes = driver.find_element(By.ID, "booking-notes")
        notes.clear()
        notes.send_keys("Consulta de rutina test")

        driver.find_element(By.XPATH, "//button[contains(text(), 'Reservar turno')]").click()
        time.sleep(3)

        turnos = driver.find_elements(By.CSS_SELECTOR, ".rounded-lg.border.bg-white.p-4")
        assert len(turnos) > 0, "No aparecio ningun turno en la lista"

        texto = turnos[0].text.upper()
        assert "PENDIENTE" in texto, f"El turno no aparece como PENDIENTE, se obtuvo: {texto}"
        print("OK - Turno reservado y aparece como PENDIENTE")

    except AssertionError as e:
        print(f"Test fallido: {e}")
    except Exception as e:
        print(f"Error inesperado: {e}")
    finally:
        driver.quit()

def test_reservar_turno_fecha_pasada():
    driver = crear_driver()
    wait = WebDriverWait(driver, 10)
    try:
        print("RF-04.4: Impedir reservar turno en fecha pasada")
        login(driver, "paciente@clinica.local", "Paciente123!")
        driver.get(f"{BASE_URL}/patient")

        specialty_select = wait.until(EC.presence_of_element_located((By.ID, "booking-specialty")))
        Select(specialty_select).select_by_index(1)
        time.sleep(1)

        doctor_select = wait.until(EC.presence_of_element_located((By.ID, "booking-doctor")))
        Select(doctor_select).select_by_index(1)

        fecha_pasada = (datetime.now() - timedelta(days=1)).replace(hour=10, minute=0, second=0)
        fecha_str = fecha_pasada.strftime("%Y-%m-%dT%H:%M")
        start_at = driver.find_element(By.ID, "booking-start-at")
        driver.execute_script("arguments[0].value = arguments[1]", start_at, fecha_str)

        driver.find_element(By.XPATH, "//button[contains(text(), 'Reservar turno')]").click()
        time.sleep(2)

        error = driver.find_elements(By.CSS_SELECTOR, ".bg-red-50")
        assert len(error) > 0, "No aparecio mensaje de error"
        assert "futuro" in error[0].text.lower(), f"Mensaje de error inesperado: {error[0].text}"
        print("OK - Se mostro el error de fecha pasada correctamente")

    except AssertionError as e:
        print(f"Test fallido: {e}")
    except Exception as e:
        print(f"Error inesperado: {e}")
    finally:
        driver.quit()

def test_cancelar_turno():
    driver = crear_driver()
    wait = WebDriverWait(driver, 10)
    try:
        print("RF-04.2: Cancelar un turno")
        login(driver, "paciente@clinica.local", "Paciente123!")
        driver.get(f"{BASE_URL}/patient")

        turnos = wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, ".rounded-lg.border.bg-white.p-4")))
        assert len(turnos) > 0, "No hay turnos para cancelar"

        primer_turno = turnos[0]
        cancelar = primer_turno.find_element(By.XPATH, ".//button[contains(text(), 'Cancelar')]")

        driver.execute_script("window.prompt = function() { return 'Test de cancelacion'; }")
        cancelar.click()
        time.sleep(2)

        primer_turno_actualizado = driver.find_elements(By.CSS_SELECTOR, ".rounded-lg.border.bg-white.p-4")[0]
        texto = primer_turno_actualizado.text.upper()
        assert "CANCELADO" in texto, f"El turno no aparece como CANCELADO, se obtuvo: {texto}"
        print("OK - Turno cancelado correctamente")

    except AssertionError as e:
        print(f"Test fallido: {e}")
    except Exception as e:
        print(f"Error inesperado: {e}")
    finally:
        driver.quit()

def test_reprogramar_turno():
    driver = crear_driver()
    wait = WebDriverWait(driver, 10)
    try:
        print("RF-04.3: Reprogramar un turno")
        login(driver, "paciente@clinica.local", "Paciente123!")
        driver.get(f"{BASE_URL}/patient")

        turnos = wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, ".rounded-lg.border.bg-white.p-4")))
        assert len(turnos) > 0, "No hay turnos para reprogramar"

        primer_turno = turnos[0]
        reprogramar = primer_turno.find_element(By.XPATH, ".//button[contains(text(), 'Reprogramar')]")
        reprogramar.click()
        time.sleep(2)

        nueva_fecha = (datetime.now() + timedelta(days=3)).replace(hour=11, minute=0, second=0)
        nueva_fecha_str = nueva_fecha.strftime("%Y-%m-%dT%H:%M")

        start_at = wait.until(EC.presence_of_element_located((By.ID, "booking-start-at")))
        driver.execute_script("arguments[0].value = arguments[1]", start_at, nueva_fecha_str)

        driver.find_element(By.XPATH, "//button[contains(text(), 'Reservar turno')]").click()
        time.sleep(3)

        turnos_actualizados = driver.find_elements(By.CSS_SELECTOR, ".rounded-lg.border.bg-white.p-4")
        assert len(turnos_actualizados) > 0, "No aparecio ningun turno tras reprogramar"
        print("OK - Turno reprogramado correctamente")

    except AssertionError as e:
        print(f"Test fallido: {e}")
    except Exception as e:
        print(f"Error inesperado: {e}")
    finally:
        driver.quit()

if __name__ == "__main__":
    print("=== RF-03 y RF-04: Tests de Turnos ===\n")
    test_reservar_turno()
    test_reservar_turno_fecha_pasada()
    test_cancelar_turno()
    test_reprogramar_turno()
    print("\n=== Fin de tests de turnos ===")