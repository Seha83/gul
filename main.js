const st = document.getElementById('status');
const log = (t) => (st.textContent = t + "\n\n" + st.textContent);

(async () => {
  try {
    log("Three.js indiriliyor...");

    // ✅ Static import yok -> hatayı yakalayabiliyoruz
    const THREE = await import("https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js");
    const { GLTFLoader } = await import("https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js");
    const { DRACOLoader } = await import("https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/DRACOLoader.js");

    log("Three.js hazır ✅ Sahne kuruluyor...");

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);

    const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.05, 500);
    camera.position.set(0, 1.35, 4.3);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    document.body.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x222222, 1.2));
    const key = new THREE.DirectionalLight(0xffffff, 2.0);
    key.position.set(6, 10, 6);
    scene.add(key);

    log("rose.glb yükleniyor...");

    const loader = new GLTFLoader();
    const draco = new DRACOLoader();
    draco.setDecoderPath("https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/");
    loader.setDRACOLoader(draco);

    let rose = null;
    let fit = 1;
    let t = 0;

    loader.load(
      "./rose.glb",
      (gltf) => {
        rose = gltf.scene;
        scene.add(rose);

        // otomatik ortala/ölçekle
        const box = new THREE.Box3().setFromObject(rose);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);

        rose.position.sub(center);

        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        fit = 2.2 / maxDim;
        rose.scale.setScalar(fit * 0.1);
        rose.position.y = -0.9;

        log("Model yüklendi ✅ Animasyon başlıyor...");
      },
      (xhr) => {
        if (xhr.total) {
          const pct = Math.round((xhr.loaded / xhr.total) * 100);
          log("Gül yükleniyor... %" + pct);
        }
      },
      (err) => {
        console.error(err);
        log("Model yüklenemedi ❌\n" + (err?.message || err));
      }
    );

    function animate() {
      requestAnimationFrame(animate);
      if (rose) {
        t += 0.01;
        const p = Math.min(t, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        rose.scale.setScalar(fit * (0.1 + ease * 0.95));
        rose.rotation.y += 0.004;
      }
      camera.lookAt(0, 0.6, 0);
      renderer.render(scene, camera);
    }
    animate();

    addEventListener("resize", () => {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
    });

  } catch (e) {
    console.error(e);
    log("Three.js kurulumu hata verdi ❌\n" + (e?.message || e));
  }
})();
