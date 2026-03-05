from playwright.sync_api import sync_playwright
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:8080/")

    # Wait for the page to load
    page.wait_for_load_state("networkidle")

    # Take a screenshot of the initial state
    page.screenshot(path="verification/initial.png")

    # Move mouse to center
    page.mouse.move(500, 500)
    time.sleep(0.5) # Wait for animation
    page.screenshot(path="verification/mouse_moved.png")

    # Hover over a button or link if available
    # I'll look for a button or link
    try:
        element = page.locator("button, a").first
        if element.is_visible():
            box = element.bounding_box()
            if box:
                page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
                time.sleep(0.5)
                page.screenshot(path="verification/hovered.png")
                print("Hovered over an element")
    except Exception as e:
        print(f"Could not hover: {e}")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
