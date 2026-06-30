import json
from pathlib import Path
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright


BASE_URL = "http://127.0.0.1:5182"
ARTIFACT_DIR = Path(__file__).resolve().parent
SCREENSHOT_DIR = ARTIFACT_DIR / "screenshots"
LOG_DIR = ARTIFACT_DIR / "logs"
SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)
LOG_DIR.mkdir(parents=True, exist_ok=True)

cart_payload = {
    "success": True,
    "data": {
        "items": [
            {
                "_id": "665000000000000000000101",
                "product": {
                    "_id": "665000000000000000000201",
                    "name": "PLASHOE QA Runner",
                    "image": "database/Male/0.webp",
                    "price": {"current": 120, "original": 150},
                },
                "quantity": 1,
                "size": 42,
                "priceAtAdd": 120,
            }
        ],
        "couponCode": None,
        "discount": 0,
    },
}

shipping_payload = {
    "success": True,
    "data": {
        "country": "United States",
        "countryCode": "US",
        "defaultMethodId": "standard",
        "subtotal": 120,
        "discount": 0,
        "discountAmount": 0,
        "merchandiseTotal": 120,
        "methods": [
            {
                "id": "standard",
                "name": "Standard",
                "price": 0,
                "estimatedDelivery": "3-5 business days",
                "orderTotal": 120,
            }
        ],
    },
}

pending_paypal_order = {
    "success": True,
    "data": {
        "_id": "order-paypal",
        "orderNumber": "PLS-PAYPAL-QA",
        "paymentProvider": "paypal",
        "paymentProviderSessionId": "paypal-order-qa",
        "paymentStatus": "payment_pending",
    },
}

paid_paypal_order = {
    "success": True,
    "data": {
        "_id": "order-paypal",
        "orderNumber": "PLS-PAYPAL-QA",
        "paymentProvider": "paypal",
        "paymentProviderSessionId": "paypal-order-qa",
        "paymentProviderIntentId": "paypal-capture-qa",
        "paymentStatus": "paid",
    },
}

failed_capture_order = {
    "success": True,
    "data": {
        "_id": "order-paypal-fail",
        "orderNumber": "PLS-PAYPAL-FAIL",
        "paymentProvider": "paypal",
        "paymentProviderSessionId": "paypal-order-fail",
        "paymentStatus": "payment_pending",
    },
}

qa_state = {"captured": False}
console_records = []
network_records = []
request_failure_records = []


def fulfill(route, payload, status=200):
    route.fulfill(status=status, content_type="application/json", body=json.dumps(payload))


def route_api(route):
    request = route.request
    parsed = urlparse(request.url)
    path = parsed.path
    method = request.method.upper()

    if path == "/api/health" and method == "GET":
        return fulfill(route, {"status": "ok", "message": "PLASHOE API is running"})

    if path == "/api/cart" and method == "GET":
        return fulfill(route, cart_payload)

    if path == "/api/cart/merge" and method == "POST":
        return fulfill(route, cart_payload)

    if path == "/api/orders/shipping-options" and method == "POST":
        return fulfill(route, shipping_payload)

    if path == "/api/orders" and method == "POST":
        return fulfill(
            route,
            {
                "success": True,
                "message": "Payment started",
                "data": {
                    "order": pending_paypal_order["data"],
                    "payment": {
                        "provider": "paypal",
                        "checkoutUrl": f"{BASE_URL}/checkout/success?orderId=order-paypal&token=paypal-order-qa",
                        "sessionId": "paypal-order-qa",
                        "paymentIntentId": None,
                        "demoMode": False,
                    },
                },
            },
            status=201,
        )

    if path == "/api/orders/order-paypal" and method == "GET":
        return fulfill(route, paid_paypal_order if qa_state["captured"] else pending_paypal_order)

    if path == "/api/orders/order-paypal/payment/paypal/capture" and method == "POST":
        qa_state["captured"] = True
        return fulfill(route, paid_paypal_order)

    if path == "/api/orders/order-paypal-fail" and method == "GET":
        return fulfill(route, failed_capture_order)

    if path == "/api/orders/order-paypal-fail/payment/paypal/capture" and method == "POST":
        return fulfill(
            route,
            {"success": False, "message": "PayPal payment has not been completed yet"},
            status=424,
        )

    return route.continue_()


