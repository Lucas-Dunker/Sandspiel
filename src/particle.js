class Particle {
  constructor({ color, empty } = {}) {
    this.color = color;
    this.empty = empty ?? false;
  }

  update() {}
}

class Sand extends Particle {
  static baseColor = "#dcb159";
  constructor(color) {
    const sandColor = color ?? Sand.baseColor;
    super({ color: sandColor });

    this.maxSpeed = 8;
    this.acceleration = 0.2;
    this.velocity = 0;
    this.modified = false;
  }

  updateVelocity() {
    let newVelocity = this.velocity + this.acceleration;

    if (Math.abs(newVelocity) > this.maxSpeed) {
      newVelocity = Math.sign(newVelocity) * this.maxSpeed;
    }

    this.velocity = newVelocity;
  }

  resetVelocity() {
    this.velocity = 0;
  }

  getUpdateCount() {
    const abs = Math.abs(this.velocity);
    const floored = Math.floor(abs);
    const mod = abs - floored;

    // Treat a remainder (e.g. 0.5) as a random chance to update
    return floored + (Math.random() < mod ? 1 : 0);
  }

  update() {
    if ((this.maxSpeed ?? 0) === 0) {
      this.modified = false;
      return;
    }
    this.updateVelocity();
    this.modified = this.velocity !== 0;
  }
}

class Empty extends Particle {
  static baseColor = window.background;
  constructor() {
    super({ empty: true });
  }
}
