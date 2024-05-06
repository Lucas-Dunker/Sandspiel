const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;

const SAND_COLOR = "#dcb159";

class Grid {
  initialize(width, height) {
    this.width = width;
    this.height = height;
    this.grid = new Array(width * height).fill(0);
  }

  // Clear the grid
  clear() {
    this.grid = new Array(this.width * this.height).fill(0);
  }

  // Set a particle at the given x and y coordinate to the given color
  set(x, y, color) {
    this.grid[y * this.width + x] = color;
  }

  // Swap two particles
  swap(a, b) {
    const temp = this.grid[a];
    this.grid[a] = this.grid[b];
    this.grid[b] = temp;
  }

  // Check if a particle exists in a space
  isEmpty(index) {
    return this.grid[index] === 0;
  }
}

function setup() {
  frameRate(60);
  pixelDensity(1);
  createCanvas(WIDTH, HEIGHT);
  loadPixels();
  noCursor();
}

function draw() {}

function update() {}

function onLeftClick() {}

function onRightClick() {}
