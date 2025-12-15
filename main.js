// ✅ Tamamen URL import: importmap/bare-import yok
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/DRACOLoader.js';

// ---- Sol üst durum paneli
const panel = document.createElement('div');
panel.style.cssText = `
  position:fixed; left:12px; top:12px; z-index:99999;
  color:#eaeaea; font:13px/1.35 system-ui;
  background:rgba(0,0,0,.60); padding:10px 12px; border-radius:12px;
  max-width:min(520px, 92vw); white-space:pre-wrap;`;
panel.textContent = 'Başlatılıyor...';
document.body.appendChild(panel);

const setStatus = (t) => (panel.textContent = t);
const addStatus = (t) => (panel.textContent = t + '\n\n' + panel.textContent);

window.addEventListener('error', (e) => addStatus('JS Hatası: ' + e.message));
window.addEventListener('unhandledrejection', (e) => addStatus('Promise Hatası: ' + (e.reason?.message || e.reason)));

// ---- Mesajı KESİN kaldır (artık index.html içinden kaldırmıyoruz)
function hideMessageAfter(ms = 3200) {
  setTimeout(() => {
    const msg = document.getElementById('message');
    if (!msg) return;
    msg.classList.add('hide');
    setTimeout(() => msg.remove(), 1700);
  }, ms);
}
hideMessageAfter(3200);

// ---- Three sahnesi
setStatus('main.js çalıştı ✅\nThree.js hazır ✅\nSahne hazırlanıyor...');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);

const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.05, 500);
camera.position.set(0, 1.35, 4.3);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

// Işıklar (daha “stüdyo” hissi)
scene.add(new THREE.HemisphereLight(0xffffff, 0x222222, 1.0));

const key = new THREE.DirectionalLight(0xffffff, 2.2);
key.position.set(6, 10, 6);
scene.add(key);

const fill = new THREE.DirectionalLight(0xfff0f0, 0.75);
fill.position.set(-6, 4, 6);
scene.add(fill);

const rim = new THREE.DirectionalLight(0xffaaaa, 1.0);
rim.position.set(-8, 4, -8);
scene.add(rim);

// Zemin
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(50, 50),
  new THREE.MeshStandardMaterial({ color: 0x0b0b0b, roughness: 0.95, metalness: 0.0 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -1.05;
scene.add(ground);

// Loader
const loader = new GLTFLoader();
const draco = new DRACOLoader();
draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/');
loader.setDRACOLoader(draco);

let rose = null;
let fitScale = 1;
let t = 0;

setStatus('main.js çalıştı ✅\nThree.js hazır ✅\nrose.glb yükleniyor...');

loader.load(
  './rose.glb',
  (gltf) => {
    rose = gltf.scene;
    scene.add(rose);

    // Modeli ortala + ekrana sığdır
    const box = new THREE.Box3().setFromObject(rose);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    rose.position.sub(center);

    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    fitScale = 2.2 / maxDim;

    // Başlangıçta küçük (yoktan var)
    rose.scale.setScalar(fitScale * 0.10);

    setStatus(
      'Model yüklendi ✅\n' +
      `Boyut: x=${size.x.toFixed(2)} y=${size.y.toFixed(2)} z=${size.z.toFixed(2)}\n` +
      'Animasyon başlıyor...'
    );

    // Paneli biraz sonra sil (istersen)
    setTimeout(() => { panel.style.opacity = '0.15'; }, 6000);
  },
  (xhr) => {
    if (xhr.total) {
      const pct = Math.round((xhr.loaded / xhr.total) * 100);
      setStatus(`main.js çalıştı ✅\nGül yükleniyor... %${pct}`);
    }
  },
  (err) => {
    console.error(err);
    setStatus(
      'Model yüklenemedi ❌\n\nKontrol et:\n- rose.glb dosyası repo kökünde mi?\n- Dosya adı tam "rose.glb" mi?\n- Linkten rose.glb indirilebiliyor mu?\n'
    );
  }
);

// Animasyon
function animate() {
  requestAnimationFrame(animate);

  if (rose) {
    t += 0.01;
    const p = Math.min(t, 1);
    const ease = 1 - Math.pow(1 - p, 3);

    // Yoktan var: büyüme + yükselme + hafif dönüş
    const s = 0.10 + ease * 0.95;
    rose.scale.setScalar(fitScale * s);
    rose.rotation.y += 0.004;
    rose.position.y = -0.9 + ease * 0.8;
  }

  camera.lookAt(0, 0.65, 0);
  renderer.render(scene, camera);
}
animate();

// Resize
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
