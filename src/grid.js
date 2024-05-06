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

  // TODO: work on this, would ideally set a bunch of pixels at the same time in a circle
  setCircle(x, y, colorFn, radius = 2, probability = 1.0) {
    let radiusSq = radius * radius;
    for (let y1 = -radius; y1 <= radius; y1++) {
      for (let x1 = -radius; x1 <= radius; x1++) {
        if (x1 * x1 + y1 * y1 <= radiusSq && Math.random() < probability) {
          this.set(x + x1, y + y1, colorFn());
        }
      }
    }
  }
}
