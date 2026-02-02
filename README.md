# Sandspiel

A miniature falling sand physics simulation built with p5.js. Interact with sand, wood, smoke, and fire!

![Sandspiel-Demo](https://github.com/user-attachments/assets/9b53b5de-f693-4b5f-a747-f600a088255d)

## How to Play

Click and drag on the canvas to place particles. Use the buttons to select different particle types. Right click to clear the canvas of particles.

### Sand

Sand particles fall downward and pile up naturally. They slide off slopes and fill containers. Great for creating landscapes or burying other elements.

### Wood

Wood is a solid, stationary material. But it's also flammable...

### Fire

Fire changes color as it burns, rising slowly upward while drifting from side to side.

### Smoke

Smoke rises from burning materials and fades away over time. Some smoke particles become **sparks**, bright embers that fall downward and have a chance to ignite.

## Setup

### Prerequisites

- A modern web browser
- VSCode's [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)
- [Node.js](https://nodejs.org/) (optional, for local development and code linting)

### Running Locally

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/sandspiel.git
   cd sandspiel
   ```

2. Start a live server

3. Navigate to `http://localhost:3000` (or the URL shown in your terminal) and open `index.html`.

## Project Structure

```text
Sandspiel/
├── src/
│   ├── behaviors.js   # Particle behaviors
│   ├── grid.js        # Grid management and rendering
│   ├── particle.js    # Particle types
│   ├── sketch.js      # Main p5.js sketch and UI
|   └── index.html     # Entry point
└── README.md
```

The simulation uses a component-based architecture where particles have composable behaviors:

- **MovesDown / MovesUp** - Handles gravity and rising motion with acceleration
- **LimitedLife** - Gives particles a lifespan with tick and death callbacks
- **Flammable** - Makes particles burnable with fire spread mechanics

Feel free to contribute and add your own particles!

## Acknowledgments

Inspired by the classic [Falling Sand Game](https://en.wikipedia.org/wiki/Falling-sand_game) and [Sandspiel.club](https://sandspiel.club/).

jason.today's [falling sand tutorials](https://jason.today/falling-sand) were heavily utilized and are highly recommended!

