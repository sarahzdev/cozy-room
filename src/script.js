import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import GUI from "lil-gui";

/**
 * Loaders
 */
// Texture loader
const textureLoader = new THREE.TextureLoader();

// Draco loader
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("draco/");

// GLTF loader
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

/**
 * Base
 */
// Debug
const gui = new GUI();

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

/**
 * Textures
 */
const bakedRoomTexture = textureLoader.load("room-baked.jpg");
bakedRoomTexture.flipY = false;
bakedRoomTexture.colorSpace = THREE.SRGBColorSpace;
bakedRoomTexture.magFilter = THREE.NearestFilter;
bakedRoomTexture.minFilter = THREE.NearestFilter;

const bakedBooksTexture = textureLoader.load("books-baked-1.jpg");
bakedBooksTexture.flipY = false;
bakedBooksTexture.colorSpace = THREE.SRGBColorSpace;
bakedRoomTexture.magFilter = THREE.NearestFilter;
bakedRoomTexture.minFilter = THREE.NearestFilter;

const bakedBooks2Texture = textureLoader.load("books-baked-2.jpg");
bakedBooks2Texture.flipY = false;
bakedBooks2Texture.colorSpace = THREE.SRGBColorSpace;
bakedBooks2Texture.magFilter = THREE.NearestFilter;
bakedBooks2Texture.minFilter = THREE.NearestFilter;

/**
 * Materials
 */
// Baked material
const bakedRoomMaterial = new THREE.MeshBasicMaterial({
  map: bakedRoomTexture,
});

const bakedBooksMaterial = new THREE.MeshBasicMaterial({
  map: bakedBooksTexture,
});

const bakedBooks2Material = new THREE.MeshBasicMaterial({
  map: bakedBooks2Texture,
});

/**
 * Models
 */
let mixer = null;

gltfLoader.load("room.glb", (gltf) => {
  gltf.scene.traverse((child) => {
    child.material = bakedRoomMaterial;
  });
  scene.add(gltf.scene);
});

gltfLoader.load("books-1.glb", (gltf) => {
  gltf.scene.traverse((child) => {
    child.material = bakedBooksMaterial;
  });
  scene.add(gltf.scene);
});

gltfLoader.load("books-2.glb", (gltf) => {
  gltf.scene.traverse((child) => {
    child.material = bakedBooks2Material;
  });
  scene.add(gltf.scene);
});

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(window.devicePixelRatio);
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  25,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(8, 4, 8);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.maxPolarAngle = Math.PI / 2;
controls.minAzimuthAngle = 0;
controls.maxAzimuthAngle = Math.PI / 2;
controls.maxDistance = 20;
controls.enableDamping = true;
controls.target.set(0, 1, 0);

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(window.devicePixelRatio);

/**
 * Animate
 */
const clock = new THREE.Clock();
let previousTime = 0;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime;
  previousTime = elapsedTime;

  if (mixer) {
    mixer.update(deltaTime);
  }

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
