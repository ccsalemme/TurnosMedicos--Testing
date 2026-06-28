import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from conftest_selenium import crear_driver, login, BASE_URL
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from datetime import datetime, timedelta
import time


def _report_result(caso, ok, detalle=None):
    estado = "PASÓ" if ok else "FALLÓ"
    if detalle:
        print(f"Resultado: {estado} - {caso}: {detalle}")
    else:
        print(f"Resultado: {estado} - {caso}")


def _set_datetime_input(driver, element, value: str) -> None:
    driver.execute_script(
        """
        const input = arguments[0];
        input.value = arguments[1];
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        """,
        element,
        value,
    )


def _book_active_appointment(driver, wait, start_dt: datetime, notes: str = "Consulta de rutina test"):
    login(driver, "paciente@clinica.local", "Paciente123!")
    driver.get(f"{BASE_URL}/patient")

    specialty_select = wait.until(EC.presence_of_element_located((By.ID, "booking-specialty")))
    Select(specialty_select).select_by_index(1)
    time.sleep(1)

    doctor_select = wait.until(EC.presence_of_element_located((By.ID, "booking-doctor")))
    Select(doctor_select).select_by_index(1)

    start_at_input = wait.until(EC.presence_of_element_located((By.ID, "booking-start-at")))
    _set_datetime_input(driver, start_at_input, start_dt.strftime("%Y-%m-%dT%H:%M"))

    notes_input = wait.until(EC.presence_of_element_located((By.ID, "booking-notes")))
    notes_input.clear()
    notes_input.send_keys(notes)

    driver.find_element(By.XPATH, "//button[contains(., 'Reservar turno')]").click()
    wait.until(
        lambda d: any(
            start_dt.strftime("%d/%m/%Y") in card.text and "PENDIENTE" in card.text.upper()
            for card in d.find_elements(By.CSS_SELECTOR, ".rounded-lg.border.bg-white.p-4")
        )
    )
    return start_dt


# RF-03.1: Verifica que un paciente pueda reservar un turno desde la interfaz.
# RF-03.3: Verifica que el turno reservado quede en estado PENDIENTE.
def test_reservar_turno():
    driver = crear_driver()
    wait = WebDriverWait(driver, 10)
    try:
        print("RF-03.1 / RF-03.3: Reserva de turno y validación de estado PENDIENTE")
        fecha_futura = (datetime.now() + timedelta(days=1)).replace(hour=10, minute=0, second=0)
        _book_active_appointment(driver, wait, fecha_futura)
        _report_result("Reserva de turno", True, "Turno reservado y aparece como PENDIENTE")

    except AssertionError as e:
        _report_result("Reserva de turno", False, str(e))
    except Exception as e:
        _report_result("Reserva de turno", False, f"Error inesperado: {e}")
    finally:
        driver.quit()

# RF-03.2: Verifica que no se permita reservar un turno con fecha pasada.
def test_reservar_turno_fecha_pasada():
    driver = crear_driver()
    wait = WebDriverWait(driver, 10)
    try:
        print("RF-03.2: Se impide reservar turno en fecha pasada")
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
        _set_datetime_input(driver, start_at, fecha_str)

        driver.find_element(By.XPATH, "//button[contains(., 'Reservar turno')]").click()

        wait.until(
            lambda d: any(
                "futuro" in element.text.lower()
                for element in d.find_elements(By.CSS_SELECTOR, "p, div, span")
                if element.is_displayed()
            )
        )
        _report_result("Reserva en fecha pasada", True, "Se mostró el error de fecha pasada")

    except AssertionError as e:
        _report_result("Reserva en fecha pasada", False, str(e))
    except Exception as e:
        _report_result("Reserva en fecha pasada", False, f"Error inesperado: {e}")
    finally:
        driver.quit()

# RF-04.2: Verifica que un paciente pueda cancelar un turno desde su panel.
def test_cancelar_turno():
    driver = crear_driver()
    wait = WebDriverWait(driver, 10)
    try:
        print("RF-04.2: Cancelación de turno desde la interfaz")
        fecha_futura = (datetime.now() + timedelta(days=2)).replace(hour=12, minute=0, second=0)
        _book_active_appointment(driver, wait, fecha_futura, "Turno para cancelar")

        cancelar = wait.until(
            EC.presence_of_element_located((By.XPATH, "//div[contains(., 'Turno para cancelar')]//button[contains(., 'Cancelar')]"))
        )
        card = cancelar.find_element(By.XPATH, "./ancestor::div[contains(@class, 'rounded-lg')][1]")
        driver.execute_script("window.prompt = function() { return 'Test de cancelacion'; }")
        cancelar.click()

        wait.until(lambda d: "CANCELADO" in card.text.upper())
        _report_result("Cancelación de turno", True, "El turno quedó cancelado")

    except AssertionError as e:
        _report_result("Cancelación de turno", False, str(e))
    except Exception as e:
        _report_result("Cancelación de turno", False, f"Error inesperado: {e}")
    finally:
        driver.quit()

# RF-04.3: Verifica que un paciente pueda reprogramar un turno existente.
def test_reprogramar_turno():
    driver = crear_driver()
    wait = WebDriverWait(driver, 10)
    try:
        print("RF-04.3: Reprogramación de turno")
        fecha_futura = (datetime.now() + timedelta(days=3)).replace(hour=11, minute=0, second=0)
        _book_active_appointment(driver, wait, fecha_futura, "Turno para reprogramar")

        reprogramar = wait.until(
            EC.presence_of_element_located((By.XPATH, "//div[contains(., 'Turno para reprogramar')]//button[contains(., 'Reprogramar')]"))
        )
        card = reprogramar.find_element(By.XPATH, "./ancestor::div[contains(@class, 'rounded-lg')][1]")

        nueva_fecha = (datetime.now() + timedelta(days=4)).replace(hour=13, minute=0, second=0)
        nueva_fecha_str = nueva_fecha.strftime("%Y-%m-%dT%H:%M")

        input_datetime = card.find_element(By.XPATH, ".//input[@type='datetime-local']")
        _set_datetime_input(driver, input_datetime, nueva_fecha_str)

        reprogramar.click()

        wait.until(lambda d: nueva_fecha.strftime("%d/%m/%Y") in card.text)
        _report_result("Reprogramación de turno", True, "El turno quedó reprogramado")

    except AssertionError as e:
        _report_result("Reprogramación de turno", False, str(e))
    except Exception as e:
        _report_result("Reprogramación de turno", False, f"Error inesperado: {e}")
    finally:
        driver.quit()

if __name__ == "__main__":
    print("=== RF-03 y RF-04: Tests de Turnos ===\n")
    test_reservar_turno()
    test_reservar_turno_fecha_pasada()
    test_cancelar_turno()
    test_reprogramar_turno()
    print("\n=== Fin de tests de turnos ===")