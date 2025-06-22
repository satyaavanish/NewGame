import * as THREE from 'three';
import { World } from './World';
import { createPlayer } from './Player';
const clock = new THREE.Clock();
const world = new World();
const scene = world.scene;
const camera = world.camera;
const renderer = world.renderer;
const player = createPlayer(scene);
document.body.appendChild(renderer.domElement);

const keys = {};
 window.addEventListener('keydown', e => {
  if (e.key) keys[e.key.toLowerCase()] = true;
});
window.addEventListener('keyup', e => {
  if (e.key) keys[e.key.toLowerCase()] = false;
});
let lastBoostLevel = 0;
let alreadyWarnedRight=false;
let alreadyWarned=false;
let isJumping = false;
let jumpVelocity = 0;
let initialPlayerPosition = player.position.z;
let distance = 0;
let baseForwardSpeed = 0.06;
const jumpForwardBoost = 0.03;
const sideSpeed = 0.05;
const gravity = 0.009;
let highScore=0;
const jumpStrength = 0.21;
let gameOver = false;
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude.toFixed(6);
      const lon = position.coords.longitude.toFixed(6);
      
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'YourGame/1.0 (your@email.com)'
            }
          }
        );

        if (!response.ok) throw new Error("API request failed");
        
        const data = await response.json();
        const state = data?.address?.state || "Unknown State";

        document.getElementById('locationDisplay').textContent = `📍 ${state}`;
        document.getElementById('locationDisplay').dataset.coords = `${lat}, ${lon}`;
        
      } catch (error) {
        console.error("Geocoding error:", error);
        document.getElementById('locationDisplay').textContent = '📍 Location unavailable';
      }
    },
    (error) => {
      console.error("Geolocation error:", error);
      const msg = error.code === error.PERMISSION_DENIED ? '📍 Access denied' :
                  error.code === error.TIMEOUT ? '📍 Timeout' : '📍 Unavailable';
      document.getElementById('locationDisplay').textContent = msg;
    },
    {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 0
    }
  );
} else {
  document.getElementById('locationDisplay').textContent = '📍 Geolocation not supported';
}
function showAINotification(message, bgColor = 'rgba(0, 255, 100, 0.15)') {
  const container = document.getElementById('ai-notifications');
  const msgDiv = document.createElement('div');
  msgDiv.className = 'ai-message';
  msgDiv.textContent = message;

  msgDiv.style.background = bgColor; // 🔥 Custom color

  container.appendChild(msgDiv);

  setTimeout(() => {
    container.removeChild(msgDiv);
  }, 4000);
}

function updatePlayer() {
  if (gameOver || player.position.y <= 0) {
    keys[' '] = false;
    keys['arrowleft'] = false;
    keys['arrowright'] = false;
    return;
  }

  // Check if player is off the platform (x position beyond platform width)
  const platformWidth = 4; // Half width of the platform
  const isOffPlatform = Math.abs(player.position.x) > platformWidth;

  // Apply different movement when off platform
  if (isOffPlatform) {
    // Disable forward movement when falling off
    player.position.z -= baseForwardSpeed * 0.5; // Slow down forward movement
    
    // Apply gravity more strongly when off platform
    if (!isJumping) {
      player.position.y -= gravity * 2;
    }
    
    // Prevent moving back onto platform while falling
    if (keys['arrowleft'] && player.position.x > -platformWidth) {
      player.position.x -= sideSpeed;
    }
    if (keys['arrowright'] && player.position.x < platformWidth) {
      player.position.x += sideSpeed;
    }
  } else {
    // Normal movement when on platform
    const boostInterval = 1000;
    const speedBoost = 0.02;
    const boosts = Math.floor(distance / boostInterval);
    baseForwardSpeed = 0.06 + boosts * speedBoost;
    const currentForwardSpeed = baseForwardSpeed + (isJumping ? jumpForwardBoost : 0);
    player.position.z -= currentForwardSpeed;
 const speedScale = 200; // Adjust this to get realistic km/h values
const speedKmh = Math.round(currentForwardSpeed * speedScale); // Round to nearest integer
 
if (boosts > lastBoostLevel) {
  showAINotification("🚀 Speed Increased!", "rgba(0, 200, 255, 0.2)");
  lastBoostLevel = boosts;  
}
const speedElement = document.getElementById('speedDisplay');
speedElement.textContent = `Speed: ${speedKmh} km/h`;

// Set background color based on speed ranges
speedElement.style.background = 
  speedKmh >= 45 ? "#F44336" :  // Red (45+ km/h)
  speedKmh >= 30 ? "#FF5722" :  // Orange (30-44 km/h)
  speedKmh >= 15 ? "#FFC107" :  // Yellow (15-29 km/h)
  "#4CAF50";                   // Green (<15 km/h)
    if (keys['arrowleft']) player.position.x -= sideSpeed;
    if (keys['arrowright']) player.position.x += sideSpeed;
  }

  // Rest of your jump logic remains the same
  if (keys[' '] && !isJumping && !isOffPlatform) {
    isJumping = true;
    jumpVelocity = jumpStrength;
  }

  if (isJumping) {
    player.position.y += jumpVelocity;
    jumpVelocity -= gravity;
    if (player.position.y <= 0.5) {
      player.position.y = 0.5;
      isJumping = false;
      jumpVelocity = 0;
    }
  }

  player.rotation.x += 0.08;
}



