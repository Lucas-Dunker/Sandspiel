function setup() {
  background(0);
  noStroke();
  fill(102);
}

function draw() {
  rect(a++ % width, 10, 2, 80);
}
