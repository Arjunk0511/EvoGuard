"""
Place at: bot_simulation/simulate_bot.py

Drives a real Chromium browser (via Playwright) against your own
locally-running flipkart-mern frontend (CRA dev server, default port
3000), through the /data-collection page. Because it's a real browser,
behavioralCollector.js runs exactly as it would for a real user and
captures genuine automation traces — straight-line mouse paths,
uniform keystroke timing — labeled 'bot'.

This only targets your own local dev server — not any third-party site.

Setup:
    pip install playwright --break-system-packages
    playwright install chromium

Before running: start both servers
    cd flipkart-mern-master/flipkart-mern-master/backend && npm start   # port 4000
    cd flipkart-mern-master/flipkart-mern-master/frontend && npm start  # port 3000
    node server.js                                                      # EvoGuard gateway, port 5000

Usage:
    python simulate_bot.py --base-url http://localhost:3000 --sessions 50
"""

import argparse
import random
import time

from playwright.sync_api import sync_playwright


def run_one_bot_session(page, base_url, session_index):
    page.goto(f"{base_url}/data-collection?label=bot")
    page.click("#record-toggle-btn")  # Start recording

    width = page.viewport_size["width"]
    height = page.viewport_size["height"]

    # Scripted mouse movement: near-linear interpolation via Playwright's
    # `steps` param, unlike human motor noise.
    x, y = random.randint(0, width), random.randint(0, height)
    page.mouse.move(x, y)
    for _ in range(random.randint(15, 30)):
        tx, ty = random.randint(0, width), random.randint(0, height)
        page.mouse.move(tx, ty, steps=random.choice([5, 10, 20]))
        time.sleep(random.choice([0.05, 0.1]))

    for _ in range(random.randint(1, 3)):
        page.mouse.click(random.randint(0, width), random.randint(0, height))
        time.sleep(0.1)

    # Scripted typing: fixed 20ms delay between every key, no human variance.
    search_box = page.query_selector("input[type='search'], input[type='text']")
    if search_box:
        search_box.click()
        page.keyboard.type("running shoes", delay=20)

    time.sleep(1)
    page.click("#record-toggle-btn")  # Stop recording, flushes final batch
    time.sleep(1)  # let sendBeacon/fetch land before navigating away
    print(f"  session {session_index}: done")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://localhost:3000")
    parser.add_argument("--sessions", type=int, default=50)
    args = parser.parse_args()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        for i in range(args.sessions):
            page = browser.new_page(viewport={"width": 1280, "height": 800})
            try:
                run_one_bot_session(page, args.base_url, i)
            except Exception as e:
                print(f"  session {i}: failed ({e})")
            finally:
                page.close()
        browser.close()

    print(f"Finished {args.sessions} simulated bot sessions.")


if __name__ == "__main__":
    main()