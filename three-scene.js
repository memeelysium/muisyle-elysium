import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const host = document.querySelector('.hero-visual');
if (host && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  try {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0, 7.2);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.className = 'three-cosmic-canvas';
    renderer.domElement.setAttribute('aria-hidden', 'true');
    host.prepend(renderer.domElement);

    scene.add(new THREE.AmbientLight(0x899cff, 1.25));
    const keyLight = new THREE.PointLight(0xc4d5ff, 95, 18);
    keyLight.position.set(-3.5, 3.2, 4.5);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(0x45dce9, 55, 14);
    rimLight.position.set(3, -1.5, -3);
    scene.add(rimLight);

    const planetGroup = new THREE.Group();
    scene.add(planetGroup);

    const planetGeometry = new THREE.SphereGeometry(1.48, 96, 96);
    const planetMaterial = new THREE.MeshStandardMaterial({
      color: 0x777bdc, roughness: 0.58, metalness: 0.16,
      emissive: 0x171b58, emissiveIntensity: 0.42
    });
    const planet = new THREE.Mesh(planetGeometry, planetMaterial);
    planetGroup.add(planet);

    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.53, 64, 64),
      new THREE.MeshBasicMaterial({ color: 0x8b9cff, transparent: true, opacity: 0.11, side: THREE.BackSide })
    );
    planetGroup.add(atmosphere);

    const ringMaterial = new THREE.MeshStandardMaterial({
      color: 0x8deaf0, metalness: 0.62, roughness: 0.28,
      emissive: 0x246d9a, emissiveIntensity: 0.55,
      transparent: true, opacity: 0.78, side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.05, 0.026, 8, 180), ringMaterial);
    ring.rotation.x = 1.17;
    ring.rotation.y = -0.18;
    planetGroup.add(ring);

    const outerRing = new THREE.Mesh(
      new THREE.TorusGeometry(2.32, 0.008, 6, 180),
      new THREE.MeshBasicMaterial({ color: 0x9d9aff, transparent: true, opacity: 0.48 })
    );
    outerRing.rotation.x = 1.17;
    outerRing.rotation.y = -0.18;
    planetGroup.add(outerRing);

    const starCount = 240;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const radius = 2.8 + Math.random() * 3.4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = radius * Math.cos(phi);
      starPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({
      color: 0xdceaff, size: 0.025, transparent: true, opacity: 0.82,
      sizeAttenuation: true
    }));
    scene.add(stars);

    const resize = () => {
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    host.classList.add('has-three');

    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;
    host.addEventListener('pointermove', event => {
      const rect = host.getBoundingClientRect();
      pointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 0.18;
      pointerY = ((event.clientY - rect.top) / rect.height - 0.5) * 0.12;
    }, { passive: true });
    host.addEventListener('pointerleave', () => { pointerX = 0; pointerY = 0; }, { passive: true });

    let visible = true;
    const visibilityObserver = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
    });
    visibilityObserver.observe(host);

    const animate = () => {
      frame = requestAnimationFrame(animate);
      if (!visible) return;
      planet.rotation.y += 0.0018;
      planetGroup.rotation.y += (pointerX - planetGroup.rotation.y) * 0.018;
      planetGroup.rotation.x += (pointerY - planetGroup.rotation.x) * 0.018;
      stars.rotation.y -= 0.00012;
      renderer.render(scene, camera);
    };
    animate();

    window.addEventListener('pagehide', () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      renderer.dispose();
      planetGeometry.dispose();
      planetMaterial.dispose();
      ringMaterial.dispose();
      starGeometry.dispose();
    }, { once: true });
  } catch (error) {
    console.warn('Three.js scene unavailable; using the static cosmic artwork.', error);
  }
}
