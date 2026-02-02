/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
// ------- TOP-LEVEL VARIABLES ------------------

const ZOOM = 3;
const SAND_COLOR = "#dcb159";
const BACKGROUND_COLOR = "#0d1014";
const WOOD_COLOR = "#46281d";
const SMOKE_COLOR = "#4C4A4D";

let WIDTH = Math.floor(window.innerWidth / ZOOM) + 1;
let HEIGHT = Math.floor(window.innerHeight / ZOOM) + 1;
let p5Canvas;
let Canvas = new Grid();
let isRendering = true;
let currentParticle = "Sand";

// ----------------------------------------------

/**
 * Handles window resize events by recalculating dimensions and reinitializing.
 */
function windowResized() {
  WIDTH = Math.floor(window.innerWidth / ZOOM) + 1;
  HEIGHT = Math.floor(window.innerHeight / ZOOM) + 1;
  resizeCanvas(WIDTH, HEIGHT);
  setup();
}

/**
 * Sets the CSS zoom scale on the canvas element.
 * @param {p5.Renderer} canvas - The p5.js canvas object.
 */
function setZoom(canvas) {
  canvas.elt.style.width = `${WIDTH * ZOOM}px`;
  canvas.elt.style.height = `${HEIGHT * ZOOM}px`;
}

/**
 * Initializes the p5.js sketch, canvas, and UI buttons.
 */
function setup() {
  // Disable context menu on canvas
  document.querySelectorAll(".p5Canvas").forEach((el) => {
    el.addEventListener("contextmenu", (e) => e.preventDefault());
  });

  // Remove existing buttons
  document.querySelectorAll("button").forEach((btn) => btn.remove());

  frameRate(60);
  pixelDensity(window.devicePixelRatio);

  p5Canvas = createCanvas(WIDTH, HEIGHT);
  setZoom(p5Canvas);

  background(color(BACKGROUND_COLOR));
  loadPixels();
  noCursor();

  Canvas.initialize(WIDTH, HEIGHT);

  createParticleButton(
    "SAND",
    0,
    0,
    SAND_COLOR,
    null,
    () => (currentParticle = "Sand"),
  );
  createParticleButton(
    "WOOD",
    80,
    0,
    WOOD_COLOR,
    "#FAF9F6",
    () => (currentParticle = "Wood"),
  );
  createParticleButton(
    "SMOKE",
    0,
    30,
    SMOKE_COLOR,
    "#FAF9F6",
    () => (currentParticle = "Smoke"),
  );
  createParticleButton(
    "EMPTY",
    0,
    60,
    BACKGROUND_COLOR,
    "#FAF9F6",
    () => (currentParticle = "Empty"),
  );
  createParticleButton("CLEAR", 80, 60, BACKGROUND_COLOR, "#FAF9F6", () =>
    Canvas.clear(),
  );
}

/**
 * Creates a styled UI button for particle selection.
 * @param {string} label - The button text.
 * @param {number} xPos - The x position of the button.
 * @param {number} yPos - The y position of the button.
 * @param {string} bgColor - The background color.
 * @param {string|null} textColor - The text color, or null for default.
 * @param {Function} onClick - The click handler.
 */
function createParticleButton(label, xPos, yPos, bgColor, textColor, onClick) {
  const btn = createButton(label);
  btn.size(80, 30);
  btn.position(xPos, yPos);
  btn.mousePressed(onClick);
  btn.style("background-color", bgColor);
  if (textColor) btn.style("color", textColor);
}

/**
 * Main draw loop - updates and renders the simulation.
 */
function draw() {
  Canvas.draw();
  Canvas.update();
  updatePixels();
  drawMouseCircle(3, particleColor());

  if (mouseIsPressed) {
    if (mouseButton === LEFT) {
      Canvas.setCircle(
        getMousePixelX(),
        getMousePixelY(),
        makeParticle(),
        2,
        0.5,
      );
    } else if (mouseButton === RIGHT) {
      Canvas.clear();
    }
  }

  if (!Canvas.needsUpdate()) {
    pause();
  }

  // Draw title
  fill(SAND_COLOR);
  textSize(width / 13);
  textAlign(CENTER, TOP);
  text("SANDSPIEL!", width / 2, 10);
}

