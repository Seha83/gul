// CDN'den Three.js ve GLTFLoader'ı sırayla dene
async function tryImport(urls) {
  let lastErr;
  for (const u of urls) {
    try {
      return await import(u);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("Import başarısız");
}

(async () => {
  try {
    // 1) THREE modülü
    const THREE = await tryImport([
      "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
      "https://unpkg.com/three@0.160.0/build/three.module.js",
      "https://esm.sh/three@0.160.0"
    ]);

    // 2) GLTFLoader
    const gltfMod = await tryImport([
      "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js",
      "https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js",
      "https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js"
    ]);
    const { GLTFLoader } = gltfMod;

    // ---------- SAHNE ----------
    const scene = new THREE.Scene();

    // Koyu orman yeşili arka plan + sis
    const forestColor = 0x0b2610;
    scene.background = new THREE.Color(forestColor);
    scene.fog = new THREE.Fog(forestColor, 6, 20);

    const camera = new THREE.PerspectiveCamera(
      45,
      innerWidth / innerHeight,
      0.05,
      500
    );
    camera.position.set(0, 1.4, 4.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    if (THREE.SRGBColorSpace) {
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    }
    document.body.appendChild(renderer.domElement);

    // ---------- IŞIKLAR ----------
    scene.add(new THREE.HemisphereLight(0xe8ffe8, 0x102010, 1.2)); // yeşilimsi ortam ışığı

    const key = new THREE.DirectionalLight(0xffffff, 2.1);
    key.position.set(6, 10, 6);
    scene.add(key);

    const rim = new THREE.DirectionalLight(0xffc0aa, 0.9);
    rim.position.set(-8, 4, -8);
    scene.add(rim);

    // ---------- ZEMİN (ÇİM TONU) ----------
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 80),
      new THREE.MeshStandardMaterial({
        color: 0x25652a, // çim yeşili
        roughness: 0.95,
        metalness: 0.0
      })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.1;
    scene.add(ground);

    // ---------- ÇİMENLER ----------
    const grassGeometry = new THREE.PlaneGeometry(0.05, 0.35, 1, 1);
    // dipten çıksın diye yukarı kaydır
    grassGeometry.translate(0, 0.175, 0);

    const grassMaterial = new THREE.MeshStandardMaterial({
      color: 0x3fa34d,
      side: THREE.DoubleSide
    });

    const grassCount = 1800;
    const grass = new THREE.InstancedMesh(
      grassGeometry,
      grassMaterial,
      grassCount
    );
    const dummy = new THREE.Object3D();

    for (let i = 0; i < grassCount; i++) {
      const radius = 0.6 + Math.random() * 2.2;  // gülün etrafında halka
      const angle = Math.random() * Math.PI * 2;

      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      dummy.position.set(x, -1.1, z);
      dummy.rotation.y = Math.random() * Math.PI;
      const s = 0.8 + Math.random() * 0.8;
      dummy.scale.set(s, 1 + Math.random() * 0.8, s);

      dummy.updateMatrix();
      grass.setMatrixAt(i, dummy.matrix);
    }

    scene.add(grass);

    let windTime = 0;

    // ---------- GÜL MODELİ ----------
    const loader = new GLTFLoader();
    let rose = null;
    let fit = 1;
    let t = 0;

    loader.load(
      "./rose.glb",
      (gltf) => {
        rose = gltf.scene;
        scene.add(rose);

        // Modeli ortala ve ekrana sığdır
        const box = new THREE.Box3().setFromObject(rose);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);

        // Ortala
        rose.position.sub(center);

        // Boyuta göre ölçek
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        fit = 2.2 / maxDim;

        // Başlangıçta küçük (yoktan var)
        rose.scale.setScalar(fit * 0.1);

        // Tam sahne ortasında dursun
        rose.position.set(0, 0, 0);

        // Kamera tam merkeze baksın
        camera.lookAt(0, 0, 0);
      },
      undefined,
      (err) => {
        console.error("rose.glb yüklenemedi:", err);
      }
    );

    // ---------- ANİMASYON ----------
    function animate() {
      requestAnimationFrame(animate);

      // Gül animasyonu
      if (rose) {
        t += 0.01;
        const p = Math.min(t, 1);
        const ease = 1 - Math.pow(1 - p, 3); // yumuşak geçiş

        // Yoktan var büyüme
        const scaleFactor = 0.1 + ease * 0.95;
        rose.scale.setScalar(fit * scaleFactor);

        // Hafif dönüş
        rose.rotation.y += 0.004;
      }

      // Çimenlere hafif rüzgar
      windTime += 0.01;
      for (let i = 0; i < grass.count; i++) {
        grass.getMatrixAt(i, dummy.matrix);
        // z ekseninde hafif eğilme
        dummy.rotation.z = Math.sin(windTime + i * 0.15) * 0.12;
        dummy.updateMatrix();
        grass.setMatrixAt(i, dummy.matrix);
      }
      grass.instanceMatrix.needsUpdate = true;

      renderer.render(scene, camera);
    }
    animate();

    // ---------- PENCERE BOYUTU DEĞİŞİNCE ----------
    addEventListener("resize", () => {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
    });
  } catch (e) {
    console.error("Three.js kurulumu hata verdi:", e);
  }
})();
