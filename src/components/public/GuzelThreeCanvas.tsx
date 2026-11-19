import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    THREE?: any;
  }
}

export default function GuzelThreeCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof window === 'undefined') return;

    const THREE = window.THREE;
    if (!THREE) return;

    let frameId = 0;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 14;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    if (THREE.ACESFilmicToneMapping) {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
    }

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Soft lighting for luminous lilac & blush glass spheres
    const ambientLight = new THREE.AmbientLight(0xf9f0f5, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xcbb6ea, 1.8);
    keyLight.position.set(6, 8, 10);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0xe58fb6, 1.6, 25);
    rimLight.position.set(-6, -5, 6);
    scene.add(rimLight);

    // Floating translucent botanical dew spheres
    const group = new THREE.Group();
    scene.add(group);

    const geo = new THREE.SphereGeometry(1, 32, 32);
    const colors = [0xcbb6ea, 0xe58fb6, 0xecdcef, 0xd8c5f1, 0xf6d0d9];
    const orbs: {
      mesh: any;
      baseX: number;
      baseY: number;
      baseZ: number;
      speed: number;
      phase: number;
    }[] = [];

    for (let i = 0; i < 14; i++) {
      const mat = new THREE.MeshPhysicalMaterial({
        color: colors[i % colors.length],
        roughness: 0.25,
        metalness: 0.05,
        transparent: true,
        opacity: 0.28,
        clearcoat: 0.8,
        clearcoatRoughness: 0.2,
      });
      const mesh = new THREE.Mesh(geo, mat);
      const scale = 0.22 + (i % 4) * 0.14;
      mesh.scale.set(scale, scale, scale);

      const angle = (i / 14) * Math.PI * 2;
      const radius = 4.2 + (i % 3) * 1.8;
      const baseX = Math.cos(angle) * radius * 1.25;
      const baseY = Math.sin(angle) * radius * 0.85;
      const baseZ = -2 - (i % 4) * 1.2;

      mesh.position.set(baseX, baseY, baseZ);
      group.add(mesh);

      orbs.push({
        mesh,
        baseX,
        baseY,
        baseZ,
        speed: 0.4 + (i % 5) * 0.15,
        phase: i * 0.9,
      });
    }

    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    const onMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetMouseY = -(e.clientY / window.innerHeight - 0.5) * 2;
    };

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('resize', onResize);

    const clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth lerp for mouse tracking
      currentMouseX += (targetMouseX - currentMouseX) * 0.04;
      currentMouseY += (targetMouseY - currentMouseY) * 0.04;

      group.rotation.y = currentMouseX * 0.18;
      group.rotation.x = -currentMouseY * 0.12;

      for (const orb of orbs) {
        orb.mesh.position.y = orb.baseY + Math.sin(elapsed * orb.speed + orb.phase) * 0.45;
        orb.mesh.position.x = orb.baseX + Math.cos(elapsed * orb.speed * 0.8 + orb.phase) * 0.3;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 z-[1] overflow-hidden opacity-75"
      aria-hidden="true"
    />
  );
}

