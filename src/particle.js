/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
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
 * Behavior that makes particles move vertically (up or down) with velocity.
 */
class MovesVertically extends Behavior {
  /**
   * Creates a new MovesVertically behavior.
   * @param {Object} [options={}] - Configuration options.
   * @param {number} [options.maxSpeed=0] - Maximum speed (absolute value).
   * @param {number} [options.acceleration=0] - Acceleration per update (negative = up, positive = down).
   * @param {number} [options.velocity=0] - Initial velocity.
   * @param {boolean} [options.drifts=false] - Whether particle drifts horizontally when blocked.
   * @param {number} [options.driftChance=0.5] - Probability of drifting each frame.
   */
  constructor({
    maxSpeed = 0,
    acceleration = 0,
    velocity = 0,
    drifts = false,
    driftChance = 0.5,
  } = {}) {
    super();
    this.maxSpeed = maxSpeed;
    this.acceleration = acceleration;
    this.velocity = velocity;
    this.drifts = drifts;
    this.driftChance = driftChance;
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
   * Determines if this particle can pass through another position.
   * @param {Particle} particle - The particle at the target position.
   * @param {number} index - The target grid index.
   * @returns {boolean} True if passage is allowed.
   */
  canPassThrough(particle, index) {
    // Check if blocked by text (if collidesWithText function exists)
    if (collidesWithText(index)) {
      return false;
    }
    return particle?.empty ?? false;
  }

  /**
   * Gets the vertical direction of movement.
   * @returns {number} 1 for down, -1 for up, 0 for stationary.
   */
  getDirection() {
    return Math.sign(this.velocity);
  }

  /**
   * Gets possible movement destinations with their weights.
   * @param {Grid} grid - The grid containing the particle.
   * @param {number} i - The current index of the particle.
   * @returns {{moves: number[], weights: number[]}} Possible moves and their weights.
   */
  possibleMoves(grid, i) {
    const direction = this.getDirection();
    if (direction === 0) {
      return { moves: [], weights: [] };
    }

    const nextDelta = direction * grid.width;
    const nextVertical = i + nextDelta;
    const currentRow = Math.floor(i / grid.width);
    const currentCol = i % grid.width;

    const moves = [];
    const weights = [];

    // Check bounds - prevent going above top or below bottom
    if (nextVertical < 0 || nextVertical >= grid.grid.length) {
      // If drifting enabled, try horizontal movement at boundary
      if (this.drifts && Math.random() < this.driftChance) {
        this.addHorizontalMoves(
          grid,
          i,
          currentRow,
          currentCol,
          moves,
          weights,
        );
      }
      return { moves, weights };
    }

    if (this.canPassThrough(grid.grid[nextVertical], nextVertical)) {
      moves.push(nextVertical);
      weights.push(2);
    } else {
      const nextLeft = nextVertical - 1;
      const nextRight = nextVertical + 1;
      const nextRow = Math.floor(nextVertical / grid.width);

      // Check left (ensure no wrap and in bounds)
      if (
        nextLeft >= 0 &&
        Math.floor(nextLeft / grid.width) === nextRow &&
        this.canPassThrough(grid.grid[nextLeft], nextLeft)
      ) {
        moves.push(nextLeft);
        weights.push(1);
      }

      // Check right (ensure no wrap and in bounds)
      if (
        nextRight < grid.grid.length &&
        Math.floor(nextRight / grid.width) === nextRow &&
        this.canPassThrough(grid.grid[nextRight], nextRight)
      ) {
        moves.push(nextRight);
        weights.push(1);
      }

      // If blocked and drifting enabled, try pure horizontal movement
      if (
        moves.length === 0 &&
        this.drifts &&
        Math.random() < this.driftChance
      ) {
        this.addHorizontalMoves(
          grid,
          i,
          currentRow,
          currentCol,
          moves,
          weights,
        );
      }
    }

    return { moves, weights };
  }

  /**
   * Adds horizontal movement options to the moves array.
   * @param {Grid} grid - The grid containing the particle.
   * @param {number} i - The current index.
   * @param {number} currentRow - The current row.
   * @param {number} currentCol - The current column.
   * @param {number[]} moves - Array to add moves to.
   * @param {number[]} weights - Array to add weights to.
   */
  addHorizontalMoves(grid, i, currentRow, currentCol, moves, weights) {
    const left = i - 1;
    const right = i + 1;

    // Check left
    if (currentCol > 0 && this.canPassThrough(grid.grid[left], left)) {
      moves.push(left);
      weights.push(1);
    }

    // Check right
    if (
      currentCol < grid.width - 1 &&
      this.canPassThrough(grid.grid[right], right)
    ) {
      moves.push(right);
      weights.push(1);
    }
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
 * Behavior that makes particles fall downward with gravity.
 * @extends MovesVertically
 */
class MovesDown extends MovesVertically {
  /**
   * Creates a new MovesDown behavior.
   * @param {Object} [options={}] - Configuration options.
   * @param {number} [options.maxSpeed=0] - Maximum falling speed.
   * @param {number} [options.acceleration=0] - Acceleration per update (positive).
   * @param {boolean} [options.drifts=false] - Whether particle drifts horizontally.
   * @param {number} [options.driftChance=0.5] - Probability of drifting.
   */
  constructor({
    maxSpeed = 0,
    acceleration = 0,
    drifts = false,
    driftChance = 0.5,
  } = {}) {
    super({
      maxSpeed,
      acceleration: Math.abs(acceleration),
      velocity: 0,
      drifts,
      driftChance,
    });
  }
}

/**
 * Behavior that makes particles rise upward.
 * @extends MovesVertically
 */
class MovesUp extends MovesVertically {
  /**
   * Creates a new MovesUp behavior.
   * @param {Object} [options={}] - Configuration options.
   * @param {number} [options.maxSpeed=0] - Maximum rising speed.
   * @param {number} [options.acceleration=0] - Acceleration per update (will be negated).
   * @param {boolean} [options.drifts=false] - Whether particle drifts horizontally.
   * @param {number} [options.driftChance=0.5] - Probability of drifting.
   */
  constructor({
    maxSpeed = 0,
    acceleration = 0,
    drifts = false,
    driftChance = 0.5,
  } = {}) {
    super({
      maxSpeed,
      acceleration: -Math.abs(acceleration),
      velocity: 0,
      drifts,
      driftChance,
    });
  }
}

/**
 * Behavior that gives particles a limited lifespan.
 */
class LimitedLife extends Behavior {
  /**
   * Creates a new LimitedLife behavior.
   * @param {number} lifetime - The number of frames the particle lives.
   * @param {Object} [options={}] - Configuration options.
   * @param {Function} [options.onTick] - Callback called each frame with (behavior, particle, grid).
   * @param {Function} [options.onDeath] - Callback called when lifetime expires with (behavior, particle, grid).
   */
  constructor(lifetime, { onTick, onDeath } = {}) {
    super();
    this.lifetime = lifetime;
    this.remainingLife = this.lifetime;
    this.onTick = onTick ?? (() => {});
    this.onDeath = onDeath ?? (() => {});
  }

  /**
   * Gets the percentage of life remaining (0 to 1).
   * @returns {number} The life percentage.
   */
  getLifePercent() {
    return this.remainingLife / this.lifetime;
  }

  /**
   * Updates the particle's remaining life and triggers callbacks.
   * @param {Particle} particle - The particle to update.
   * @param {Grid} grid - The grid containing the particle.
   */
  update(particle, grid) {
    this.onTick(this, particle, grid);

    this.remainingLife--;

    if (this.remainingLife <= 0) {
      this.onDeath(this, particle, grid);
      return;
    }

    grid.onModified(particle.index);
  }
}

/**
 * Behavior that makes particles flammable
 * and turn into smoke upon burning out.
 */
class Flammable extends LimitedLife {
  /**
   * Creates a new Flammable behavior.
   * @param {Object} [options={}] - Configuration options.
   * @param {number} [options.fuel] - How long the particle burns (frames).
   */
  constructor({ fuel } = {}) {
    fuel = fuel ?? 10 + 100 * Math.random();
    const colors = ["#541e1e", "#ff1f1f", "#ea5a00", "#ff6900", "#eecc09"];
    super(fuel, {
      onTick: (behavior, particle) => {
        const frequency = Math.sqrt(behavior.lifetime / behavior.remainingLife);
        const period = frequency * colors.length;
        const pct = behavior.remainingLife / period;
        const colorIndex = Math.floor(pct) % colors.length;
        particle.color = color(colors[colorIndex]);
      },
      onDeath: (_, particle, grid) => {
        const smoke = new Smoke(Smoke.baseColor);
        grid.setIndex(particle.index, smoke);
      },
    });
    this.colors = colors;
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
    this.lastUpdateFrame = -1;
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
  static baseColor = "#46281d";

  /**
   * Creates a new wood particle.
   * @param {string} [color] - Optional custom color.
   */
  constructor(color) {
    super({ color: color ?? Wood.baseColor, behaviors: [] });
  }
}

/**
 * Smoke particle that rises upward and fades over time.
 */
class Smoke extends Particle {
  static baseColor = "#4C4A4D";

  /**
   * Creates a new smoke particle.
   * @param {string} [color] - Optional custom color.
   */
  constructor(color) {
    const onTick = (behavior, particle, grid) => {
      const pct = behavior.getLifePercent();
      particle.color.setAlpha(Math.floor(255 * pct));
    };

    const onDeath = (_, particle, grid) => {
      grid.clearIndex(particle.index);
    };

    // Convert color string to p5.Color so setAlpha works
    const smokeColor =
      typeof color === "string"
        ? window.color(color)
        : (color ?? window.color(Smoke.baseColor));

    super({
      color: smokeColor,
      behaviors: [
        new MovesUp({
          maxSpeed: 0.5,
          acceleration: 0.1,
          drifts: true,
          driftChance: 0.8,
        }),
        new LimitedLife(10 + 200 * Math.random(), {
          onTick,
          onDeath,
        }),
      ],
    });
  }
}

/**
 * Fire particle that is flammable and turns into smoke.
 */
class Fire extends Particle {
  /** @type {string} The default fire color. */
  static baseColor = "#e34f0f";

  /**
   * Creates a new fire particle.
   * @param {string} [colorOverride] - Optional custom color.
   */
  constructor(colorOverride) {
    const flammable = new Flammable();
    const initialColor = colorOverride ?? Fire.baseColor;

    super({
      color: color(initialColor),
      behaviors: [
        new MovesUp({
          maxSpeed: 0.3,
          acceleration: 0.05,
          drifts: true,
          driftChance: 0.6,
        }),
        flammable,
      ],
    });
  }
}
