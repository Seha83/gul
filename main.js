import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);

const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 1.4, 4);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// Işıklar
scene.add(new THREE.HemisphereLight(0xffffff, 0x222222, 1.2));

const key = new THREE.DirectionalLight(0xffffff, 2);
key.position.set(5, 6, 5);
scene.add(key);

// Mesajı kaldır
setTimeout(() => {
  const msg = document.getElementById("message");
  if (msg) msg.classList.add("hide");
}, 3000);

// Model yükle
const loader = new GLTFLoader();
let rose;

loader.load(
  "./rose.glb",
  (gltf) => {
    rose = gltf.scene;
    scene.add(rose);

    const box = new THREE.Box3().setFromObject(rose);
    const size = new THREE.Vector3();
    box.getSize(size);

    const max = Math.max(size.x, size.y, size.z);
    rose.scale.setScalar(2.2 / max);
    rose.position.y = -0.8;
  },
  undefined,
  (err) => console.error("Model yüklenemedi:", err)
);

function animate() {
  requestAnimationFrame(animate);
  if (rose) rose.rotation.y += 0.003;
  renderer.render(scene, camera);
}
animate();

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