function createObstacle(scene, z, isMoving = false) {
  const geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8); 
 const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  const obstacle = new THREE.Mesh(geometry, material);
  obstacle.position.set((Math.random() - 0.5) * 6, 0.5, z);

  if (isMoving) {
    obstacle.userData = {
      direction: Math.random() > 0.5 ? 1 : -1,
      speed: 0.02 + Math.random() * 0.02,
      range: 2,
      baseX: obstacle.position.x,
      isMoving: true,
      repulsionForce: 0.05
    };
  } else {
    obstacle.userData = { isMoving: false };
  }
  scene.add(obstacle);
  return obstacle;
}

 
function isTooCloseToOtherMovingObstacles(newX, z, existingObstacles, minDistance = 3) {
    return existingObstacles.some(obs => {
        return (obs.userData.isMoving && Math.abs(obs.position.z - z) < 1 && Math.abs(obs.position.x - newX) < minDistance);
    });
}


const tileCount = 10;
const tileLength = 10;
const tiles = [];
for (let i = 0; i < tileCount; i++) {
  const geometry = new THREE.BoxGeometry(8, 0.2, 10);
  const material = new THREE.MeshStandardMaterial({ color: 'lightgray' });
  const tile = new THREE.Mesh(geometry, material);
  tile.position.set(0, 0, -i * tileLength);
  scene.add(tile);
  tiles.push(tile);
}

function recycleTiles() {
  for (let tile of tiles) {
    if (tile.position.z - player.position.z > tileLength) {
      tile.position.z -= tileCount * tileLength;
    }
  }
}

const obstacleCount =20;
const movingObstacleLimit = 1;
const distanceInterval = 300;
const obstacles = [];
let movingObstacleCount = 0;

for (let i = 0; i < obstacleCount; i++) {
  const z = -Math.floor(i / 2) * tileLength - 10;

  let x;
  do {
    x = (Math.random() - 0.5) * 6;
  } while (isTooCloseToOtherMovingObstacles(x, z, obstacles));

  const obstacle = createObstacle(scene, z, false); // all static initially
  obstacle.position.x = x;
  obstacle.userData.willMoveLater = Math.random() < 0.4; // ~40% chance

  obstacles.push(obstacle);
}


