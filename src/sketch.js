const ZOOM = 10;
const WIDTH = Math.floor(window.innerWidth / ZOOM) + 1;
const HEIGHT = Math.floor(window.innerHeight / ZOOM) + 1;

const SAND_COLOR = "#dcb159";
const BACKGROUND_COLOR = "#0d1014";

var Canvas = new Grid();

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
  Canvas.grid.forEach((color, index) => {
    setPixel(index, color || BACKGROUND_COLOR);
  });

  updatePixels();
  update();

  const drawMousePixel = (width, height) => {
    fill(SAND_COLOR);
    noStroke();

    rect(getMousePixelX(), getMousePixelY(), width, height);
  };

  const drawMouseCircle = (radius) => {
    fill(SAND_COLOR);
    noStroke();

    circle(getMousePixelX(), getMousePixelY(), 2 * radius);
  };

  drawMouseCircle(2);

  if (mouseIsPressed) {
    // Left Click - Make some sand!
    if (mouseButton === LEFT) {
      Canvas.setCircle(
        getMousePixelX(),
        getMousePixelY(),
        () => varyColor(SAND_COLOR),
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

function update() {
  // Draw from the end of the list to the beginning
  for (let i = Canvas.grid.length - Canvas.width - 1; i > 0; i--) {
    this.updatePixel(i);
  }
}

function updatePixel(i) {
  const below = i + Canvas.width;
  const belowLeft = below - 1;
  const belowRight = below + 1;

  // If there are no pixels below, move it down;
  // if there pixels down but no pixels diagonally, move the sand diagonally
  if (Canvas.isEmpty(below)) {
    Canvas.swap(i, below);
  } else if (Canvas.isEmpty(belowLeft)) {
    Canvas.swap(i, belowLeft);
  } else if (Canvas.isEmpty(belowRight)) {
    Canvas.swap(i, belowRight);
  }
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
