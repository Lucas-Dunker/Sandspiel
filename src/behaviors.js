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
    const currentCol = i % grid.width;

    const moves = [];
    const weights = [];

    // Check bounds - prevent going above top or below bottom
    if (nextVertical < 0 || nextVertical >= grid.grid.length) {
      if (this.drifts && Math.random() < this.driftChance) {
        this.addHorizontalMoves(grid, i, currentCol, moves, weights);
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
        this.addHorizontalMoves(grid, i, currentCol, moves, weights);
      }
    }

    return { moves, weights };
  }

  /**
   * Adds horizontal movement options to the moves array.
   * @param {Grid} grid - The grid containing the particle.
   * @param {number} i - The current index.
   * @param {number} currentCol - The current column.
   * @param {number[]} moves - Array to add moves to.
   * @param {number[]} weights - Array to add weights to.
   */
  addHorizontalMoves(grid, i, currentCol, moves, weights) {
    const left = i - 1;
    const right = i + 1;

    if (currentCol > 0 && this.canPassThrough(grid.grid[left], left)) {
      moves.push(left);
      weights.push(1);
    }

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
    this.remainingLife = lifetime;
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
 * Calculates the spread likelihood based on various factors.
 * @param {Object} [options={}] - Configuration options.
 * @param {number} [options.baseChance=0.1] - Base chance to spread (0-1).
 * @param {number} [options.fuel=1] - Remaining fuel factor (higher = more spread).
 * @param {number} [options.neighborCount=1] - Number of burning neighbors.
 * @returns {number} The calculated spread probability (0-1).
 */
function calculateSpreadLikelihood({
  baseChance = 0.1,
  fuel = 1,
  neighborCount = 1,
} = {}) {
  const neighborBonus = Math.min(neighborCount * 0.15, 0.5);
  const fuelBonus = Math.min(fuel / 200, 0.3);
  return Math.min(baseChance + neighborBonus + fuelBonus, 0.9);
}

/**
 * Behavior that makes particles flammable and turn into smoke upon burning out.
 */
class Flammable extends LimitedLife {
  static colors = ["#541e1e", "#ff1f1f", "#ea5a00", "#ff6900", "#eecc09"];

  /**
   * Creates a new Flammable behavior.
   * @param {Object} [options={}] - Configuration options.
   * @param {number} [options.fuel] - How long the particle burns (frames).
   * @param {number} [options.chanceToCatch=0.01] - Base chance to catch fire per exposure.
   * @param {boolean} [options.startBurning=false] - Whether to start already burning.
   */
  constructor({ fuel, chanceToCatch = 0.01, startBurning = false } = {}) {
    const actualFuel = fuel ?? 10 + 100 * Math.random();

    super(actualFuel, {
      onTick: (behavior, particle) => {
        const frequency = Math.sqrt(behavior.lifetime / behavior.remainingLife);
        const period = frequency * Flammable.colors.length;
        const pct = behavior.remainingLife / period;
        const colorIndex = Math.floor(pct) % Flammable.colors.length;
        particle.color = color(Flammable.colors[colorIndex]);
      },
      onDeath: (_, particle, grid) => {
        const isSpark = Math.random() < 0.1;
        grid.setIndex(particle.index, new Smoke(Smoke.baseColor, isSpark));
      },
    });

    this.chanceToCatch = chanceToCatch;
    this.chancesToCatch = 0;
    this.burning = startBurning;
  }

  /**
   * Checks if this particle is currently burning.
   * @returns {boolean} True if burning.
   */
  isBurning() {
    return this.burning;
  }

  /**
   * Ignites this particle, starting the burning process.
   */
  ignite() {
    this.burning = true;
  }

  /**
   * Updates the flammable behavior.
   * @param {Particle} particle - The particle to update.
   * @param {Grid} grid - The grid containing the particle.
   */
  update(particle, grid) {
    if (this.chancesToCatch > 0 && !this.burning) {
      const catchProbability = Math.min(
        this.chancesToCatch * this.chanceToCatch,
        0.8,
      );
      if (Math.random() < catchProbability) {
        this.burning = true;
      }
      this.chancesToCatch = 0;
    }

    if (this.burning) {
      super.update(particle, grid);
      this.tryToSpread(particle, grid);
    }
  }

  /**
   * Attempts to spread fire to neighboring flammable particles.
   * @param {Particle} particle - The burning particle.
   * @param {Grid} grid - The grid containing the particle.
   */
  tryToSpread(particle, grid) {
    const candidates = this.getSpreadCandidates(particle, grid);
    const spreadChance = calculateSpreadLikelihood({
      baseChance: 0.1,
      fuel: this.remainingLife,
      neighborCount: 1,
    });

    for (const i of candidates) {
      const p = grid.grid[i];
      if (!p) continue;

      const flammable = p.getBehavior(Flammable);
      if (flammable && !flammable.burning) {
        flammable.chancesToCatch += spreadChance * (0.5 + Math.random() * 0.5);
      }
    }
  }

  /**
   * Gets indices of neighboring cells that could catch fire.
   * @param {Particle} particle - The burning particle.
   * @param {Grid} grid - The grid containing the particle.
   * @returns {number[]} Array of candidate indices.
   */
  getSpreadCandidates(particle, grid) {
    const index = particle.index;
    const column = index % grid.width;
    const candidates = [];

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;

        const di = index + dx + dy * grid.width;
        const x = di % grid.width;
        const inBounds = di >= 0 && di < grid.grid.length;
        const noWrap = Math.abs(x - column) <= 1;

        if (inBounds && noWrap) {
          candidates.push(di);
        }
      }
    }

    return candidates;
  }
}
