console.log("script started");

function make2DArray (rows, cols) {
    let arr = new Array(rows);
    for (let i = 0; i < arr.length; i++) {
        arr[i] = new Array(cols);
    }
    return arr;
}

let grid;
let rows = 10;
let cols = 10;

function setup () {

    grid = make2DArray(rows, cols);
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            grid[i][j] = Math.floor(Math.random() * 2);
        }

    }
}

setup();
console.log(grid);