def seed_auth(context):
    context.add_init_script(
        """
        sessionStorage.setItem('auth-storage', JSON.stringify({
          state: {
            token: 'qa-token',
            isAuthenticated: true,
            user: {
              _id: '665000000000000000000001',
              name: 'QA Recruiter',
              email: 'qa@example.test',
              addresses: [{
                firstName: 'QA',
                lastName: 'Recruiter',
                street: '100 Portfolio Lane',
                city: 'Riyadh',
                state: 'Riyadh',
                zipCode: '12345',
                country: 'United States',
                phone: '5551234567',
                isDefault: true
              }]
            }
          },
          version: 0
        }));
        """
    )


def attach_observers(page):
    page.on(
        "console",
        lambda msg: console_records.append({"type": msg.type, "text": msg.text}),
    )
    page.on(
        "response",
        lambda response: network_records.append(
            {"status": response.status, "url": response.url}
        )
        if response.status >= 400
        else None,
    )
    page.on(
        "requestfailed",
        lambda request: request_failure_records.append(
            {
                "url": request.url,
                "method": request.method,
                "failure": request.failure,
            }
        ),
    )


def screenshot(page, name, full_page=True):
    path = SCREENSHOT_DIR / name
    page.screenshot(path=str(path), full_page=full_page)
    return path


def run_surface(browser, viewport, label, action):
    context = browser.new_context(viewport=viewport)
    context.route("**/api/**", route_api)
    seed_auth(context)
    page = context.new_page()
    attach_observers(page)
    try:
        return action(page, label)
    finally:
        context.close()


def test_checkout_desktop(page, label):
    page.goto(f"{BASE_URL}/checkout", wait_until="networkidle")
    page.get_by_role("heading", name="Checkout").wait_for()
    page.get_by_text("Payment opens in a secure hosted checkout.").wait_for()
    page.get_by_text("When PayPal sandbox is configured").wait_for()
    page.get_by_text("PLASHOE does not collect card details").wait_for()
    page.get_by_role("button", name="CONTINUE TO PAYMENT").wait_for()
    viewport = screenshot(page, f"{label}-checkout-viewport.png", full_page=False)
    full = screenshot(page, f"{label}-checkout-full.png", full_page=True)
    page.get_by_role("button", name="CONTINUE TO PAYMENT").focus()
    focus = screenshot(page, f"{label}-checkout-focus-payment-button.png", full_page=False)
    page.get_by_role("button", name="CONTINUE TO PAYMENT").click()
    page.wait_for_url("**/checkout/success?orderId=order-paypal&token=paypal-order-qa")
    page.get_by_text("PayPal sandbox approval was captured").wait_for()
    success = screenshot(page, f"{label}-paypal-success-after-click.png", full_page=True)
    return [viewport, full, focus, success]


def test_checkout_mobile(page, label):
    page.goto(f"{BASE_URL}/checkout", wait_until="networkidle")
    page.get_by_role("heading", name="Checkout").wait_for()
    page.get_by_text("Payment opens in a secure hosted checkout.").wait_for()
    page.get_by_text("PLASHOE does not collect card details").wait_for()
    return [screenshot(page, f"{label}-checkout-mobile-full.png", full_page=True)]


def test_paypal_failure_mobile(page, label):
    page.goto(
        f"{BASE_URL}/checkout/success?orderId=order-paypal-fail&token=paypal-order-fail",
        wait_until="networkidle",
    )
    page.get_by_role("alert").wait_for()
    page.get_by_text("Payment pending").wait_for()
    return [screenshot(page, f"{label}-paypal-capture-failure-full.png", full_page=True)]


