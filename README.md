# Planet Terraformer

A cinematic Martian-inspired survival game built with Three.js featuring stunning visuals, interactive storytelling, and orbital mechanics.

## Play Online

Visit the live game: **[Play Planet Terraformer](https://benfuentestx.github.io/PlanetTerraformer/)**

## Features

- Cinematic opening sequence with planet visualization
- Interactive conference room briefing scene
- Training montage with immersive visuals
- Dramatic rocket launch sequence with countdown
- Mission control dialogue and emergency landing
- Orbital camera controls
- Fast-forward navigation through story sequences

## Run Locally

```bash
# Clone the repository
git clone https://github.com/benfuentestx/PlanetTerraformer.git
cd PlanetTerraformer

# Install dependencies
npm install

# Start the game (opens in browser automatically)
npm start
```

The game will run at `http://localhost:8001`

## Technology Stack

- **Three.js** - 3D graphics and rendering
- **WebGL** - GPU-accelerated graphics
- **GLSL Shaders** - Custom planet and atmosphere effects
- **Playwright** - Automated end-to-end testing

## Project Structure

```
PlanetTerraformer/
├── index.html              # Main game entry point
├── src/
│   ├── js/                 # Game logic and scenes
│   │   ├── main.js
│   │   ├── planet.js
│   │   ├── conferenceScene.js
│   │   ├── rocketScene.js
│   │   ├── animation.js
│   │   ├── ui.js
│   │   └── audio.js
│   └── shaders/            # GLSL shaders
│       ├── planetVertex.glsl
│       ├── planetFragment.glsl
│       ├── atmosphereVertex.glsl
│       └── atmosphereFragment.glsl
└── playwright/             # Automated tests
    ├── tests/
    └── screenshots/
```

## Testing

Run automated Playwright tests:

```bash
npm test
```

## License

MIT
