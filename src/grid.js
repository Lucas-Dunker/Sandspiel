/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
/**
 * Represents a 2D grid of particles for the Sandspiel simulation.
 */
class Grid {
  /**
   * Initializes the grid with the specified dimensions.
   * @param {number} width - The width of the grid in cells.
   * @param {number} height - The height of the grid in cells.
   */
  initialize(width, height) {
    this.width = width;
    this.height = height;
    this.clear();
    this.modifiedIndices = new Set();
    this.cleared = false;
    this.rowCount = Math.floor(this.grid.length / this.width);
    this.updateFrame = 0;
  }

  /**
   * Updates all particles in the grid from bottom to top,
   * with random left-to-right or right-to-left traversal per row.
   * Tracks which particles have been updated to prevent double-updates.
   */
  update() {
    this.cleared = false;
    this.modifiedIndices.clear();
    this.updateFrame++;

    for (let row = this.rowCount - 1; row >= 0; row--) {
      const rowOffset = row * this.width;
      const leftToRight = Math.random() > 0.5;

      for (let i = 0; i < this.width; i++) {
        const columnOffset = leftToRight ? i : this.width - 1 - i;
        const index = rowOffset + columnOffset;
        const particle = this.grid[index];

        // Skip if already updated this frame
        if (particle.lastUpdateFrame === this.updateFrame) {
          continue;
        }

        particle.lastUpdateFrame = this.updateFrame;
        particle.update(this);
      }
    }
  }

  /**
   * Determines if the grid needs to be redrawn.
   * @returns {boolean} True if the grid was cleared or has modified indices.
   */
  needsUpdate() {
    return this.cleared || this.modifiedIndices.size > 0;
  }

  /**
   * Draws the grid onto the p5.js canvas by updating only modified pixels.
   */
  draw() {
    if (this.cleared) {
      clearPixels();
    } else {
      this.modifiedIndices.forEach((index) => {
        setPixel(index, this.grid[index].color || color(BACKGROUND_COLOR));
      });
    }
  }

  /**
   * Sets particles in a circular area with optional probability.
   * @param {number} x - The center x coordinate.
   * @param {number} y - The center y coordinate.
   * @param {Function} createParticle - Factory function to create a particle.
   * @param {number} [radius=2] - The radius of the circle.
   * @param {number} [probability=1] - The probability (0-1) of spawning each particle.
   */
  setCircle(x, y, createParticle, radius = 2, probability = 1) {
    const radiusSq = radius * radius;

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dy * dy <= radiusSq && Math.random() < probability) {
          this.set(x + dx, y + dy, createParticle());
        }
      }
    }
  }

  /**
   * Clears the particle at the given index by replacing it with an Empty particle.
   * @param {number} i - The index to clear.
   */
  clearIndex(i) {
    this.setIndex(i, new Empty());
  }

  /**
   * Sets a particle at the given x and y coordinates.
   * @param {number} x - The x coordinate.
   * @param {number} y - The y coordinate.
   * @param {Particle} particle - The particle to set.
   * @returns {number} -1 if out of bounds, undefined otherwise.
   */
  set(x, y, particle) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return -1;
    }
    this.setIndex(this.index(x, y), particle);
  }

  /**
   * Converts 2D coordinates to a 1D grid index.
   * @param {number} x - The x coordinate.
   * @param {number} y - The y coordinate.
   * @returns {number} The 1D index.
   */
  index(x, y) {
    return y * this.width + x;
  }

  /**
   * Sets a particle at the given grid index.
   * @param {number} i - The grid index.
   * @param {Particle} particle - The particle to set.
   */
  setIndex(i, particle) {
    this.grid[i] = particle;
    particle.index = i;
    this.modifiedIndices.add(i);
  }

  /**
   * Swaps two particles at the given indices.
   * @param {number} a - The first index.
   * @param {number} b - The second index.
   */
  swap(a, b) {
    if (this.grid[a].empty && this.grid[b].empty) {
      return;
    }

    [this.grid[a], this.grid[b]] = [this.grid[b], this.grid[a]];
    this.grid[a].index = a;
    this.grid[b].index = b;
    this.modifiedIndices.add(a);
    this.modifiedIndices.add(b);
  }

  /**
   * Clears the entire grid, filling it with Empty particles.
   */
  clear() {
    this.grid = Array.from({ length: this.width * this.height }, (_, i) => {
      const empty = new Empty();
      empty.index = i;
      return empty;
    });
    this.cleared = true;
  }

  /**
   * Checks if a grid cell is empty.
   * @param {number} index - The grid index to check.
   * @returns {boolean} True if the cell is empty.
   */
  isEmpty(index) {
    return this.grid[index]?.empty ?? false;
  }

  /**
   * Marks an index as modified for rendering.
   * @param {number} index - The grid index to mark.
   */
  onModified(index) {
    this.modifiedIndices.add(index);
  }
}
