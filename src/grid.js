class Grid {
  initialize(width, height) {
    this.width = width;
    this.height = height;
    this.clear();
  }

  // Clear the grid - using a 1D Array for better compatibility with p5.js
  clear() {
    this.grid = new Array(this.width * this.height)
      .fill(0)
      .map(() => new Empty());
  }

  // Return the 1D index of the given x and y coordinate
  index(x, y) {
    return y * this.width + x;
  }

  // Set an index n the grid to a given particle
  setIndex(i, particle) {
    this.grid[i] = particle;
  }

  // Set the particle at the given index to an Empty Particle
  clearIndex(i) {
    this.setIndex(i, new Empty());
  }

  // Set an index at the given x and y coordinate to the given particle
  set(x, y, particle) {
    const index = this.index(x, y);
    // Bounds check
    if (x < 0 || x >= this.width) return -1;
    if (y < 0 || y >= this.height) return -1;
    this.setIndex(index, particle);
  }

  // Swap two particles
  swap(a, b) {
    const temp = this.grid[a];
    this.grid[a] = this.grid[b];
    this.setIndex(a, this.grid[b]);
    this.setIndex(b, temp);
  }

  // Check if a particle exists in a space
  isEmpty(index) {
    return this.grid[index]?.empty ?? false;
  }

  // Set a group of particles at the given coordinates and radius,
  // with each granule having a percent change to spawn
  setCircle(x, y, createParticle, radius = 2, probability = 1) {
    let radiusSq = radius * radius;
    for (let y1 = -radius; y1 <= radius; y1++) {
      for (let x1 = -radius; x1 <= radius; x1++) {
        if (x1 * x1 + y1 * y1 <= radiusSq && Math.random() < probability) {
          this.set(x + x1, y + y1, createParticle());
        }
      }
    }
  }

  // Update all pixels in the grid
  update() {
    // Draw from the end of the list to the beginning
    for (let i = Canvas.grid.length - Canvas.width - 1; i > 0; i--) {
      this.updatePixel(i);
    }
  }

  // Update a single pixel in the grid
  updatePixel(i) {
    const below = i + Canvas.width;
    const belowLeft = below - 1;
    const belowRight = below + 1;

    // If there are no pixels below, move it down;
    // if there pixels down but no pixels diagonally, move the sand diagonally
    if (Canvas.isEmpty(below)) {
      Canvas.swap(i, below);
    } else if (Canvas.isEmpty(belowLeft)) {
      Canvas.swap(i, belowLeft);
    } else if (Canvas.isEmpty(belowRight)) {
      Canvas.swap(i, belowRight);
    }
  }
}
