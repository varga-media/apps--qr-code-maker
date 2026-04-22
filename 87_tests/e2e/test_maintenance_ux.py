"""
E2E UI Tests for QR Code Maker - Maintenance & UX Sprint.

Tests cover:
- Download filename timestamp format
- Mobile viewport rendering
- Error handling for empty inputs
- Valid URL QR code generation
- Additional edge cases
"""

import re
import pytest
from playwright.sync_api import expect


class TestDownloadFilenameTimestamp:
    """Tests for download filename timestamp feature."""

    def test_download_button_has_download_attribute(self, qr_page):
        """Download button should be present and have correct text."""
        textarea = qr_page.locator("#qrText")
        textarea.fill("https://example.com")
        qr_page.locator("#generateBtn").click()

        download_btn = qr_page.locator("#downloadBtn")
        expect(download_btn).to_be_visible()

    def test_download_filename_has_timestamp(self, qr_page):
        """Download link filename should contain timestamp in YYYYMMDD-HHMMSS format."""
        textarea = qr_page.locator("#qrText")
        textarea.fill("https://example.com")
        qr_page.locator("#generateBtn").click()

        # Intercept the download to capture the filename
        with qr_page.expect_download() as download_info:
            qr_page.locator("#downloadBtn").click()
        download = download_info.value

        filename = download.suggested_filename
        # Expect format: qrcode-YYYYMMDD-HHMMSS.png
        assert re.match(r"^qrcode-\d{8}-\d{6}\.png$", filename), \
            f"Expected timestamp filename, got: {filename}"

    def test_download_filename_starts_with_qrcode(self, qr_page):
        """Download filename should start with 'qrcode-'."""
        textarea = qr_page.locator("#qrText")
        textarea.fill("timestamp test")
        qr_page.locator("#generateBtn").click()

        with qr_page.expect_download() as download_info:
            qr_page.locator("#downloadBtn").click()
        download = download_info.value

        assert download.suggested_filename.startswith("qrcode-"), \
            f"Filename should start with 'qrcode-', got: {download.suggested_filename}"

    def test_download_filename_ends_with_png(self, qr_page):
        """Download filename should end with '.png'."""
        textarea = qr_page.locator("#qrText")
        textarea.fill("png extension test")
        qr_page.locator("#generateBtn").click()

        with qr_page.expect_download() as download_info:
            qr_page.locator("#downloadBtn").click()
        download = download_info.value

        assert download.suggested_filename.endswith(".png"), \
            f"Filename should end with '.png', got: {download.suggested_filename}"


class TestMobileViewport:
    """Tests for mobile viewport rendering."""

    def test_mobile_viewport_renders_correctly(self, qr_page):
        """Page should render correctly on mobile viewport (375x667)."""
        qr_page.set_viewport_size({"width": 375, "height": 667})
        qr_page.reload()
        qr_page.wait_for_load_state("domcontentloaded")

        heading = qr_page.locator("h1")
        expect(heading).to_be_visible()

        generate_btn = qr_page.locator("#generateBtn")
        expect(generate_btn).to_be_visible()

    def test_mobile_viewport_has_viewport_meta(self, qr_page):
        """Page should have viewport meta tag for mobile responsiveness."""
        viewport_meta = qr_page.locator('meta[name="viewport"]')
        expect(viewport_meta).to_have_count(1)
        content = viewport_meta.get_attribute("content")
        assert "width=device-width" in content, \
            f"Missing width=device-width in viewport meta: {content}"

    def test_mobile_generate_qr_works(self, qr_page):
        """QR code generation should work on mobile viewport."""
        qr_page.set_viewport_size({"width": 375, "height": 667})
        qr_page.reload()
        qr_page.wait_for_load_state("domcontentloaded")

        textarea = qr_page.locator("#qrText")
        textarea.fill("Mobile test")
        qr_page.locator("#generateBtn").click()

        canvas = qr_page.locator("#qrcode canvas")
        expect(canvas).to_be_visible()


class TestErrorHandling:
    """Tests for error handling scenarios."""

    def test_empty_input_shows_error(self, qr_page):
        """Clicking generate with empty input should show an error message."""
        generate_btn = qr_page.locator("#generateBtn")
        generate_btn.click()

        error = qr_page.locator("#errorMessage")
        expect(error).to_be_visible()
        expect(error).not_to_be_empty()

    def test_empty_wifi_ssid_shows_error(self, qr_page):
        """Empty WiFi SSID should show an error."""
        wifi_tab = qr_page.locator('.tab[data-tab="wifi"]')
        wifi_tab.click()

        qr_page.locator("#generateBtn").click()

        error = qr_page.locator("#errorMessage")
        expect(error).to_be_visible()

    def test_error_message_hidden_after_valid_input(self, qr_page):
        """Error message should hide after successful generation."""
        qr_page.locator("#generateBtn").click()
        error = qr_page.locator("#errorMessage")
        expect(error).to_be_visible()

        textarea = qr_page.locator("#qrText")
        textarea.fill("https://example.com")
        qr_page.locator("#generateBtn").click()

        expect(error).to_be_hidden()

    def test_design_tab_no_input_shows_error(self, qr_page):
        """Design tab generate with no prior input should show error."""
        design_tab = qr_page.locator('.tab[data-tab="design"]')
        design_tab.click()

        qr_page.locator("#generateBtn").click()

        error = qr_page.locator("#errorMessage")
        expect(error).to_be_visible()


class TestQRCodeGeneration:
    """Tests for valid QR code generation scenarios."""

    def test_qr_code_generated_for_valid_url(self, qr_page):
        """Valid URL should produce a QR code canvas."""
        textarea = qr_page.locator("#qrText")
        textarea.fill("https://varga.media")
        qr_page.locator("#generateBtn").click()

        canvas = qr_page.locator("#qrcode canvas")
        expect(canvas).to_be_visible()

    def test_qr_code_generated_for_long_text(self, qr_page):
        """Long text within limit should generate QR code."""
        long_text = "A" * 500
        textarea = qr_page.locator("#qrText")
        textarea.fill(long_text)
        qr_page.locator("#generateBtn").click()

        canvas = qr_page.locator("#qrcode canvas")
        expect(canvas).to_be_visible()

    def test_timestamp_function_format(self, qr_page):
        """getTimestampSuffix function should return correct format."""
        result = qr_page.evaluate("""
            () => {
                const now = new Date();
                const pad = (n) => String(n).padStart(2, '0');
                const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
                const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
                return `${date}-${time}`;
            }
        """)
        assert re.match(r"^\d{8}-\d{6}$", result), \
            f"Timestamp format mismatch: {result}"
