import * as THREE from 'three';

const obstacleGeometry = new THREE.BoxGeometry(1, 1, 1);
const obstacleMaterial = new THREE.MeshStandardMaterial({ color: 'red' });
const obstacles = [];

export function createObstacle(x, z) {
  const mesh = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
  mesh.position.set(x, 0.5, z);
  obstacles.push(mesh);
  return mesh;
}

export function updateObstacles(player) {
  for (const obs of obstacles) {
    const dx = player.position.x - obs.position.x;
    const dy = player.position.y - obs.position.y;
    const dz = player.position.z - obs.position.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (dist < 0.8) {
      alert('💥 Game Over!');
      window.location.reload();
    }
  }
}