import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
// import GUI from "lil-gui";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutlinePass } from "three/addons/postprocessing/OutlinePass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { FXAAShader } from "three/addons/shaders/FXAAShader.js";

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
// const gui = new GUI();

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

/**
 * Textures
 */
const bakedRoomTexture = textureLoader.load("/textures/room-baked.jpg");
bakedRoomTexture.flipY = false;
bakedRoomTexture.colorSpace = THREE.SRGBColorSpace;
bakedRoomTexture.magFilter = THREE.NearestFilter;
bakedRoomTexture.minFilter = THREE.NearestFilter;

const bakedBooksTexture = textureLoader.load("/textures/books-baked-1.jpg");
bakedBooksTexture.flipY = false;
bakedBooksTexture.colorSpace = THREE.SRGBColorSpace;
bakedRoomTexture.magFilter = THREE.NearestFilter;
bakedRoomTexture.minFilter = THREE.NearestFilter;

const bakedBooks2Texture = textureLoader.load("/textures/books-baked-2.jpg");
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

let paintings = [];
gltfLoader.load("/models/room.glb", (gltf) => {
  gltf.scene.traverse((child) => {
    child.material = bakedRoomMaterial;
  });
  scene.add(gltf.scene);

  paintings = gltf.scene.children.filter((child) =>
    child.name.startsWith("Painting")
  );
  outlinePass.selectedObjects = paintings;
});

gltfLoader.load("/models/books-1.glb", (gltf) => {
  gltf.scene.traverse((child) => {
    child.material = bakedBooksMaterial;
  });
  scene.add(gltf.scene);
});

gltfLoader.load("/models/books-2.glb", (gltf) => {
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

  // Update composer
  composer.setSize(sizes.width, sizes.height);

  effectFXAA.uniforms["resolution"].value.set(
    1 / window.innerWidth,
    1 / window.innerHeight
  );
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
 * Interact with paintings
 */
let selectedObjects = [];

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let composer = new EffectComposer(renderer);

let renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

let outlinePass = new OutlinePass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  scene,
  camera
);
textureLoader.load("/textures/tri_pattern.jpg", function (texture) {
  outlinePass.patternTexture = texture;
});
outlinePass.edgeStrength = 2;
outlinePass.edgeGlow = 1;
outlinePass.edgeThickness = 1;
outlinePass.pulsePeriod = 5;
outlinePass.visibleEdgeColor.set("#ffdc73");
outlinePass.hiddenEdgeColor.set("#9A6637");

composer.addPass(outlinePass);

let outputPass = new OutputPass();
composer.addPass(outputPass);

let effectFXAA = new ShaderPass(FXAAShader);
effectFXAA.uniforms["resolution"].value.set(
  1 / window.innerWidth,
  1 / window.innerHeight
);
composer.addPass(effectFXAA);

renderer.domElement.addEventListener("pointermove", onPointerMove);

function onPointerMove(event) {
  if (event.isPrimary === false) return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  checkIntersection();
}

function addSelectedObject(object) {
  selectedObjects = [];
  selectedObjects.push(object);
}

function checkIntersection() {
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObject(scene, true);

  if (intersects.length > 0) {
    const selectedObject = intersects[0].object;
    if (selectedObject.name.startsWith("Painting")) {
      addSelectedObject(selectedObject);
      outlinePass.selectedObjects = selectedObjects;
      renderer.domElement.style.cursor = "pointer";
    } else {
      outlinePass.selectedObjects = paintings;
      renderer.domElement.style.cursor = "default";
    }
  } else {
    outlinePass.selectedObjects = paintings;
    renderer.domElement.style.cursor = "default";
  }
}

renderer.domElement.addEventListener("pointerdown", onPointerClick);

function onPointerClick(event) {
  if (event.isPrimary === false) return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(scene, true);

  if (intersects.length > 0) {
    const clickedObject = intersects[0].object;
    if (clickedObject.name.startsWith("Painting")) {
      handlePaintingClick(clickedObject);
    }
  }
}

function handlePaintingClick(painting) {
  renderer.domElement.style.cursor = "default";
  closeBlurb();
  const paintingId = painting.name;
  const blurb = document.querySelector(`[data-painting-id="${paintingId}"]`);
  if (blurb) {
    blurb.classList.add("active");
  }
}

function closeBlurb() {
  document.querySelectorAll(".painting-blurb").forEach((blurb) => {
    blurb.classList.remove("active");
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeBlurb();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".close-btn").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      closeBlurb();
    });
  });
});

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
  composer.render();

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
