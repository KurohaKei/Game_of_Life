console.log("script started");

function make2DArray (cols, rows) {
    let arr = new Array(cols);
    for (let i = 0; i < arr.length; i++) {
        arr[i] = new Array(rows);
    }
    return arr;
}

let grid;
let rows;
let cols;

function setup () {
    resolution = 10;
    cols = 200;
    rows = 200;
    createCanvas(cols * resolution, rows * resolution);

    grid = make2DArray(cols, rows);
    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            grid[i][j] = floor(random() * 2);
        }

    }
    fitToScreen();
}

function fitToScreen() {
    let canvasW = cols * resolution;
    let canvasH = rows * resolution;

    let scaleX = windowWidth / canvasW;
    let scaleY = windowHeight / canvasH;

    zoom = min(scaleX, scaleY) * 0.9;
    zoom = constrain(zoom, 0.1, 5);

    offsetX = (windowWidth - canvasW * zoom) / 2;
    offsetY = (windowHeight - canvasH * zoom) / 2;
}

function windowResized() {
    setTimeout(fitToScreen, 50);
}

let offsetX = 0;
let offsetY = 0;
let zoom = 1;
let dragging = false;
let lastX, lastY;
let pinchStartDist = 0;
let pinchStartZoom = 1;

function draw () {
    background('#0e1116');

    push();
    translate(offsetX, offsetY);
    scale(zoom);

    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            let x = i * resolution;
            let y = j * resolution;
            if (grid[i][j] == 1) {
                fill('#6ee7b7');
                stroke(0);
                rect(x, y, resolution - 1, resolution - 1);
            }
        }
    }
    pop();
    
    let next = make2DArray(cols, rows);
        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
            
            let sum = 0;
            let neighbors = countNeighbors(grid, i, j);

            let state = grid[i][j];
            if (state == 0 && neighbors == 3) {
                next[i][j] = 1;
            } else if (state == 1 && (neighbors < 2 || neighbors > 3)) {
                next[i][j] = 0;
            } else {
                next[i][j] = state;

            }
        }
    }    
    grid = next; 
}

// For desktop: zoom with mouse wheel, pan with mouse drag
function mouseWheel(event) {
    let prevZoom = zoom;
    zoom -= event.delta * 0.001;
    zoom = constrain(zoom, 0.1, 5);

    offsetX = mouseX - (mouseX - offsetX) * (zoom / prevZoom);
    offsetY = mouseY - (mouseY - offsetY) * (zoom / prevZoom);

    return false;
}

function mousePressed() {
    dragging = true;
    lastX = mouseX;
    lastY = mouseY;
}

function mouseDragged() {
    if (dragging) {
        offsetX += (mouseX - lastX);
        offsetY += (mouseY - lastY);
        lastX = mouseX;
        lastY = mouseY;
    }
}

function mouseReleased() {
    dragging = false;
}

function touchStarted() {
    if (touches.length === 2) {
        pinchStartDist = dist(touches[0].x, touches[0].y, touches[1].x, touches[1].y);
        pinchStartZoom = zoom;
    } else {
        dragging = true;
        lastX = mouseX;
        lastY = mouseY;
    }
    return false;
}

function touchMoved() {
    if (touches.length === 2) {
        let d = dist(touches[0].x, touches[0].y, touches[1].x, touches[1].y);
        zoom = constrain(pinchStartZoom * (d / pinchStartDist), 0.1, 5);
    } else if (dragging) {
        offsetX += (mouseX - lastX);
        offsetY += (mouseY - lastY);
        lastX = mouseX;
        lastY = mouseY;
    }
    return false;
}

function touchEnded() {
    dragging = false;
    return false;
}

function countNeighbors (grid, x, y) {
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

