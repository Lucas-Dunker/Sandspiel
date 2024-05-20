// ------- TOP-LEVEL VARIABLES ------------------

const ZOOM = 5;
var WIDTH = Math.floor(window.innerWidth / ZOOM) + 1;
var HEIGHT = Math.floor(window.innerHeight / ZOOM) + 1;

const SAND_COLOR = "#dcb159";
const BACKGROUND_COLOR = "#0d1014";

var p5Canvas;
var Canvas = new Grid();
var isRendering = true;

var currentParticle = "Sand";

// ----------------------------------------------

function windowResized() {
  WIDTH = Math.floor(window.innerWidth / ZOOM) + 1;
  HEIGHT = Math.floor(window.innerHeight / ZOOM) + 1;
  resizeCanvas(WIDTH, HEIGHT);
  setup();
}

function setZoom(canvas) {
  canvas.elt.style.width = `${WIDTH * ZOOM}px`;
  canvas.elt.style.height = `${HEIGHT * ZOOM}px`;
}

function setup() {
  //Disable normal right-clicking behavior
  for (let element of document.getElementsByClassName("p5Canvas")) {
    element.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  frameRate(60);
  pixelDensity(1);

  p5Canvas = createCanvas(WIDTH, HEIGHT);
  setZoom(p5Canvas);

  background(color(BACKGROUND_COLOR));
  loadPixels();
  noCursor();

  Canvas.initialize(WIDTH, HEIGHT);

  let sandButton = createButton("SAND");
  sandButton.position(110, 110);
  sandButton.mousePressed(sandButtonPress);
  sandButton.style("background-color", SAND_COLOR);

  let emptyButton = createButton("EMPTY");
  emptyButton.position(170, 110);
  emptyButton.mousePressed(emptyButtonPress);
  emptyButton.style("background-color", BACKGROUND_COLOR);
  emptyButton.style("color", "#FAF9F6");

  let clearButton = createButton("CLEAR");
  clearButton.position(240, 110);
  clearButton.mousePressed(clearButtonPress);
  clearButton.style("background-color", BACKGROUND_COLOR);
  clearButton.style("color", "#FAF9F6");
}

function sandButtonPress() {
  currentParticle = "Sand";
}

function emptyButtonPress() {
  currentParticle = "Empty";
}

function clearButtonPress() {
  Canvas.clear();
}

function draw() {
  // Pause all rendering unless Sandspiel is being interacted with
  Canvas.draw();
  Canvas.update();
  updatePixels();
  drawMouseCircle(3, particleColor());

  if (mouseIsPressed) {
    // Left Click - Make some sand!
    if (mouseButton === LEFT) {
      Canvas.setCircle(
        getMousePixelX(),
        getMousePixelY(),
        makeParticle(),
        2,
        0.5
      );
    }
    // Right Click - Clear the Canvas
    if (mouseButton === RIGHT) {
      Canvas.clear();
    }
  }

  if (!Canvas.needsUpdate()) {
    pause();
  }

  fill(SAND_COLOR);
  text("SANDSPIEL!", 10, 20);
}

function drawMouseCircle(radius, particleColor) {
  fill(particleColor);
  stroke("#fff");
  if (particleColor !== Empty.baseColor) {
    noStroke();
  }
  circle(getMousePixelX(), getMousePixelY(), 2 * radius);
  noStroke();
}

const makeParticle = () => {
  if (currentParticle == "Sand") {
    return () => new Sand(color(varyColor(SAND_COLOR)));
  } else if (currentParticle == "Empty") {
    return () => new Empty();
  } else {
    return;
  }
};

const particleColor = () => {
  if (currentParticle == "Sand") {
    return SAND_COLOR;
  } else if (currentParticle == "Empty") {
    return BACKGROUND_COLOR;
  } else {
    return;
  }
};

// Translate mouse coordinates to the pixel grid
const getMousePixelX = () => floor(constrain(mouseX, 0, width - 1));
const getMousePixelY = () => floor(constrain(mouseY, 0, height - 1));

// Translate a grid pixel index to a p5.js pixel
const setPixel = (i, color) => {
  const index = 4 * i;
  pixels[index] = red(color);
  pixels[index + 1] = green(color);
  pixels[index + 2] = blue(color);
  pixels[index + 3] = alpha(color);
};

// Clear all pixels on the p5.js canvas
const clearPixels = () => {
  for (let i = 0; i < pixels.length / 4; i += 1) {
    setPixel(i, color(BACKGROUND_COLOR));
  }
  updatePixels();
};

// Slightly vary the hsl value of a given color
const varyColor = (color) => {
  let pixel_hue = floor(hue(color));
  let pixel_saturation = saturation(color) + floor(random(-20, 0));
  pixel_saturation = constrain(pixel_saturation, 0, 100);
  let pixel_lightness = lightness(color) + floor(random(-10, 10));
  pixel_lightness = constrain(pixel_lightness, 0, 100);
  return `hsl(${pixel_hue}, ${pixel_saturation}%, ${pixel_lightness}%)`;
};

// --------------------------- PAUSING + RESUMING -----------------------------------------
const resume = () => {
  if (!isRendering) {
    loop();
    isRendering = true;
  }
};

const pause = () => {
  if (isRendering) {
    noLoop();
    isRendering = false;
  }
};

function mouseDragged() {
  resume();
}

function mouseMoved() {
  resume();
}

function mousePressed() {
  resume();
}

function touchStarted() {
  resume();
}
