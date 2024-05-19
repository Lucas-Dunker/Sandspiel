class Particle {
  constructor({ color, empty } = {}) {
    this.color = color;
    this.empty = empty ?? false;
  }
  // We'll use this later!
  update() {}
}

class Sand extends Particle {
  static baseColor = "#dcb159";
  constructor(color) {
    const sandColor = color ?? Sand.baseColor;
    super({ color: sandColor });
  }
}

class Empty extends Particle {
  static baseColor = window.background;
  constructor() {
    super({ empty: true });
  }
}
