async function tryImport(urls) {
  let lastErr;
  for (const u of urls) {
    try { return await import(u); }
    catch (e) { lastErr = e; }
  }
  throw lastErr || new Error("Import başarısız");
}

(async () => {
  try {
    // THREE + Loader'ları yedekli indir
    const THREE = await tryImport([
      "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
      "https://unpkg.com/three@0.160.0/build/three.module.js",
      "https://esm.sh/three@0.160.0"
    ]);

    const gltfMod = await tryImport([
      "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js",
      "https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js",
      "https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js"
    ]);

    const { GLTFLoader } = gltfMod;

    // Sahne
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);

    const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.05, 500);
    camera.position.set(0, 1.2, 4.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    document.body.appendChild(renderer.domElement);

    // Işıklar (güzel ve basit)
    scene.add(new THREE.HemisphereLight(0xffffff, 0x202020, 1.2));

    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(6, 10, 6);
    scene.add(key);

    const rim = new THREE.DirectionalLight(0xffaaaa, 1.0);
    rim.position.set(-8, 4, -8);
    scene.add(rim);

    // Zemin
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60),
      new THREE.MeshStandardMaterial({ color: 0x0b0b0b, roughness: 0.95, metalness: 0.0 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.1;
    scene.add(ground);

    // Model yükle
    const loader = new GLTFLoader();

    let rose = null;
    let fit = 1;
    let t = 0;

    loader.load(
      "./rose.glb",
      (gltf) => {
        rose = gltf.scene;
        scene.add(rose);

        // Otomatik ortala
        const box = new THREE.Box3().setFromObject(rose);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);

        rose.position.sub(center);

        // Ekrana sığdır
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        fit = 2.2 / maxDim;

        // Başlangıç küçük (yoktan var)
        rose.scale.setScalar(fit * 0.1);

        // ✅ Tam ortada
        rose.position.set(0, 0, 0);

        // Kamera tam merkeze baksın
        camera.lookAt(0, 0, 0);
      },
      undefined,
      (err) => {
        console.error("rose.glb yüklenemedi:", err);
      }
    );

    function animate() {
      requestAnimationFrame(animate);

      if (rose) {
        t += 0.01;
        const p = Math.min(t, 1);
        const ease = 1 - Math.pow(1 - p, 3);

        // Yoktan var büyüme
        rose.scale.setScalar(fit * (0.1 + ease * 0.95));

        // Hafif dönüş
        rose.rotation.y += 0.004;
      }

      renderer.render(scene, camera);
    }
    animate();

    addEventListener("resize", () => {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
    });

  } catch (e) {
    // Panel yok: hata sadece console’da
    console.error("Three.js kurulumu hata verdi:", e);
  }
})();
