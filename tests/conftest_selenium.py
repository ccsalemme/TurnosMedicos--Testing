import time

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

BASE_URL = "http://localhost:5173"


def pause(seconds: float = 0.8) -> None:
    time.sleep(seconds)


def crear_driver():
    options = webdriver.ChromeOptions()
    options.add_argument("--disable-save-password-bubble")
    options.add_experimental_option("prefs", {
        "credentials_enable_service": False,
        "profile.password_manager_enabled": False
    })
    driver = webdriver.Chrome(
        service=Service(ChromeDriverManager().install()),
        options=options
    )
    driver.maximize_window()
    return driver

def login(driver, email, password):
    wait = WebDriverWait(driver, 10)
    driver.get(f"{BASE_URL}/login")
    pause(1.0)
    wait.until(EC.presence_of_element_located((By.ID, "email")))

    email_input = driver.find_element(By.ID, "email")
    for char in email:
        email_input.send_keys(char)
        pause(0.08)

    password_input = driver.find_element(By.ID, "password")
    for char in password:
        password_input.send_keys(char)
        pause(0.08)

    submit_button = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
    pause(0.6)
    submit_button.click()
    pause(2.5)
    return wait
