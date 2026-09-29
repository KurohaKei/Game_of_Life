console.log("script started");

function make2DArray (cols, rows) {
    let arr = new Array(cols);
    for (let i = 0; i < arr.length; i++) {
        arr[i] = new Array(rows);
    }
    return arr;
}

let grid;
let rows, cols, resolution = 10;

let cellColor = '#6ee7b7';
let bgColor = '#000000';
let speed = 10;
let startMode = 'random';
let started = false;
let isRunning = false;

let offsetX = 0, offsetY = 0, zoom = 1;
let dragging = false;
let lastX, lastY, mouseDownX, mouseDownY, hasDragged = false;
let pinchStartDist = 0, pinchStartZoom = 1, pinchWorldX = 0, pinchWorldY = 0;

// ---------- Saved settings (localStorage) ----------
const STORE_KEY = 'gol.settings';
const MIN_GRID = 1;
const MAX_GRID = 300;
const DEFAULT_GRID = 100;
const GRID_WARNING = 'Input more than 300 can make the game lag, Input converted to 300';
const GRID_MIN_WARNING = 'Input less than 1 is not allowed, Input converted to 1';
const GRID_INVALID_WARNING = 'Invalid input. Please enter a number from 1 to 300.';

function loadSettings() {
    try {
        const s = JSON.parse(localStorage.getItem(STORE_KEY));
        return (s && typeof s === 'object') ? s : {};
    } catch (e) {
        return {};
    }
}

function saveSettings(data) {
    try {
        localStorage.setItem(STORE_KEY, JSON.stringify(data));
    } catch (e) {
        // storage full or blocked (private mode): the game still works, just doesn't remember
    }
}

let toastTimer = null;
function showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 4000);
    t.onclick = () => { clearTimeout(toastTimer); t.classList.remove('show'); };
}

function setup () {
    console.log("setup() called");
    createCanvas(windowWidth, windowHeight);
    cols = DEFAULT_GRID;
    rows = DEFAULT_GRID;
    frameRate(speed);
    setupMenuUI();
    if (window.hideLoader) hideLoader();   // menu buttons work now, so drop the loading screen
}

function initGame(mode, size, spd, cColor, bColor) {
    cols = size;
    rows = size;
    cellColor = cColor;
    bgColor = bColor;
    speed = spd;
    frameRate(speed);

    grid = make2DArray(cols, rows);
    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            grid[i][j] = mode === 'random' ? floor(random() * 2) : 0;
        }
    }
    fitToScreen();
    isRunning = false;
    started = true;
}

function fitToScreen() {
    let canvasW = cols * resolution;
    let canvasH = rows * resolution;
    let scaleX = windowWidth / canvasW;
    let scaleY = windowHeight / canvasH;
    zoom = constrain(min(scaleX, scaleY) * 0.9, 0.1, 5);
    offsetX = (windowWidth - canvasW * zoom) / 2;
    offsetY = (windowHeight - canvasH * zoom) / 2;
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    if (started) setTimeout(fitToScreen, 50);
}

function draw() {
    background(bgColor);
    if (!started) return;

    push();
    translate(offsetX, offsetY);
    scale(zoom);

    if (!isRunning) {
        stroke(255, 255, 255, 25);   // faint white, low alpha
        noFill();
        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                rect(i * resolution, j * resolution, resolution - 1, resolution - 1);
            }
        }
    }

    fill(cellColor);
    stroke(0);
    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            if (grid[i][j] == 1) {
                rect(i * resolution, j * resolution, resolution - 1, resolution - 1);
            }
        }
    }
    pop();

    if (isRunning) {
        let next = make2DArray(cols, rows);
        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                let neighbors = countNeighbors(grid, i, j);
                let state = grid[i][j];
                if (state == 0 && neighbors == 3) next[i][j] = 1;
                else if (state == 1 && (neighbors < 2 || neighbors > 3)) next[i][j] = 0;
                else next[i][j] = state;
            }
        }
        grid = next;
    }
}

function countNeighbors(grid, x, y) {
    let sum = 0;
    for (let i = -1; i < 2; i++) {
        for (let j = -1; j < 2; j++) {
            let col = (x + i + cols) % cols;
            let row = (y + j + rows) % rows;
            sum += grid[col][row];
        }
    }
    sum -= grid[x][y];
    return sum;
}

function toggleCellAt(mx, my) {
    let gx = (mx - offsetX) / zoom;
    let gy = (my - offsetY) / zoom;
    let col = floor(gx / resolution);
    let row = floor(gy / resolution);
    if (col >= 0 && col < cols && row >= 0 && row < rows) {
        grid[col][row] = grid[col][row] ? 0 : 1;
    }
}

function isUIElement(x, y) {
    const el = document.elementFromPoint(x, y);
    return !!(el && (el.closest('#hud') || el.closest('.menu-overlay') || el.closest('#toast')));
}

