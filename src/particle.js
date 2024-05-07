class Particle {
  constructor({ color, empty } = {}) {
    this.color = color;
    this.empty = empty ?? false;
  }
  // We'll use this later!
  update() {}
}

class Sand extends Particle {
  static SAND_COLOR = "#dcb159";
  constructor() {
    super({ color: varyColor(Sand.baseColor) });
  }
}

class Empty extends Particle {
  static baseColor = window.background;
  constructor() {
    super({ empty: true });
  }
}