function recycleObstacles() {
  let currentMoving = obstacles.filter(o => o.userData.isMoving).length;
const maxMoving = 1;

  for (let obstacle of obstacles) {
    if (obstacle.position.z > player.position.z + tileLength) {
      obstacle.position.z -= tileCount * tileLength;

      let newX;
      let tryCount = 5;

      do {
        newX = (Math.random() - 0.5) * 6;
        var makeMoving = currentMoving < maxMoving && Math.random() > 0.5;

        if (!makeMoving || !isTooCloseToOtherMovingObstacles(newX, obstacle.position.z, obstacles)) {
          break;
        }
      } while (--tryCount > 0);

      obstacle.position.x = newX;

      if (makeMoving || obstacle.userData.isMoving) {
        obstacle.userData = {
          direction: Math.random() > 0.5 ? 1 : -1,
          speed: 0.02 + Math.random() * 0.02,
          range: 2,
          baseX: newX,
          isMoving: true,
          repulsionForce: 0.05
        };
        currentMoving++;
      } else {
        obstacle.userData = { isMoving: false };
      }
      obstacle.material.color.setHex(0xff0000);
    }
  }
}
 
  const playerName = "John";  
const backendUrl = "https://backend-theta-tan-35.vercel.app/api";  

// Fetch player's high score on game start
async function fetchHighScore() {
  try {
    const response = await fetch(`${backendUrl}/get-score?player=${encodeURIComponent(playerName)}`);
    const data = await response.json();
    
    console.log("High Score:", data.highScore);

    const highScoreEl = document.getElementById("highScoreDisplay");
    if (highScoreEl) {
      highScoreEl.textContent = `High Score: ${data.highScore}m`;
    }
  } catch (err) {
    console.error("Failed to fetch high score:", err);
  }
}

// Send new score to backend on game end
async function sendNewScore(newScore) {
  try {
    const response = await fetch(`${backendUrl}/post-score`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ player: playerName, score: newScore }),
    });
    const data = await response.json();

    if (data.success) {
      console.log("Score saved successfully!");

      const finalScoreEl = document.getElementById("finalScore");
      const highScoreEl = document.getElementById("highScoreDisplay");

      if (finalScoreEl) {
        finalScoreEl.textContent = `Your Score: ${newScore}m`;
      }

      if (highScoreEl) {
        highScoreEl.textContent = `High Score: ${data.highScore}m`;
      }
    } else {
      console.log("Failed to save score:", data.error);
    }
  } catch (err) {
    console.error("Error sending score:", err);
  }
}

// Safe to call after DOM loads
document.addEventListener("DOMContentLoaded", () => {
  fetchHighScore();
});

