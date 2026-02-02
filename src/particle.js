/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

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
    for (const behavior of this.behaviors) {
      behavior.update(this, grid, params);
    }
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
 * Empty cell representing vacant space.
 */
class Empty extends Particle {
  static baseColor = "#0d1014";

  constructor() {
    super({ empty: true });
  }
}

/**
 * Sand particle that falls and piles up.
 */
class Sand extends Particle {
  static baseColor = "#dcb159";

  /**
   * Creates a new sand particle.
   * @param {string} [baseColor] - Optional custom color.
   */
  constructor(baseColor) {
    super({
      color: baseColor ?? Sand.baseColor,
      behaviors: [new MovesDown({ maxSpeed: 8, acceleration: 0.4 })],
    });
  }
}

/**
 * Wood particle that is stationary and flammable.
 */
class Wood extends Particle {
  static baseColor = "#46281d";

  /**
   * Creates a new wood particle.
   * @param {string} [baseColor] - Optional custom color.
   */
  constructor(baseColor) {
    super({
      color: baseColor ?? Wood.baseColor,
      behaviors: [
        new Flammable({
          fuel: 200 + 100 * Math.random(),
          chanceToCatch: 0.02,
          startBurning: false,
        }),
      ],
    });
  }
}

/**
 * Smoke particle that rises upward and fades over time.
 * Has a chance to be a spark that falls instead.
 */
class Smoke extends Particle {
  static baseColor = "#4C4A4D";
  static sparkColors = ["#ff6600", "#ff9900", "#ffcc00", "#ffff66"];

  /**
   * Creates a new smoke particle.
   * @param {string|p5.Color} [baseColor] - Optional custom color.
   * @param {boolean} [isSpark=false] - Whether this is a burning spark.
   */
  constructor(baseColor, isSpark = false) {
    const isSparkParticle = isSpark || Math.random() < 0.15;
    const lifetime = isSparkParticle
      ? 5 + 30 * Math.random()
      : 10 + 200 * Math.random();

    const smokeColor = Smoke.createColor(baseColor, isSparkParticle);
    const behaviors = Smoke.createBehaviors(isSparkParticle, lifetime);

    super({
      color: smokeColor,
      behaviors,
    });

    this.isSpark = isSparkParticle;
  }

  /**
   * Creates the appropriate color for smoke or spark.
   * @param {string|p5.Color} baseColor - Base color input.
   * @param {boolean} isSparkParticle - Whether this is a spark.
   * @returns {p5.Color} The created color.
   */
  static createColor(baseColor, isSparkParticle) {
    if (isSparkParticle) {
      const sparkColorIndex = Math.floor(
        Math.random() * Smoke.sparkColors.length,
      );
      return window.color(Smoke.sparkColors[sparkColorIndex]);
    }

    if (typeof baseColor === "string") {
      return window.color(baseColor);
    }

    return baseColor ?? window.color(Smoke.baseColor);
  }

  /**
   * Creates behaviors array for smoke or spark.
   * @param {boolean} isSparkParticle - Whether this is a spark.
   * @param {number} lifetime - The particle lifetime.
   * @returns {Behavior[]} Array of behaviors.
   */
  static createBehaviors(isSparkParticle, lifetime) {
    const behaviors = [];

    // Movement behavior
    if (isSparkParticle) {
      behaviors.push(
        new MovesDown({
          maxSpeed: 1.5,
          acceleration: 0.2,
          drifts: true,
          driftChance: 0.9,
        }),
      );
    } else {
      behaviors.push(
        new MovesUp({
          maxSpeed: 0.5,
          acceleration: 0.1,
          drifts: true,
          driftChance: 0.8,
        }),
      );
    }

    // Sparks are flammable
    if (isSparkParticle) {
      behaviors.push(
        new Flammable({
          fuel: lifetime,
          chanceToCatch: 0.05,
          startBurning: true,
        }),
      );
    }

    // Life behavior with tick and death handlers
    behaviors.push(
      new LimitedLife(lifetime, {
        onTick: (behavior, particle) => {
          const pct = behavior.getLifePercent();

          if (particle.isSpark) {
            const sparkColorIndex = Math.floor(
              Math.random() * Smoke.sparkColors.length,
            );
            const sparkColor = window.color(Smoke.sparkColors[sparkColorIndex]);
            sparkColor.setAlpha(Math.floor(255 * pct));
            particle.color = sparkColor;
          } else {
            particle.color.setAlpha(Math.floor(255 * pct));
          }
        },
        onDeath: (_, particle, grid) => {
          grid.clearIndex(particle.index);
        },
      }),
    );

    return behaviors;
  }
}

/**
 * Fire particle that burns and spreads to flammable materials.
 */
class Fire extends Particle {
  static baseColor = "#e34f0f";

  /**
   * Creates a new fire particle.
   * @param {string} [colorOverride] - Optional custom color.
   */
  constructor(colorOverride) {
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
        new Flammable({
          fuel: 30 + 70 * Math.random(),
          chanceToCatch: 1,
          startBurning: true,
        }),
      ],
    });
  }
}
