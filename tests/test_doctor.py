import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from conftest_selenium import crear_driver, login, BASE_URL, pause
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


def test_doctor_visualiza_turnos_asignados():
    driver = crear_driver()
    wait = WebDriverWait(driver, 10)
    try:
        print("RF-05.1: El médico visualiza sus turnos asignados")
        login(driver, "doctor1@clinica.local", "Doctor123!")
        driver.get(f"{BASE_URL}/doctor")
        pause(1.5)

        wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, ".rounded-lg.border.bg-white.p-4")))
        cards = driver.find_elements(By.CSS_SELECTOR, ".rounded-lg.border.bg-white.p-4")
        assert len(cards) > 0, "No se visualizaron turnos asignados en el panel del médico"

        page_text = driver.page_source.upper()
        assert "AGENDA DE TURNOS" in page_text or "PORTAL DEL MEDICO" in page_text, "No se cargó la vista del médico"
        print("OK - Se visualizaron turnos asignados en el panel del médico")
    except AssertionError as e:
        print(f"Test fallido: {e}")
    except Exception as e:
        print(f"Error inesperado: {e}")
    finally:
        driver.quit()


def test_doctor_confirma_turno_pendiente():
    driver = crear_driver()
    wait = WebDriverWait(driver, 10)
    try:
        print("RF-05.2: El médico confirma un turno pendiente")
        login(driver, "doctor1@clinica.local", "Doctor123!")
        driver.get(f"{BASE_URL}/doctor")
        pause(1.5)

        wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, ".rounded-lg.border.bg-white.p-4")))
        cards = driver.find_elements(By.CSS_SELECTOR, ".rounded-lg.border.bg-white.p-4")
        assert len(cards) > 0, "No hay turnos disponibles para confirmar"

        target_card = None
        for card in cards:
            if "CONFIRMAR" in card.text.upper() or "PENDIENTE" in card.text.upper():
                target_card = card
                break

        assert target_card is not None, "No se encontró un turno pendiente para confirmar"
        target_card.find_element(By.XPATH, ".//button[contains(text(), 'Confirmar')]").click()
        pause(2.0)

        updated_text = driver.page_source.upper()
        assert "CONFIRMADO" in updated_text or "CONFIRMED" in updated_text, "El turno no cambió a estado confirmado"
        print("OK - El turno pendiente se confirmó correctamente")
    except AssertionError as e:
        print(f"Test fallido: {e}")
    except Exception as e:
        print(f"Error inesperado: {e}")
    finally:
        driver.quit()


def test_doctor_completa_y_no_show():
    driver = crear_driver()
    wait = WebDriverWait(driver, 10)
    try:
        print("RF-05.3 / RF-05.4: El médico completa un turno y registra un no-show")
        login(driver, "doctor1@clinica.local", "Doctor123!")
        driver.get(f"{BASE_URL}/doctor")
        pause(1.5)

        wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, ".rounded-lg.border.bg-white.p-4")))
        cards = driver.find_elements(By.CSS_SELECTOR, ".rounded-lg.border.bg-white.p-4")
        assert len(cards) > 0, "No hay turnos disponibles para actualizar"

        confirmed_card = None
        for card in cards:
            if "COMPLETAR" in card.text.upper() or "NO SHOW" in card.text.upper() or "CONFIRMADO" in card.text.upper():
                confirmed_card = card
                break

        if confirmed_card is None:
            pending_card = None
            for card in cards:
                if "CONFIRMAR" in card.text.upper() or "PENDIENTE" in card.text.upper():
                    pending_card = card
                    break
            assert pending_card is not None, "No se encontró un turno pendiente ni confirmado para actualizar"
            pending_card.find_element(By.XPATH, ".//button[contains(text(), 'Confirmar')]").click()
            pause(2.0)
            cards = driver.find_elements(By.CSS_SELECTOR, ".rounded-lg.border.bg-white.p-4")
            for card in cards:
                if "COMPLETAR" in card.text.upper() or "NO SHOW" in card.text.upper() or "CONFIRMADO" in card.text.upper():
                    confirmed_card = card
                    break

        assert confirmed_card is not None, "No se encontró un turno confirmado para completar o marcar no-show"
        confirmed_card.find_element(By.XPATH, ".//button[contains(text(), 'Completar')]").click()
        pause(2.0)

        completed_text = driver.page_source.upper()
        assert "COMPLETADO" in completed_text or "COMPLETAR" not in completed_text, "El turno no cambió a estado completado"
        print("OK - El turno se marcó como completado")

        cards = driver.find_elements(By.CSS_SELECTOR, ".rounded-lg.border.bg-white.p-4")
        if len(cards) > 0:
            for card in cards:
                if "NO SHOW" in card.text.upper() or "CONFIRMADO" in card.text.upper():
                    card.find_element(By.XPATH, ".//button[contains(text(), 'No show')]").click()
                    pause(2.0)
                    break

        no_show_text = driver.page_source.upper()
        assert "NO SHOW" in no_show_text or "NO_SHOW" in no_show_text, "El turno no se marcó como no-show"
        print("OK - El turno se marcó como no-show")
    except AssertionError as e:
        print(f"Test fallido: {e}")
    except Exception as e:
        print(f"Error inesperado: {e}")
    finally:
        driver.quit()


if __name__ == "__main__":
    print("=== RF-05: Tests del panel del médico ===\n")
    test_doctor_visualiza_turnos_asignados()
    test_doctor_confirma_turno_pendiente()
    test_doctor_completa_y_no_show()
    print("\n=== Fin de tests del panel del médico ===")