// Expose globally if needed elsewhere
window.sendNewScore = sendNewScore;
window.fetchHighScore = fetchHighScore;


 
function createRealisticBuilding(x, z, height = 10) {
  // Base building parameters
  const width = 4 + Math.random() * 3;
  const depth = 15 + Math.random() * 10;
  const floors = Math.floor(height / 3);
  const floorHeight = height / floors;
  const borderDesignType = Math.floor(Math.random() * 9); // 0 to 5

 
  const building = new THREE.Group();
  building.position.set(x, height /2.2, z);
  
 
  const baseGeometry = new THREE.BoxGeometry(width * 1.05, 0.5, depth * 1.05);
  const baseMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x555555, 
    roughness: 0.8 
  });
  const base = new THREE.Mesh(baseGeometry, baseMaterial);
  base.position.y = -height/2 + 0.25;
  building.add(base);
  
  const buildingColors = [ 
  0x3e3e3e, // dark gray  
  0xa9a9a9, // light gray
  0xc0c0c0, // metallic silver
  0x8b4513, // saddle brown  
  0x5d8aa8, // steel blue
  0x4682b4, // moderate blue
  0x708090, // slate gray
  0xb0c4de, // light steel blue
  0xf4a460, // sandy  
  0xd2b48c, // tan
  0xa0522d, // sienna  
  0x556b2f, // dark olive green  
  0x6b8e23, // olive drab
  0x2f4f4f, // dark slate gray
  0x468499  // teal gray
];


  const mainColor = buildingColors[Math.floor(Math.random() * buildingColors.length)];
  
  const mainGeometry = new THREE.BoxGeometry(width, height - 1, depth);
  const mainMaterial = new THREE.MeshStandardMaterial({ 
    color: mainColor,
    roughness: 0.7,
    metalness: 0.2
  });
  const mainBuilding = new THREE.Mesh(mainGeometry, mainMaterial);
  mainBuilding.position.y = 0.5;  
  building.add(mainBuilding);
  
  if (borderDesignType !== 0) {
  for (let floor = 1; floor < floors; floor++) {
    const borderY = -height / 2 + floor * floorHeight;
    let borderGeometry, borderMaterial;

    switch (borderDesignType) {
      case 1: // Metallic thin line
        borderGeometry = new THREE.BoxGeometry(width * 1.01, 0.1, depth * 1.01);
        borderMaterial = new THREE.MeshStandardMaterial({
          color: 0x333333,
          metalness: 0.3,
          roughness: 0.7
        });
        break;

      case 2: // Neon glow strip
        borderGeometry = new THREE.BoxGeometry(width * 1.02, 0.05, depth * 1.02);
        borderMaterial = new THREE.MeshStandardMaterial({
          color: 0x00ffff,
          emissive: 0x00ffff,
          emissiveIntensity: 1.2,
          metalness: 0.6,
          roughness: 0.1
        });
        break;

      case 3: // Inset groove
        borderGeometry = new THREE.BoxGeometry(width * 0.95, 0.05, depth * 0.95);
        borderMaterial = new THREE.MeshStandardMaterial({
          color: 0x000000,
          roughness: 1
        });
        break;

      case 4: // Pipe ring
        borderGeometry = new THREE.CylinderGeometry(width * 0.6, width * 0.6, 0.05, 16, 1, true);
        borderMaterial = new THREE.MeshStandardMaterial({
          color: 0x666666,
          metalness: 0.8,
          roughness: 0.3,
          side: THREE.DoubleSide
        });
        break;

      case 5: // Balcony ledge
        borderGeometry = new THREE.BoxGeometry(width * 1.2, 0.1, depth * 1.2);
        borderMaterial = new THREE.MeshStandardMaterial({
          color: 0x444444,
          metalness: 0.5,
          roughness: 0.8
        });
        break;

      case 6: // Illuminated stripe with flicker
      borderGeometry = new THREE.BoxGeometry(width * 1.05, 0.05, depth * 1.05);
      borderMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        emissive: Math.random() > 0.5 ? 0x00ffff : 0x000000,
        emissiveIntensity: 1.5,
        metalness: 0.4,
        roughness: 0.2
      });
      break;

    case 7: // Brick pattern separator
      borderGeometry = new THREE.BoxGeometry(width * 1.02, 0.15, depth * 1.02);
      borderMaterial = new THREE.MeshStandardMaterial({
        color: 0x884422,
        roughness: 0.9,
        bumpScale: 0.2
      });
      break;

    case 8: // Chrome trim
      borderGeometry = new THREE.BoxGeometry(width * 1.1, 0.05, depth * 1.1);
      borderMaterial = new THREE.MeshStandardMaterial({
        color: 0xe0e0e0,
        metalness: 1.0,
        roughness: 0.05
      });
      break;
  }
    const border = new THREE.Mesh(borderGeometry, borderMaterial);
    border.position.y = borderY;

    if (borderDesignType === 4) {
      border.rotation.x = Math.PI / 2;
    }

    building.add(border);
  }
}

  // Add windows
  const windowColor = 0x1a2b3c;
  const windowMaterial = new THREE.MeshStandardMaterial({
    color: windowColor,
    emissive: Math.random() > 0.7 ? 0x444444 : 0x111111,
    emissiveIntensity: 0.3,
    metalness: 0.9,
    roughness: 0.1
  });
  
  const windowWidth = width * 0.8;
  const windowDepth = 0.2;
  const windowHeight = floorHeight * 0.7;
  for (let floor = 0; floor < floors; floor++) {
    const windowsPerFloor = 2 + Math.floor(Math.random() * 3);
    const windowSpacing = depth / (windowsPerFloor + 1);
    
    for (let i = 0; i < windowsPerFloor; i++) {
      const windowGeometry = new THREE.BoxGeometry(
        windowWidth * (0.7 + Math.random() * 0.3),
        windowHeight,
        windowDepth
      );
      
      const window = new THREE.Mesh(windowGeometry, windowMaterial);
      window.position.set(
        0,
        -height/2 + (floor + 0.5) * floorHeight,
        -depth/2 + (i + 1) * windowSpacing
      );
      if (Math.random() > 0.8) {
        window.rotation.y = Math.PI * 0.4 * (Math.random() > 0.5 ? 1 : -1);
      }
      
      building.add(window);
    }
  }
  if (Math.random() > 0.7) {
    const roofType = Math.floor(Math.random() * 3);
    
    if (roofType === 0) {
      const acGeometry = new THREE.BoxGeometry(width * 0.2, 0.5, depth * 0.2);
      const acMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
      for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) {
        const ac = new THREE.Mesh(acGeometry, acMaterial);
        ac.position.set(
          (Math.random() - 0.5) * width * 0.7,
          height/2 - 0.25,
          (Math.random() - 0.5) * depth * 0.7
        );
        building.add(ac);
      }
    } 
    else if (roofType === 1) {
      const roofGeometry = new THREE.ConeGeometry(width * 0.8, 2, 4);
      const roofMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x333333,
        roughness: 0.9
      });
      const roof = new THREE.Mesh(roofGeometry, roofMaterial);
      roof.position.y = height/2 - 1;
      roof.rotation.y = Math.PI/4;
      building.add(roof);
    } 
    else {
      const terraceGeometry = new THREE.BoxGeometry(width * 0.9, 0.5, depth * 0.5);
      const terraceMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x4a7023,
        roughness: 0.9
      });
      const terrace = new THREE.Mesh(terraceGeometry, terraceMaterial);
      terrace.position.set(0, height/2 - 0.25, depth * 0.25);
      building.add(terrace);
    }
  }
  if (Math.random() > 0.5) {
    const entranceWidth = width * 0.6;
    const entranceHeight = floorHeight * 1.2;
    const entranceGeometry = new THREE.BoxGeometry(entranceWidth, entranceHeight, 1);
    const entranceMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x333333,
      metalness: 0.5
    });
    const entrance = new THREE.Mesh(entranceGeometry, entranceMaterial);
    entrance.position.set(
      0,
      -height/2 + entranceHeight/2,
      depth/2 - 0.1
    );
    building.add(entrance);
    const doorGeometry = new THREE.BoxGeometry(entranceWidth * 0.8, entranceHeight * 0.9, 0.2);
    const doorMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x654321,
      roughness: 0.3
    });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(
      0,
      -height/2 + entranceHeight * 0.55,
      depth/2 + 0.1
    );
    building.add(door);
  }
  building.traverse(child => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  
  scene.add(building);
  return building;
}
 
