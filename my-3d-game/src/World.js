import * as THREE from 'three';

export function World() {
  const scene = new THREE.Scene();

scene.background = new THREE.Color(0xC9E4CA);


  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
   camera.position.set(0, 2, 5);
camera.lookAt(0, 0.5, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Add light
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 10, 5);
  scene.add(light);

  // Add ground
  
  return { scene, camera, renderer };
}