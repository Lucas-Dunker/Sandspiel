/**
 * Base class for particle behaviors.
 */
class Behavior {
  /**
   * Updates the particle based on this behavior.
   * @param {Particle} particle - The particle to update.
   * @param {Grid} grid - The grid containing the particle.
   */
  update(particle, grid) {}
}

/**
 * Behavior that makes particles fall downward with gravity.
 */
class MovesDown extends Behavior {
  /**
   * Creates a new MovesDown behavior.
   * @param {Object} [options={}] - Configuration options.
   * @param {number} [options.maxSpeed=0] - Maximum falling speed.
   * @param {number} [options.acceleration=0] - Acceleration per update.
   * @param {number} [options.velocity=0] - Initial velocity.
   */
  constructor({ maxSpeed = 0, acceleration = 0, velocity = 0 } = {}) {
    super();
    this.maxSpeed = maxSpeed;
    this.acceleration = acceleration;
    this.velocity = velocity;
  }

  /**
   * Resets the velocity to zero.
   */
  resetVelocity() {
    this.velocity = 0;
  }

  /**
   * Updates the velocity by applying acceleration.
   */
  updateVelocity() {
    this.velocity = this.nextVelocity();
  }

  /**
   * Calculates the next velocity value, clamped to maxSpeed.
   * @returns {number} The next velocity value.
   */
  nextVelocity() {
    if (this.maxSpeed === 0) return 0;

    const newVelocity = this.velocity + this.acceleration;
    return Math.abs(newVelocity) > this.maxSpeed
      ? Math.sign(newVelocity) * this.maxSpeed
      : newVelocity;
  }

  /**
   * Calculates how many movement steps to perform this frame.
   * Uses fractional velocity as probability for extra steps.
   * @returns {number} The number of update steps to perform.
   */
  getUpdateCount() {
    const abs = Math.abs(this.velocity);
    const floored = Math.floor(abs);
    const fractional = abs - floored;
    return floored + (Math.random() < fractional ? 1 : 0);
  }

  /**
   * Determines if this particle can pass through another.
   * @param {Particle} particle - The particle to check.
   * @returns {boolean} True if passage is allowed.
   */
  canPassThrough(particle) {
    return particle?.empty ?? false;
  }

  /**
   * Gets possible movement destinations with their weights.
   * @param {Grid} grid - The grid containing the particle.
   * @param {number} i - The current index of the particle.
   * @returns {{moves: number[], weights: number[]}} Possible moves and their weights.
   */
  possibleMoves(grid, i) {
    const nextDelta = Math.sign(this.velocity) * grid.width;
    const nextVertical = i + nextDelta;
    const column = i % grid.width;

    const moves = [];
    const weights = [];

    if (this.canPassThrough(grid.grid[nextVertical])) {
      moves.push(nextVertical);
      weights.push(2);
    } else {
      const nextLeft = nextVertical - 1;
      const nextRight = nextVertical + 1;

      // Check left (ensure no wrap)
      if (
        this.canPassThrough(grid.grid[nextLeft]) &&
        nextLeft % grid.width < column
      ) {
        moves.push(nextLeft);
        weights.push(1);
      }

      // Check right (ensure no wrap)
      if (
        this.canPassThrough(grid.grid[nextRight]) &&
        nextRight % grid.width > column
      ) {
        moves.push(nextRight);
        weights.push(1);
      }
    }

    return { moves, weights };
  }

  /**
   * Performs a single movement step for the particle.
   * @param {Particle} particle - The particle to move.
   * @param {Grid} grid - The grid containing the particle.
   */
  step(particle, grid) {
    const i = particle.index;

    if (grid.isEmpty(i)) {
      this.resetVelocity();
      return;
    }

    const { moves, weights } = this.possibleMoves(grid, i);

    if (!moves.length) {
      this.resetVelocity();
      return;
    }

    const choice = this.weightedChoice(moves, weights);
    grid.swap(i, choice);
  }

  /**
   * Selects a random option based on weights.
   * @param {Array} options - The options to choose from.
   * @param {number[]} weights - The weight for each option.
   * @returns {*} The selected option.
   */
  weightedChoice(options, weights) {
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < options.length; i++) {
      random -= weights[i];
      if (random <= 0) return options[i];
    }
    return options[options.length - 1];
  }

  /**
   * Updates the particle's position based on velocity.
   * @param {Particle} particle - The particle to update.
   * @param {Grid} grid - The grid containing the particle.
   */
  update(particle, grid) {
    this.updateVelocity();
    const updateCount = this.getUpdateCount();

    if (updateCount === 0) {
      grid.onModified(particle.index);
      return;
    }

    for (let v = 0; v < updateCount; v++) {
      const prevIndex = particle.index;
      this.step(particle, grid);

      if (particle.index !== prevIndex) {
        grid.onModified(prevIndex);
        grid.onModified(particle.index);
      } else {
        this.resetVelocity();
        break;
      }
    }
  }
}

/**
 * Base class for all particles in the simulation.
 */
class Particle {
  /**
   * Creates a new particle.
   * @param {Object} [options={}] - Configuration options.
   * @param {p5.Color|string} [options.color] - The particle's color.
   * @param {boolean} [options.empty=false] - Whether this is an empty cell.
   * @param {Behavior[]} [options.behaviors=[]] - The particle's behaviors.
   */
  constructor({ color, empty = false, behaviors = [] } = {}) {
    this.behaviors = behaviors;
    this.behaviorsLookup = Object.fromEntries(
      behaviors.map((b) => [b.constructor.name, b]),
    );
    this.color = color;
    this.empty = empty;
    this.index = -1;
  }

  /**
   * Updates all behaviors for this particle.
   * @param {Grid} grid - The grid containing the particle.
   * @param {Object} [params] - Additional parameters for behaviors.
   */
  update(grid, params) {
    this.behaviors.forEach((b) => b.update(this, grid, params));
  }

  /**
   * Gets a specific behavior by its class type.
   * @param {Function} type - The behavior class to find.
   * @returns {Behavior|undefined} The behavior instance, if found.
   */
  getBehavior(type) {
    return this.behaviorsLookup[type.name];
  }
}

/**
 * Sand particle that falls and piles up.
 */
class Sand extends Particle {
  /** @type {string} The default sand color. */
  static baseColor = "#dcb159";

  /**
   * Creates a new sand particle.
   * @param {string} [color] - Optional custom color.
   */
  constructor(color) {
    super({
      color: color ?? Sand.baseColor,
      behaviors: [new MovesDown({ maxSpeed: 8, acceleration: 0.4 })],
    });
  }
}

/**
 * Empty cell representing vacant space.
 */
class Empty extends Particle {
  /** @type {string} The background color. */
  static baseColor = "#0d1014";

  /**
   * Creates a new empty cell.
   */
  constructor() {
    super({ empty: true });
  }
}

/**
 * Wood particle that is stationary.
 */
class Wood extends Particle {
  /** @type {string} The default wood color. */
  static baseColor = "#46281d";

  /**
   * Creates a new wood particle.
   * @param {string} [color] - Optional custom color.
   */
  constructor(color) {
    super({ color: color ?? Wood.baseColor, behaviors: [] });
  }
}
