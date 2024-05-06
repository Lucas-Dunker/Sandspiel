const ZOOM = 8;
const WIDTH = Math.floor(window.innerWidth / ZOOM) + 1;
const HEIGHT = Math.floor(window.innerHeight / ZOOM) + 1;

const SAND_COLOR = "#dcb159";
const BACKGROUND_COLOR = "#0d1014";

var Canvas = new Grid();

// Translate mouse coordinates to the pixel grid
const getMousePixelX = () => floor(constrain(mouseX, 0, width - 1));
const getMousePixelY = () => floor(constrain(mouseY, 0, height - 1));

function setPixel(i, color) {
  const index = 4 * i;
  pixels[index] = red(color);
  pixels[index + 1] = green(color);
  pixels[index + 2] = blue(color);
  pixels[index + 3] = alpha(color);
}

// Slightly vary the hsl value of a given color
function varyColor(color) {
  let pixel_hue = floor(hue(color));
  let pixel_saturation = saturation(color) + floor(random(-20, 0));
  pixel_saturation = constrain(pixel_saturation, 0, 100);
  let pixel_lightness = lightness(color) + floor(random(-10, 10));
  pixel_lightness = constrain(pixel_lightness, 0, 100);
  return `hsl(${pixel_hue}, ${pixel_saturation}%, ${pixel_lightness}%)`;
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

  const canvas = createCanvas(WIDTH, HEIGHT);
  canvas.elt.style.width = `${canvas.width * ZOOM}px`;
  canvas.elt.style.height = `${canvas.height * ZOOM}px`;

  loadPixels();
  noCursor();

  Canvas.initialize(WIDTH, HEIGHT);
}

function draw() {
  background(BACKGROUND_COLOR);
  updatePixels();
  Canvas.grid.forEach((color, index) => {
    setPixel(index, color || BACKGROUND_COLOR);
  });

  const drawMousePixel = (width, height) => {
    fill(SAND_COLOR);
    noStroke();

    rect(getMousePixelX(), getMousePixelY(), width, height);
  };
  drawMousePixel(1, 1);

  if (mouseIsPressed) {
    // Left Click - Make some sand!
    if (mouseButton === LEFT) {
      let color = varyColor(SAND_COLOR);
      Canvas.set(getMousePixelX(), getMousePixelY(), color);
    }
    // Right Click - Clear the Canvas
    if (mouseButton === RIGHT) {
      Canvas.clear();
    }
  }
}