const buildingSpacing = 25;
const buildingCount = 10;
const leftBuildings = [];
const rightBuildings = [];

for (let i = 0; i < buildingCount; i++) {
  const z = -i * buildingSpacing -1;
  const height = 8 + Math.random() * 15;
  const leftX = -8 - Math.random() * 4;
  const left = createRealisticBuilding(leftX, z, height);
  leftBuildings.push(left);
  
  const rightX = 8 + Math.random() * 4;
  const right = createRealisticBuilding(rightX, z, height);
  rightBuildings.push(right);
}

function recycleBuildings(playerZ) {
  const buildingLength = 25;  
  for (let building of [...leftBuildings, ...rightBuildings]) {
    if (building.position.z - playerZ > buildingLength) {
      building.position.z -= buildingCount * buildingSpacing;
      const newHeight = 8 + Math.random() * 15;
      building.position.y = newHeight / 2; 
      building.children.forEach(child => {
        if (child === building.children[0]) 
          { 
          child.position.y = -newHeight/2 + 0.25;
        }
         else if (child === building.children[1])
           { 
          child.scale.y = (newHeight - 1) / (building.children[1].geometry.parameters.height);
          child.position.y = 0.5;  
        } 
        else
         {
          if (child.userData.isWindow) {
            const floorHeight = (newHeight - 1) / Math.floor((newHeight - 1) / 3);
            const floorIndex = child.userData.floorIndex;
            child.position.y = -newHeight/2 + (floorIndex + 0.5) * floorHeight;
          }
        }
      });
      building.traverse(child => {
        if (child.material && child.material.emissive) {
          child.material.emissive.setHex(Math.random() > 0.7 ? 0xffff99 : 0x111111);
          child.material.emissiveIntensity = Math.random() > 0.7 ? 0.5 : 0.1;
        }
      });
    }
  }
}
const messages = {
  low: [
    "Did you even try? 😅",
    "Blink and it's over! 😂",
    "Gravity: 1, You: 0 🪂",
    "That was... quick. 🍃"
  ],
  mid: [
    "You're warming up! 🔥",
    "A decent effort! 💪",
    "Try again — greatness awaits! ⭐",
    "Keep swinging, future pro! 🕸️"
  ],
  high: [
    "Now we're talking! ⚡",
    "Solid run! You're improving. 🚀",
    "The path to glory is near! 🏃‍♂️💨",
    "Skill + momentum = 🔥"
  ],
  elite: [
    "You're a legend! 🚀",
    "Unstoppable! 🌟",
    "High-flyer vibes! 🎈",
    "Epic! We felt that from orbit 🛰️"
  ],
  god: [
    "God-tier. 💥",
    "Record-shattering performance! 📊",
    "Write your name in the stars 🌠",
    "You broke the game! 👑",
   "You Are challenging the Developer"
  ]
};

