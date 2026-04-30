// DOM Elements
const qrText = document.getElementById('qrText');
const generateBtn = document.getElementById('generateBtn');
const downloadBtn = document.getElementById('downloadBtn');
const qrcodeDiv = document.getElementById('qrcode');
const wifiSsid = document.getElementById('wifiSsid');
const wifiPassword = document.getElementById('wifiPassword');
const wifiSecurity = document.getElementById('wifiSecurity');
const eccLevel = document.getElementById('eccLevel');
const pixelSize = document.getElementById('pixelSize');
const errorMessage = document.getElementById('errorMessage');

// Design Controls
const fgColor = document.getElementById('fgColor');
const bgColor = document.getElementById('bgColor');
const useGradient = document.getElementById('useGradient');
const gradientColor = document.getElementById('gradientColor');
const logoInput = document.getElementById('logoInput');
const logoSize = document.getElementById('logoSize');
const logoSizeVal = document.getElementById('logoSizeVal');
const logoName = document.getElementById('logoName');

// Constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGE_DIMENSION = 4096; // px
const MAX_QR_TEXT_LENGTH = 4296;
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

let currentTab = 'text';
let uploadedLogo = null;

// --- Error Display ---

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.hidden = false;
    errorMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function clearError() {
    errorMessage.textContent = '';
    errorMessage.hidden = true;
}

// --- Input Sanitization ---

function sanitizeInput(text) {
    if (text.length > MAX_QR_TEXT_LENGTH) {
        return text.substring(0, MAX_QR_TEXT_LENGTH);
    }
    return text;
}

function escapeWifiField(value) {
    return value
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/:/g, '\\:')
        .replace(/"/g, '\\"');
}

// --- File Upload Validation ---

function validateImageFile(file) {
    if (!file) {
        return { valid: false, error: 'Keine Datei ausgewaehlt.' };
    }
    if (file.size > MAX_FILE_SIZE) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        return { valid: false, error: `Datei zu gross (${sizeMB}MB). Maximum: 5MB.` };
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return { valid: false, error: `Ungueltiger Dateityp: ${file.type}. Erlaubt: PNG, JPG, GIF, WebP.` };
    }
    return { valid: true, error: null };
}

function validateImageDimensions(img) {
    if (img.width > MAX_IMAGE_DIMENSION || img.height > MAX_IMAGE_DIMENSION) {
        return {
            valid: false,
            error: `Bild zu gross (${img.width}x${img.height}px). Maximum: ${MAX_IMAGE_DIMENSION}x${MAX_IMAGE_DIMENSION}px.`
        };
    }
    return { valid: true, error: null };
}

// --- Tab Switching with Keyboard Navigation ---

function initTabs() {
    const tabs = document.querySelectorAll('.tab');
    const tabList = document.querySelector('[role="tablist"]');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => activateTab(tab));
    });

    if (tabList) {
        tabList.addEventListener('keydown', (e) => {
            const tabsArray = Array.from(tabs);
            const currentIndex = tabsArray.findIndex(t => t.getAttribute('aria-selected') === 'true');

            let newIndex = -1;
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                newIndex = (currentIndex + 1) % tabsArray.length;
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                newIndex = (currentIndex - 1 + tabsArray.length) % tabsArray.length;
            } else if (e.key === 'Home') {
                e.preventDefault();
                newIndex = 0;
            } else if (e.key === 'End') {
                e.preventDefault();
                newIndex = tabsArray.length - 1;
            }

            if (newIndex >= 0) {
                activateTab(tabsArray[newIndex]);
                tabsArray[newIndex].focus();
            }
        });
    }
}

function activateTab(tab) {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
        t.setAttribute('tabindex', '-1');
    });
    tabContents.forEach(c => c.classList.remove('active'));

    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    tab.setAttribute('tabindex', '0');
    currentTab = tab.dataset.tab;
    document.getElementById(`${currentTab}Tab`).classList.add('active');
    clearError();
}

// --- QR Code Input Extraction ---

function getTextInput() {
    const text = sanitizeInput(qrText.value.trim());
    if (!text) {
        showError('Bitte gib einen Text oder URL ein!');
        return null;
    }
    return text;
}

function getWifiInput() {
    const ssid = wifiSsid.value.trim();
    const password = wifiPassword.value;
    const security = wifiSecurity.value;

    if (!ssid) {
        showError('Bitte gib einen Netzwerknamen (SSID) ein!');
        return null;
    }

    const escapedSsid = escapeWifiField(ssid);
    const escapedPassword = escapeWifiField(password);
    return `WIFI:T:${security};S:${escapedSsid};P:${escapedPassword};H:false;;`;
}

function getDesignTabInput() {
    const text = qrText.value.trim();
    if (text) {
        return sanitizeInput(text);
    }
    if (wifiSsid.value.trim()) {
        return getWifiInput();
    }
    showError('Bitte gib zuerst Text oder WLAN-Daten ein!');
    return null;
}

function getInputText() {
    if (currentTab === 'text') return getTextInput();
    if (currentTab === 'wifi') return getWifiInput();
    if (currentTab === 'design') return getDesignTabInput();
    return null;
}