// ---------- Mouse (desktop) ----------
function mouseWheel(event) {
    if (!started || isUIElement(mouseX, mouseY)) return;
    let prevZoom = zoom;
    zoom = constrain(zoom - event.delta * 0.001, 0.1, 5);
    offsetX = mouseX - (mouseX - offsetX) * (zoom / prevZoom);
    offsetY = mouseY - (mouseY - offsetY) * (zoom / prevZoom);
    return false;
}

function mousePressed() {
    if (isUIElement(mouseX, mouseY)) return;
    dragging = true;
    lastX = mouseX; lastY = mouseY;
    mouseDownX = mouseX; mouseDownY = mouseY;
    hasDragged = false;
}

function mouseDragged() {
    if (!dragging) return;
    if (dist(mouseX, mouseY, mouseDownX, mouseDownY) > 4) hasDragged = true;
    offsetX += (mouseX - lastX);
    offsetY += (mouseY - lastY);
    lastX = mouseX; lastY = mouseY;
}

function mouseReleased() {
    if (dragging && !hasDragged && started && !isRunning) {
        toggleCellAt(mouseX, mouseY);
    }
    dragging = false;
}

// ---------- Touch (mobile) ----------
function touchStarted() {
    if (touches.length > 0 && isUIElement(touches[0].x, touches[0].y)) return true; // let UI handle it
    if (touches.length === 2) {
        const mx = (touches[0].x + touches[1].x) / 2;
        const my = (touches[0].y + touches[1].y) / 2;
        pinchStartDist = dist(touches[0].x, touches[0].y, touches[1].x, touches[1].y);
        pinchStartZoom = zoom;
        // remember which grid point sits under the fingers
        pinchWorldX = (mx - offsetX) / zoom;
        pinchWorldY = (my - offsetY) / zoom;
        dragging = false; // a pinch is not a drag or a tap
    } else {
        dragging = true;
        lastX = mouseX; lastY = mouseY;
        mouseDownX = mouseX; mouseDownY = mouseY;
        hasDragged = false;
    }
    return false;
}

function touchMoved() {
    if (touches.length > 0 && isUIElement(touches[0].x, touches[0].y)) return true;
    if (touches.length === 2 && pinchStartDist > 0) {
        const mx = (touches[0].x + touches[1].x) / 2;
        const my = (touches[0].y + touches[1].y) / 2;
        const d = dist(touches[0].x, touches[0].y, touches[1].x, touches[1].y);
        zoom = constrain(pinchStartZoom * (d / pinchStartDist), 0.1, 5);
        // keep the same grid point under the fingers' midpoint
        offsetX = mx - pinchWorldX * zoom;
        offsetY = my - pinchWorldY * zoom;
    } else if (dragging) {
        if (dist(mouseX, mouseY, mouseDownX, mouseDownY) > 4) hasDragged = true;
        offsetX += (mouseX - lastX);
        offsetY += (mouseY - lastY);
        lastX = mouseX; lastY = mouseY;
    }
    return false;
}

function touchEnded() {
    if (dragging && !hasDragged && started && !isRunning) {
        toggleCellAt(mouseX, mouseY);
    }
    dragging = false;
    return true; // allow UI taps (buttons/inputs) to register normally
}

