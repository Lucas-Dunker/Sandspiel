class Grid {
  initialize(width, height) {
    this.width = width;
    this.height = height;
    this.clear();

    this.modifiedIndices = new Set();
    this.cleared = false;

    this.rowCount = Math.floor(this.grid.length / this.width);
  }

  // Update all pixels in the grid
  update() {
    this.cleared = false;
    this.modifiedIndices = new Set();

    // Draw from the end of the list to the beginning
    for (let row = this.rowCount - 1; row >= 0; row--) {
      const rowOffset = row * this.width;
      const leftToRight = Math.random() > 0.5;
      for (let i = 0; i < this.width; i++) {
        // Go from right to left or left to right depending on our random value
        const columnOffset = leftToRight ? i : -i - 1 + this.width;
        let index = rowOffset + columnOffset;

        if (this.isEmpty(index)) {
          continue;
        }

        const currentParticle = this.grid[index];
        currentParticle.update();

        if (!currentParticle.modified) {
          continue;
        }

        this.modifiedIndices.add(index);
        for (let v = 0; v < currentParticle.getUpdateCount(); v++) {
          const newIndex = this.updatePixel(index);
          if (newIndex !== index) {
            index = newIndex;
          } else {
            currentParticle.resetVelocity(); // Collision with another particle
            break;
          }
        }
      }
    }
  }

  // Update a single pixel in the grid
  updatePixel(i) {
    const below = i + this.width;
    const belowLeft = below - 1;
    const belowRight = below + 1;
    const column = i % this.width;

    // If there are no pixels below, move it down;
    // if there pixels down but no pixels diagonally, move the sand diagonally
    if (this.isEmpty(below)) {
      this.swap(i, below);
      return below;
    } else if (this.isEmpty(belowLeft) && belowLeft % this.width < column) {
      this.swap(i, belowLeft);
      return belowLeft;
    } else if (this.isEmpty(belowRight) && belowRight % this.width > column) {
      this.swap(i, belowRight);
      return belowRight;
    }

    return i;
  }

  // Decide whether or not the grid should be updated (to save computation time)
  needsUpdate() {
    return this.cleared || this.modifiedIndices.size;
  }

  // Draw the grid onto the p5.js canvas
  draw() {
    if (this.cleared) {
      clearPixels();
    } else if (this.modifiedIndices.size) {
      this.modifiedIndices.forEach((index) => {
        setPixel(index, this.grid[index].color || color(BACKGROUND_COLOR));
      });
    }
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

  // Return the 1D index of the given x and y coordinate
  index(x, y) {
    return y * this.width + x;
  }

  // Set an index n the grid to a given particle
  setIndex(i, particle) {
    this.grid[i] = particle;
    this.modifiedIndices.add(i);
  }

  // Swap two particles
  swap(a, b) {
    if (this.grid[a].empty && this.grid[b].empty) {
      return;
    }

    const temp = this.grid[a];
    this.grid[a] = this.grid[b];
    this.setIndex(a, this.grid[b]);
    this.setIndex(b, temp);
  }

  // Clear the grid - using a 1D Array for better compatibility with p5.js
  clear() {
    this.grid = new Array(this.width * this.height)
      .fill(0)
      .map(() => new Empty());

    this.cleared = true;
  }

  // Check if a particle exists in a space
  isEmpty(index) {
    return this.grid[index]?.empty ?? false;
  }
}
