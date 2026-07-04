# 🏃 Glide Rush
Link- https://new-game-dusky.vercel.app/
A browser-based  endless runner game built with Three.js. Navigate a dynamic city corridor, dodge obstacles, rack up distance, and compete for the highest score — all in your browser.

---

## 🎮 Gameplay

- **Move** — `←` / `→` Arrow Keys to shift lanes
- **Jump** — `Spacebar` to leap over obstacles
- **Survive** — Stay on the platform and avoid red obstacles
- **Speed** — Every 1000 m traveled, your speed increases automatically

Fall off the edge or collide with an obstacle and the run ends.

---

## ✨ Features

- Procedurally generated city environment with varied building styles, window patterns, and rooftop details
- Moving and static obstacle system that activates progressively as the game goes on
- Real-time HUD showing distance (m) and speed (km/h) with color-coded speed indicator
- Persistent high-score backend powered by MongoDB (scores saved per player)
- Optional GPS-based location display (state-level, via OpenStreetMap Nominatim)
- In-game AI-style notifications for milestones, speed boosts, and lane drift warnings
- Animated typewriter splash screen and instruction overlay on first launch
- End-of-run message system with tiered performance feedback
- Time survived counter on the game over screen

---

## 🗂️ Project Structure

```
/
├── index.html          # Entry point, splash + instruction screens, game boot logic
├── src/
│   ├── main.js         # Core game loop, obstacles, buildings, scoring, HUD
│   ├── World.js        # Three.js scene, camera, lighting, renderer setup
│   ├── Player.js       # Player mesh creation
│   ├── Obstacle.js     # Obstacle helpers (if separated)
│   └── style.css       # All UI styles
└── backend/
    ├── api/get-score.js    # GET endpoint — fetch player high score from MongoDB
    └── api/post-score.js   # POST endpoint — save/update player score
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| 3D Rendering | [Three.js](https://threejs.org/) r160 |
| Build Tool | [Vite](https://vitejs.dev/) |
| Backend / API | Node.js serverless functions (Vercel) |
| Database | MongoDB via Mongoose |
| Geocoding | OpenStreetMap Nominatim (reverse geocoding) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A MongoDB connection URI (for backend score tracking)

### Local Development

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open `http://localhost:5173` in your browser.

### Build for Production

```bash
npm run build
```

Output goes to `dist/`. Deploy to any static host (Vercel, Netlify, GitHub Pages, etc.).

---

## 🔧 Backend Setup

The scoring API expects two environment variables on your serverless host:

```
MONGODB_URI=your_mongodb_connection_string
```

Deploy the `backend/api/` folder as serverless functions. The project is pre-configured for Vercel — connect your repo and set the env var in the project settings.

API endpoints:

| Method | Route | Description |
|---|---|---|
| GET | `/api/get-score?player=NAME` | Returns the stored high score for a player |
| POST | `/api/post-score` | Accepts `{ player, score }` and updates if it's a new high |

---

## ⚙️ Configuration

Inside `src/main.js`, a few constants control core game feel:

```js
const baseForwardSpeed = 0.06;     // Starting speed
const jumpForwardBoost = 0.03;     // Extra speed while airborne
const sideSpeed = 0.05;            // Lateral movement speed
const jumpStrength = 0.21;         // Jump height
const gravity = 0.009;             // Gravity applied each frame
const boostInterval = 1000;        // Distance (m) between speed increases
const speedBoost = 0.02;           // Speed delta per boost
```

The player name used for score tracking is set at the top of `main.js`:

```js
const playerName = "John"; // Change this to your desired player identifier
```

---

## 📍 Location Feature

On launch, players can optionally allow browser geolocation. If granted, the game performs a reverse geocode lookup using the OpenStreetMap Nominatim API and displays the player's state in the HUD. No precise coordinates are stored or transmitted beyond the geocoding request.

---

## 📊 Speed Indicator

The HUD speed display changes color based on current velocity:

| Color | Speed Range |
|---|---|
| 🟢 Green | Below 15 km/h |
| 🟡 Yellow | 15 – 29 km/h |
| 🟠 Orange | 30 – 44 km/h |
| 🔴 Red | 45+ km/h |

---

## 🏆 Scoring Tiers

End-of-run feedback is based on distance covered:

| Distance | Tier |
|---|---|
| < 1000 m | Just Warming Up |
| 1000 – 1999 m | Getting There |
| 2000 – 2999 m | Solid Run |
| 3000 – 3999 m | Elite |
| 4000 m+ | God Tier |

---

## 📄 License

This project is open source. Feel free to fork, remix, and build on top of it. Attribution appreciated but not required.

---

## 🙏 Acknowledgements

- [Three.js](https://threejs.org/) — 3D rendering engine
- [OpenStreetMap Nominatim](https://nominatim.org/) — Reverse geocoding
- [Vercel](https://vercel.com/) — Serverless deployment platform
