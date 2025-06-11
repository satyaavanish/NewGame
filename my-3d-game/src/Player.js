import * as THREE from 'three';

function createStripedTexture() {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Background color
  ctx.fillStyle = 'green'; // Pastel pink
  ctx.fillRect(0, 0, size, size);

  // Draw vertical stripes
  const stripeWidth = 40;
  ctx.fillStyle = '#66cccc'; // Soft blue
  for (let x = 0; x < size; x += stripeWidth * 2) {
    ctx.fillRect(x, 0, stripeWidth, size);
  }

  return new THREE.CanvasTexture(canvas);
}

export function createPlayer(scene) {
  const geometry = new THREE.SphereGeometry(0.4, 64, 64);
  const material = new THREE.MeshStandardMaterial({
    map: createStripedTexture(),
    roughness: 0.7,
    metalness: 0.1,
    side: THREE.DoubleSide,
    emissive: 'black', // Soft blue
    emissiveIntensity: 0.2
  });
  const player = new THREE.Mesh(geometry, material);
  player.position.set(0, 1, 0);
  player.castShadow = true;
  scene.add(player);
  return player;
}