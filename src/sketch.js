const ZOOM = 10;
var WIDTH = Math.floor(window.innerWidth / ZOOM) + 1;
var HEIGHT = Math.floor(window.innerHeight / ZOOM) + 1;

const SAND_COLOR = "#dcb159";
const BACKGROUND_COLOR = "#0d1014";

var p5Canvas;
var Canvas = new Grid();

function setZoom(canvas) {
  canvas.elt.style.width = `${WIDTH * ZOOM}px`;
  canvas.elt.style.height = `${HEIGHT * ZOOM}px`;
}

function windowResized() {
  WIDTH = Math.floor(window.innerWidth / ZOOM) + 1;
  HEIGHT = Math.floor(window.innerHeight / ZOOM) + 1;
  resizeCanvas(WIDTH, HEIGHT);
  setup();
}

function setup() {
  //Disable normal right-clicking behavior
  for (let element of document.getElementsByClassName("p5Canvas")) {
    element.addEventListener("contextmenu", (e) => e.preventDefault());
    element.addEventListener("touchstart", (e) => e.preventDefault());
    element.addEventListener("touchend", (e) => e.preventDefault());
    element.addEventListener("touchmove", (e) => e.preventDefault());
  }

  frameRate(60);
  pixelDensity(1);

  p5Canvas = createCanvas(WIDTH, HEIGHT);
  setZoom(p5Canvas);

  background(color(BACKGROUND_COLOR));
  loadPixels();
  noCursor();

  Canvas.initialize(WIDTH, HEIGHT);
}

function draw() {
  update();

  Canvas.grid.forEach((particle, index) => {
    setPixel(index, particle.color || BACKGROUND_COLOR);
  });

  updatePixels();
  drawMouseCircle(4);

  if (mouseIsPressed) {
    // Left Click - Make some sand!
    if (mouseButton === LEFT) {
      Canvas.setCircle(
        getMousePixelX(),
        getMousePixelY(),
        () => new Sand(color(varyColor(SAND_COLOR))),
        2,
        0.5
      );
    }
    // Right Click - Clear the Canvas
    if (mouseButton === RIGHT) {
      Canvas.clear();
    }
  }
}

function update() {
  Canvas.update();
}

function drawMouseCircle(radius) {
  fill(SAND_COLOR);
  noStroke();

  circle(getMousePixelX(), getMousePixelY(), 2 * radius);
}

// Translate mouse coordinates to the pixel grid
const getMousePixelX = () => floor(constrain(mouseX, 0, width - 1));
const getMousePixelY = () => floor(constrain(mouseY, 0, height - 1));

// Translate a grid pixel index to a p5.js pixel
function setPixel(i, color) {
  const index = 4 * i;
  pixels[index] = red(color);
  pixels[index + 1] = green(color);
  pixels[index + 2] = blue(color);
  pixels[index + 3] = alpha(color);
}

// Slightly vary the hsl value of a given color
const varyColor = (color) => {
  let pixel_hue = floor(hue(color));
  let pixel_saturation = saturation(color) + floor(random(-20, 0));
  pixel_saturation = constrain(pixel_saturation, 0, 100);
  let pixel_lightness = lightness(color) + floor(random(-10, 10));
  pixel_lightness = constrain(pixel_lightness, 0, 100);
  return `hsl(${pixel_hue}, ${pixel_saturation}%, ${pixel_lightness}%)`;
};