// --- QR Code Rendering ---

function createQRMatrix(text, ecc) {
    const qr = qrcode(0, ecc);
    qr.addData(text);
    qr.make();
    return qr;
}

function renderToCanvas(qr, outputSize) {
    const moduleCount = qr.getModuleCount();
    const cellSize = Math.floor(outputSize / moduleCount);
    const margin = 4 * cellSize;
    const actualSize = (cellSize * moduleCount) + (2 * margin);

    const canvas = document.createElement('canvas');
    canvas.width = actualSize;
    canvas.height = actualSize;
    canvas.setAttribute('aria-label', 'Generierter QR-Code');
    canvas.setAttribute('role', 'img');
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = bgColor.value;
    ctx.fillRect(0, 0, actualSize, actualSize);

    if (useGradient.checked) {
        const gradient = ctx.createLinearGradient(0, 0, actualSize, actualSize);
        gradient.addColorStop(0, fgColor.value);
        gradient.addColorStop(1, gradientColor.value);
        ctx.fillStyle = gradient;
    } else {
        ctx.fillStyle = fgColor.value;
    }

    for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
            if (qr.isDark(row, col)) {
                ctx.fillRect(
                    col * cellSize + margin,
                    row * cellSize + margin,
                    cellSize,
                    cellSize
                );
            }
        }
    }

    return { canvas, ctx, actualSize };
}

function drawLogo(ctx, actualSize) {
    if (!uploadedLogo) return;

    const logoW = actualSize * (parseInt(logoSize.value) / 100);
    const logoH = (uploadedLogo.height / uploadedLogo.width) * logoW;
    const logoX = (actualSize - logoW) / 2;
    const logoY = (actualSize - logoH) / 2;

    const padding = 6;
    ctx.fillStyle = bgColor.value;
    ctx.fillRect(logoX - padding, logoY - padding, logoW + (padding * 2), logoH + (padding * 2));
    ctx.drawImage(uploadedLogo, logoX, logoY, logoW, logoH);
}

// --- Main Generate Function ---

function generateQRCode() {
    clearError();
    const text = getInputText();
    if (!text) return;

    try {
        qrcodeDiv.innerHTML = '';
        const ecc = eccLevel.value;
        const outputSize = parseInt(pixelSize.value);

        const qr = createQRMatrix(text, ecc);
        const { canvas, ctx, actualSize } = renderToCanvas(qr, outputSize);
        drawLogo(ctx, actualSize);

        qrcodeDiv.appendChild(canvas);
        downloadBtn.style.display = 'block';
    } catch (err) {
        showError('Fehler beim Generieren des QR-Codes. Bitte versuche es mit kuerzerem Text.');
    }
}

// --- Event Listeners ---

initTabs();
generateBtn.addEventListener('click', generateQRCode);

qrText.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        generateQRCode();
    }
});

// Logo Upload with Validation
logoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) {
        uploadedLogo = null;
        logoName.textContent = 'Kein Logo ausgewaehlt';
        return;
    }

    const validation = validateImageFile(file);
    if (!validation.valid) {
        showError(validation.error);
        logoInput.value = '';
        uploadedLogo = null;
        logoName.textContent = 'Kein Logo ausgewaehlt';
        return;
    }

    try {
        const reader = new FileReader();
        reader.onerror = () => {
            showError('Fehler beim Lesen der Datei.');
            uploadedLogo = null;
            logoName.textContent = 'Kein Logo ausgewaehlt';
        };
        reader.onload = (event) => {
            const img = new Image();
            img.onerror = () => {
                showError('Fehler beim Laden des Bildes. Datei ist moeglicherweise beschaedigt.');
                uploadedLogo = null;
                logoName.textContent = 'Kein Logo ausgewaehlt';
            };
            img.onload = () => {
                const dimValidation = validateImageDimensions(img);
                if (!dimValidation.valid) {
                    showError(dimValidation.error);
                    logoInput.value = '';
                    uploadedLogo = null;
                    logoName.textContent = 'Kein Logo ausgewaehlt';
                    return;
                }
                clearError();
                uploadedLogo = img;
                logoName.textContent = file.name;
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    } catch (err) {
        showError('Unerwarteter Fehler beim Datei-Upload.');
        uploadedLogo = null;
        logoName.textContent = 'Kein Logo ausgewaehlt';
    }
});

logoSize.addEventListener('input', (e) => {
    logoSizeVal.textContent = `${e.target.value}%`;
});

useGradient.addEventListener('change', () => {
    gradientColor.disabled = !useGradient.checked;
});

// Generate timestamp string for download filenames: YYYYMMDD-HHMMSS
function getTimestampSuffix() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
    const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    return `${date}-${time}`;
}

// Download with Error Handling
downloadBtn.addEventListener('click', () => {
    try {
        const canvas = qrcodeDiv.querySelector('canvas');
        if (canvas) {
            const url = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `qrcode-${getTimestampSuffix()}.png`;
            link.href = url;
            link.click();
        }
    } catch (err) {
        showError('Fehler beim Download. Bitte versuche es erneut.');
    }
});