let msg = "";
let startTime;
 player.velocity = new THREE.Vector3(); 
   let lastX = player.position.x;
let sameLaneTimer = 0;
let laneWarned = false;

function updateLaneMonitor(deltaTime) {
  if (Math.abs(player.position.x - lastX) < 0.1) {
    sameLaneTimer += deltaTime;
  } else {
    sameLaneTimer = 0;
    laneWarned = false;
    lastX = player.position.x;
  }

  if (sameLaneTimer > 7 && !laneWarned) {
    showAINotification("🤖 Try switching lanes for better control!", 'rgba(255, 255, 0, 0.25)'); // 🟨 Yellow BG
    laneWarned = true;

    setTimeout(() => laneWarned = false, 2000);
  }
}
function animate() {
  requestAnimationFrame(animate);
  if (gameOver) return;
recycleBuildings(player.position.z);
const deltaTime = clock.getDelta(); // in seconds

  updateLaneMonitor(deltaTime);
  updatePlayer();
  if (Math.abs(player.position.x) > 4) {
    player.position.y -= 0.05;
    camera.position.y -= 0.05;  
    // In the game over conditions (both falling off and collision):
    if (player.position.y < -5 ) {
  const gameOverScreen = document.getElementById('gameOverScreen');
  const finalScore = document.getElementById('finalScore');
  const highScoreDisplay = document.getElementById('highScoreDisplay');
  
  finalScore.textContent = `Your Score: ${distance} m`;
  gameOverScreen.style.display = 'flex';
  document.getElementById('scoreboard').style.display = 'none';
  gameOver = true;
 if (distance < 1000) msg = messages.low[Math.floor(Math.random() * messages.low.length)];
else if (distance < 2000) msg = messages.mid[Math.floor(Math.random() * messages.mid.length)];
else if (distance < 3000) msg = messages.high[Math.floor(Math.random() * messages.high.length)];
else if (distance < 4000) msg = messages.elite[Math.floor(Math.random() * messages.elite.length)];
else msg = messages.god[Math.floor(Math.random() * messages.god.length)];

document.getElementById("message").innerHTML = msg;   

   const timeSurvived = Math.floor((performance.now() - startTime) / 1000);
const minutes = Math.floor(timeSurvived / 60);
const seconds = timeSurvived % 60;
const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
document.getElementById('time-survived').textContent = `🕒 Time Survived: ${formattedTime} sec`;
  fetchHighScore().then(() => {
    if (distance > highScore) {
      highScore = distance;
      sendNewScore(highScore);
      highScoreDisplay.innerText = `High Score: ${highScore}m`;
    }  
  });
}




}
 camera.position.z = player.position.z + 20;
camera.position.x = player.position.x;
// Make camera look slightly downward when player is falling
if (player.position.y < 0.5) {
  camera.lookAt(player.position.x, player.position.y - 2, player.position.z);
} else {
  camera.lookAt(player.position.x, player.position.y, player.position.z);
}

 for (let obstacle of obstacles) {
    if (obstacle.userData.isMoving) {
        const { direction, speed, range, baseX, repulsionForce } = obstacle.userData;
        let totalRepulsion = 0;
        for (let other of obstacles) {
            if (other === obstacle) continue;
            const dx = obstacle.position.x - other.position.x;
            const dz = Math.abs(obstacle.position.z - other.position.z);
            if (dz < 1.2 && Math.abs(dx) < 1.6 && Math.abs(dx) > 0.001) {
                const pushDirection = dx < 0 ? -1 : 1;
                const strength = (1.6 - Math.abs(dx)) / (1.6 + 0.001);
                let otherRepulsionForce;
                if (other.userData.isMoving) {
                    otherRepulsionForce = repulsionForce;
                } else {
                    otherRepulsionForce = repulsionForce * 0.6;  
                }
                totalRepulsion += pushDirection * otherRepulsionForce * strength;
            }
        }
        const moveX = direction * speed + totalRepulsion;
        obstacle.position.x += moveX;
        obstacle.position.x = Math.max(-3.5, Math.min(3.5, obstacle.position.x));
        const offset = obstacle.position.x - baseX;
        if (Math.abs(offset) > range || Math.abs(totalRepulsion) > speed * 1.5) {
            obstacle.userData.direction *= -1;
            obstacle.userData.baseX = obstacle.position.x;
        }
    } else {
        let totalRepulsion = 0;
        for (let other of obstacles) {
            if (other === obstacle || !other.userData.isMoving) continue;
            const dx = obstacle.position.x - other.position.x;
            const dz = Math.abs(obstacle.position.z - other.position.z);
         
            if (dz < 1.2 && Math.abs(dx) < 1.6 && Math.abs(dx) > 0.001) {
                const pushDirection = dx < 0 ? -1 : 1;
                const strength = (1.6 - Math.abs(dx)) / (1.6 + 0.001);
                const repulsionForce = other.userData.repulsionForce * 0.6; // Moving obstacles repel static obstacles
                totalRepulsion += pushDirection * repulsionForce * strength;
            }
        }
         
        obstacle.position.x += totalRepulsion * 0.5; 
        obstacle.position.x = Math.max(-3.5, Math.min(3.5, obstacle.position.x));
    }
}



  recycleTiles();
  recycleObstacles();

  const playerBox = new THREE.Box3().setFromObject(player);
  let collisionDetected = obstacles.some((obstacle, index) => {
  const obstacleBox = new THREE.Box3().setFromObject(obstacle);
  if (playerBox.intersectsBox(obstacleBox)) {
    const playerBottom = player.position.y - 0.5;
    const obstacleTop = obstacle.position.y + 0.5;
    if (playerBottom <= obstacleTop) {
      const dx = player.position.x - obstacle.position.x;
      if (Math.abs(dx) < 0.5) {
        if (dx < 0) {
          player.position.x = obstacle.position.x - 0.5;
        } else {
          player.position.x = obstacle.position.x + 0.5;
        }
      }
      return true;
    }
  }

  for (let i = index + 1; i < obstacles.length; i++) {
    const otherObstacle = obstacles[i];
    const otherObstacleBox = new THREE.Box3().setFromObject(otherObstacle);
    if (obstacleBox.intersectsBox(otherObstacleBox)) {
      const overlap = obstacleBox.intersect(otherObstacleBox);
      const overlapSize = new THREE.Vector3();
      overlap.getSize(overlapSize);
      const dx = obstacle.position.x - otherObstacle.position.x;
      if (Math.abs(dx) < overlapSize.x) {
        if (dx < 0) {
          obstacle.position.x -= overlapSize.x / 2;
          otherObstacle.position.x += overlapSize.x / 2;
        } else {
          obstacle.position.x += overlapSize.x / 2;
          otherObstacle.position.x -= overlapSize.x / 2;
        }
      }
    }
  }

  return false;
});


  if (collisionDetected) {
    const gameOverScreen = document.getElementById('gameOverScreen');
    const finalScore = document.getElementById('finalScore');
    finalScore.textContent = `Your Score: ${distance} m`;
    gameOverScreen.style.display = 'flex';
    document.getElementById('scoreboard').style.display = 'none';
    
    gameOver = true;
    if (distance < 1000) msg = messages.low[Math.floor(Math.random() * messages.low.length)];
else if (distance < 2000) msg = messages.mid[Math.floor(Math.random() * messages.mid.length)];
else if (distance < 3000) msg = messages.high[Math.floor(Math.random() * messages.high.length)];
else if (distance < 4000) msg = messages.elite[Math.floor(Math.random() * messages.elite.length)];
else msg = messages.god[Math.floor(Math.random() * messages.god.length)];

document.getElementById("message").innerHTML = msg;
    const timeSurvived = Math.floor((performance.now() - startTime) / 1000);
const minutes = Math.floor(timeSurvived / 60);
const seconds = timeSurvived % 60;
const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
document.getElementById('time-survived').textContent = `🕒 Time Survived: ${formattedTime} sec`;
    sendNewScore(distance);
    
    return;
  }
  

  camera.position.z = player.position.z + 5;
  camera.position.x = player.position.x;
  camera.lookAt(player.position.x, 1, player.position.z);
distance = Math.floor((initialPlayerPosition - player.position.z) * 5);
  document.getElementById('scoreboard').innerText = `Distance: ${distance} m`;
const timeToActivateMoving = 5; // seconds
const movingObstacleCap = 2; // max active moving obstacles
const currentTime = performance.now() / 1000;

if (currentTime > timeToActivateMoving) {
  let activeMoving = 0;

  for (let obs of obstacles) {
    if (activeMoving >= movingObstacleCap) break;

   if (!obs.userData.isMoving && obs.userData.willMoveLater && Math.random() < 0.04) { // low chance to activate
      obs.userData = {
        direction: Math.random() > 0.5 ? 1 : -1,
        speed: 0.02 + Math.random() * 0.02,
        range: 2,
        baseX: obs.position.x,
        isMoving: true,
        repulsionForce: 0.05
      };
      obs.material.color.setHex(0xff0000);
      activeMoving++;
    }
  }
}
 const aiMessages = {
  left: { text: "You're drifting too much left!", color: 'rgba(255, 0, 0, 0.2)' },
  right: { text: "You're drifting too much right!", color: 'rgba(0, 0, 255, 0.2)' }
};

if (player.position.x < -3 && !alreadyWarned) {
  const msg = aiMessages.left;
  showAINotification(msg.text, msg.color);
  alreadyWarned = true;
  setTimeout(() => alreadyWarned = false, 2000);
}
  if (player.position.x > 3 && !alreadyWarnedRight) {
    const msg = aiMessages.right;
  showAINotification(msg.text, msg.color);
  alreadyWarnedRight = true;
  setTimeout(() => alreadyWarnedRight = false, 2000);
  }

   renderer.render(scene, camera);
  
}

animate()

export default function initGame() {
  const THREE = window.THREE;
   fetchHighScore();
 startTime = performance.now();
setTimeout(() => showAINotification("🎮 Game Started – Good luck!", "rgba(0, 255, 100, 0.2)"), 1000);
  // your game initialization code here...
}


window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