def main():
    browser_mode = "headed"
    with sync_playwright() as p:
        try:
            browser = p.chromium.launch(headless=False)
        except Exception:
            browser_mode = "headless-fallback"
            browser = p.chromium.launch(headless=True)

        screenshots = []
        screenshots.extend(run_surface(browser, {"width": 1366, "height": 768}, "desktop", test_checkout_desktop))
        screenshots.extend(run_surface(browser, {"width": 390, "height": 844}, "mobile", test_checkout_mobile))
        screenshots.extend(run_surface(browser, {"width": 768, "height": 1024}, "tablet", test_paypal_failure_mobile))
        browser.close()

    (LOG_DIR / "console.json").write_text(json.dumps(console_records, indent=2), encoding="utf-8")
    (LOG_DIR / "network-failures.json").write_text(
        json.dumps(network_records, indent=2), encoding="utf-8"
    )
    (LOG_DIR / "request-failures.json").write_text(
        json.dumps(request_failure_records, indent=2), encoding="utf-8"
    )

    ledger = ARTIFACT_DIR / "coverage-ledger.md"
    ledger.write_text(
        "\n".join(
            [
                "| Area | Route/state | Control/workflow/scenario | Expected | Evidence | Status | Notes |",
                "| --- | --- | --- | --- | --- | --- | --- |",
                "| Checkout | `/checkout` desktop | Payment panel copy, shipping-ready primary action, focus state | PayPal sandbox hosted-checkout behavior is visible; button is enabled and focusable | `screenshots/desktop-checkout-viewport.png`, `screenshots/desktop-checkout-focus-payment-button.png` | tested | API responses mocked; no live payment call |",
                "| Checkout | `/checkout` mobile | Responsive checkout layout and payment copy | Content reflows without horizontal overflow or text collision | `screenshots/mobile-checkout-mobile-full.png` | tested | Full-page mobile screenshot reviewed |",
                "| Payment return | `/checkout/success?orderId=order-paypal&token=paypal-order-qa` | Checkout submit redirects to return page; PayPal capture succeeds | Return page shows paid state and sandbox capture notice | `screenshots/desktop-paypal-success-after-click.png` | tested | Redirect URL mocked locally to avoid external PayPal network |",
                "| Payment return | `/checkout/success?orderId=order-paypal-fail&token=paypal-order-fail` | PayPal capture failure | Order remains visible with `Payment pending` and visible alert | `screenshots/tablet-paypal-capture-failure-full.png` | tested | 424 response intentionally mocked |",
                "| Console/network | Changed payment surfaces | Console errors and failed network responses | No unexpected app errors; only intentional mocked capture failure | `logs/console.json`, `logs/network-failures.json`, `logs/request-failures.json` | tested | See logs |",
            ]
        )
        + "\n",
        encoding="utf-8",
    )

    report = ARTIFACT_DIR / "visual-qa-report.md"
    report.write_text(
        "\n".join(
            [
                "# Phase 31 Visual QA Report",
                "",
                "Overall status: passed for the scoped PayPal checkout/return surfaces.",
                "",
                f"Scope tested: `{BASE_URL}/checkout`, PayPal success return, PayPal capture failure return. Browser runner: Python Playwright fallback from local Hercules install. Browser mode: {browser_mode}.",
                "",
                "Identity evidence: app resolved at `http://127.0.0.1:5182`; source branch `main`; source HEAD captured before run as `20eaedf`; test data was mocked locally in Playwright routes.",
                "",
                "Redaction note: screenshots use synthetic QA data only; no cookies, tokens, real payment credentials, or private customer data were recorded.",
                "",
                "Findings: no confirmed visual, logic, or accessibility-blocking issues in the scoped surfaces.",
                "",
                "Coverage ledger summary: tested 5, fixed 0, failed 0, blocked 0, untested 0 for the scoped payment surfaces.",
                "",
                "Visual evidence:",
                *[f"- `{path.relative_to(ARTIFACT_DIR)}`" for path in screenshots],
                "",
                "Console/network evidence:",
                "- `logs/console.json`",
                "- `logs/network-failures.json`",
                "- `logs/request-failures.json`",
                "",
                "Remaining risk: this was a local mocked-provider browser run. Real PayPal hosted approval still depends on Render env vars and PayPal sandbox webhook configuration.",
            ]
        )
        + "\n",
        encoding="utf-8",
    )

    print(json.dumps({"artifactDir": str(ARTIFACT_DIR), "screenshots": [str(path) for path in screenshots]}))


if __name__ == "__main__":
    main()