/**
 * Draws a circle indicator at the mouse position.
 * @param {number} radius - The circle radius.
 * @param {string} particleColor - The fill color.
 */
function drawMouseCircle(radius, particleColor) {
  fill(particleColor);
  if (particleColor === Empty.baseColor) {
    stroke("#fff");
  } else {
    noStroke();
  }
  circle(getMousePixelX(), getMousePixelY(), 2 * radius);
  noStroke();
}

/**
 * Returns a factory function for creating the currently selected particle type.
 * @returns {Function|undefined} A function that creates a particle.
 */
function makeParticle() {
  const particleFactories = {
    Sand: () => new Sand(varyColor(SAND_COLOR)),
    Empty: () => new Empty(),
    Wood: () => new Wood(varyColor(WOOD_COLOR)),
    Smoke: () => {
      const variedColor = varyColor(SMOKE_COLOR, {
        lightFn: () => random(-5, 5),
        satFn: () => random(-5, 0),
      });
      return new Smoke(color(variedColor));
    },
  };
  return particleFactories[currentParticle];
}

/**
 * Gets the color of the currently selected particle type.
 * @returns {string|undefined} The particle color.
 */
function particleColor() {
  const colors = {
    Sand: SAND_COLOR,
    Empty: BACKGROUND_COLOR,
    Wood: WOOD_COLOR,
    Smoke: SMOKE_COLOR,
  };
  return colors[currentParticle];
}

/**
 * Gets the mouse X position constrained to the canvas.
 * @returns {number} The x pixel coordinate.
 */
const getMousePixelX = () => floor(constrain(mouseX, 0, width - 1));

/**
 * Gets the mouse Y position constrained to the canvas.
 * @returns {number} The y pixel coordinate.
 */
const getMousePixelY = () => floor(constrain(mouseY, 0, height - 1));

/**
 * Sets a pixel in the p5.js pixel array.
 * @param {number} i - The pixel index.
 * @param {p5.Color} color - The color to set.
 */
function setPixel(i, color) {
  const index = 4 * i;
  pixels[index] = red(color);
  pixels[index + 1] = green(color);
  pixels[index + 2] = blue(color);
  pixels[index + 3] = alpha(color);
}

/**
 * Clears all pixels on the p5.js canvas to the background color.
 */
function clearPixels() {
  const bgColor = color(BACKGROUND_COLOR);
  for (let i = 0; i < pixels.length / 4; i++) {
    setPixel(i, bgColor);
  }
  updatePixels();
}

/**
 * Slightly varies the HSL values of a color for visual variety.
 * @param {string} baseColor - The base color to vary.
 * @param {Object} [options={}] - Functions to vary hue, saturation, and lightness.
 * @returns {string} A varied HSL color string.
 */
function varyColor(baseColor, { hueFn, satFn, lightFn } = {}) {
  hueFn = hueFn ?? (() => 0);
  satFn = satFn ?? (() => random(-20, 0));
  lightFn = lightFn ?? (() => random(-10, 10));

  const c = color(baseColor);
  let h = floor(hue(c) + hueFn()) % 360;
  let s = constrain(saturation(c) + floor(satFn()), 0, 100);
  let l = constrain(lightness(c) + floor(lightFn()), 0, 100);
  return `hsl(${h}, ${s}%, ${l}%)`;
}

// --------------------------- PAUSING + RESUMING -----------------------------------------

/**
 * Resumes the draw loop if paused.
 */
function resume() {
  if (!isRendering) {
    loop();
    isRendering = true;
  }
}

/**
 * Pauses the draw loop if running.
 */
function pause() {
  if (isRendering) {
    noLoop();
    isRendering = false;
  }
}

/** Resumes rendering when mouse is dragged. */
function mouseDragged() {
  resume();
}

/** Resumes rendering when mouse is moved. */
function mouseMoved() {
  resume();
}

/** Resumes rendering when mouse is pressed. */
function mousePressed() {
  resume();
}

/** Resumes rendering when touch starts. */
function touchStarted() {
  resume();
}