// ---------- Menu / HUD wiring ----------
function setupMenuUI() {
    const modeRandom = document.getElementById('modeRandom');
    const modeBlank = document.getElementById('modeBlank');
    const gridSize = document.getElementById('gridSize');
    const speedSlider = document.getElementById('speedSlider');
    const speedVal = document.getElementById('speedVal');
    const cellColorInput = document.getElementById('cellColor');
    const bgColorInput = document.getElementById('bgColorInput');
    const playBtn = document.getElementById('playBtn');
    const hud = document.getElementById('hud');
    const menuBtn = document.getElementById('menuBtn');
    const toggleRun = document.getElementById('toggleRun');

    const mainMenu = document.getElementById('mainMenu');
    const newGameMenu = document.getElementById('newGameMenu');
    const settingsMenu = document.getElementById('settingsMenu');
    const newGameBtn = document.getElementById('newGameBtn');
    const resumeBtn = document.getElementById('resumeBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const backFromNewGame = document.getElementById('backFromNewGame');
    const backFromSettings = document.getElementById('backFromSettings');

    // --- Restore saved settings ---
    const saved = loadSettings();
    const isHex = (v) => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);

    let lastGoodGrid = DEFAULT_GRID;
    if (Number.isInteger(saved.gridSize) && saved.gridSize >= MIN_GRID && saved.gridSize <= MAX_GRID) {
        lastGoodGrid = saved.gridSize;
    }
    gridSize.value = lastGoodGrid;

    if (Number.isInteger(saved.speed) && saved.speed >= 1 && saved.speed <= 60) {
        speed = saved.speed;
    }
    speedSlider.value = speed;
    speedVal.textContent = speed;
    frameRate(speed);

    if (isHex(saved.cellColor)) cellColor = saved.cellColor;
    if (isHex(saved.bgColor)) bgColor = saved.bgColor;
    cellColorInput.value = cellColor;
    bgColorInput.value = bgColor;

    function persist() {
        saveSettings({
            gridSize: lastGoodGrid,
            speed: speed,
            cellColor: cellColor,
            bgColor: bgColor
        });
    }

    // Turns whatever is typed into a valid whole number from 1 to 300.
    // Empty / invalid input goes back to the last good value. Over 300 is capped with a warning.
    function readGridSize() {
        let n = parseInt(gridSize.value, 10);
        if (isNaN(n)) {
            // empty, or non-numeric text (a number input reports it as an empty value)
            n = lastGoodGrid;
            showToast(GRID_INVALID_WARNING);
        } else if (n < MIN_GRID) {
            n = MIN_GRID;
            showToast(GRID_MIN_WARNING);
        } else if (n > MAX_GRID) {
            n = MAX_GRID;
            showToast(GRID_WARNING);
        }
        gridSize.value = n;
        lastGoodGrid = n;
        persist();
        return n;
    }

    gridSize.addEventListener('blur', readGridSize);

    function showScreen(screen) {
        mainMenu.style.display = 'none';
        newGameMenu.style.display = 'none';
        settingsMenu.style.display = 'none';
        hud.style.display = 'none';
        screen.style.display = 'flex';
    }

    function showMainMenu() {
        resumeBtn.style.display = started ? 'block' : 'none';
        showScreen(mainMenu);
    }

    // --- Main menu navigation ---
    newGameBtn.addEventListener('click', () => showScreen(newGameMenu));
    settingsBtn.addEventListener('click', () => showScreen(settingsMenu));
    resumeBtn.addEventListener('click', () => {
        mainMenu.style.display = 'none';
        newGameMenu.style.display = 'none';
        settingsMenu.style.display = 'none';
        hud.style.display = 'flex';
    });

    backFromNewGame.addEventListener('click', showMainMenu);
    backFromSettings.addEventListener('click', showMainMenu);

    // --- New Game screen ---
    modeRandom.addEventListener('click', () => {
        startMode = 'random';
        modeRandom.classList.add('active');
        modeBlank.classList.remove('active');
    });
    modeBlank.addEventListener('click', () => {
        startMode = 'blank';
        modeBlank.classList.add('active');
        modeRandom.classList.remove('active');
    });

    playBtn.addEventListener('click', () => {
        const size = readGridSize();
        initGame(
            startMode,
            size,
            parseInt(speedSlider.value, 10),
            cellColorInput.value,
            bgColorInput.value
        );
        mainMenu.style.display = 'none';
        newGameMenu.style.display = 'none';
        settingsMenu.style.display = 'none';
        hud.style.display = 'flex';
        toggleRun.textContent = '▶ Play';
    });

    // --- Settings screen ---
    speedSlider.addEventListener('input', () => {
        speedVal.textContent = speedSlider.value;
        speed = parseInt(speedSlider.value, 10);
        frameRate(speed);
    });
    speedSlider.addEventListener('change', persist);   // save once the slider is released

    cellColorInput.addEventListener('input', () => {
        cellColor = cellColorInput.value;
    });
    cellColorInput.addEventListener('change', persist);

    bgColorInput.addEventListener('input', () => {
        bgColor = bgColorInput.value;
    });
    bgColorInput.addEventListener('change', persist);

    // --- HUD ---
    menuBtn.addEventListener('click', () => {
        isRunning = false;
        toggleRun.textContent = '▶ Play';
        showMainMenu();
    });

    toggleRun.addEventListener('click', () => {
        isRunning = !isRunning;
        toggleRun.textContent = isRunning ? '⏸ Pause' : '▶ Play';
    });
}

// ---------- Install / update button (settings page) ----------
// The button is always visible. It never hides itself, even after installing.
(function () {
    const installBtn = document.getElementById('installBtn');
    const installHint = document.getElementById('installHint');
    if (!installBtn) return;

    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true;

    let deferredPrompt = null;

    function say(msg) {
        installHint.textContent = msg;
        installHint.style.display = 'block';
    }

    // Android / Chrome / Edge: only fires while the app is not installed yet
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
    });

    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        say('Installed.');
    });

    // Wipe the offline copy and reload so the newest files are fetched
    async function updateApp() {
        if (!navigator.onLine) { say("You're offline. Connect to the internet to update."); return; }
        say('Checking for updates…');
        try {
            const reg = await navigator.serviceWorker.getRegistration();
            if (!reg) { location.reload(); return; }

            await reg.update();                       // re-fetches sw.js from the network

            const waiting = reg.waiting || reg.installing;
            if (waiting) {
                say('Installing update…');
                navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), { once: true });
                waiting.postMessage({ type: 'SKIP_WAITING' });
            } else {
                say("You're on the latest version.");
            }
        } catch (err) {
            console.error('Update failed:', err);
            say('Update failed. Try again.');
        }
    }

    installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            await deferredPrompt.userChoice;
            deferredPrompt = null;
        } else if (isIOS && !isStandalone) {
            say('On iPhone: tap the Share button, then "Add to Home Screen".');
        } else {
            updateApp();
        }
    });
})();