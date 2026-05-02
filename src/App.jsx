import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;

    // SCENE
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020203, 0.003);

    const sizes = { width: window.innerWidth, height: window.innerHeight };

    const camera = new THREE.PerspectiveCamera(60, sizes.width / sizes.height, 0.1, 2000);
    const cameraGroup = new THREE.Group();
    cameraGroup.position.set(0, 0, 15);
    cameraGroup.add(camera);
    scene.add(cameraGroup);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(sizes.width, sizes.height), 0.8, 0.4, 0.85));

    // LIGHT
    scene.add(new THREE.AmbientLight(0xffffff, 0.15));
    const dirLight = new THREE.DirectionalLight(0xffeedd, 3);
    dirLight.position.set(50, 20, 50);
    scene.add(dirLight);

    // LOADERS
    const manager = new THREE.LoadingManager();
    manager.onProgress = (url, itemsLoaded, itemsTotal) => {
      setProgress(Math.round((itemsLoaded / itemsTotal) * 100));
    };

    manager.onLoad = () => {
      setTimeout(() => {
        setIsLoaded(true);
        gsap.to('.interface', { opacity: 1, duration: 2 });
        ScrollTrigger.refresh();
      }, 500);
    };

    const textureLoader = new THREE.TextureLoader(manager);
    const gltfLoader = new GLTFLoader(manager);

    const marsTexture = textureLoader.load('/8k_mars.jpg');
    const sunTexture = textureLoader.load('/8k_sun.jpg');

    // STARS
    const starsGeo = new THREE.BufferGeometry();
    const starsPos = new Float32Array(3000 * 3);
    for (let i = 0; i < 9000; i++) {
      starsPos[i] = (Math.random() - 0.5) * 1500;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starsPos, 3));
    const stars = new THREE.Points(
      starsGeo,
      new THREE.PointsMaterial({ size: 0.8, color: 0xffffff })
    );
    scene.add(stars);

    // SUN
    const sun = new THREE.Mesh(
      new THREE.SphereGeometry(6, 64, 64),
      new THREE.MeshStandardMaterial({
        map: sunTexture,
        emissiveMap: sunTexture,
        emissive: 0xffffff,
        emissiveIntensity: 0.6
      })
    );
    const sunGroup = new THREE.Group();
    sunGroup.add(sun);
    scene.add(sunGroup);

    // MARS
    const marsGroup = new THREE.Group();
    marsGroup.position.set(0, -60, -150);
    scene.add(marsGroup);

    const mars = new THREE.Mesh(
      new THREE.SphereGeometry(12, 128, 128),
      new THREE.MeshStandardMaterial({ map: marsTexture })
    );
    marsGroup.add(mars);

    // ATMOSPHERE
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(12.5, 128, 128),
      new THREE.MeshBasicMaterial({
        color: 0xff5522,
        transparent: true,
        opacity: 0.08,
        side: THREE.BackSide
      })
    );
    marsGroup.add(atmosphere);

    // LANDING ZONE
    const landingZone = new THREE.Group();
    landingZone.position.set(0, -48, -150);
    scene.add(landingZone);

    // GROUND
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200, 256, 256),
      new THREE.MeshStandardMaterial({
        map: marsTexture,
        displacementMap: marsTexture,
        displacementScale: 2
      })
    );
    ground.rotation.x = -Math.PI / 2;
    landingZone.add(ground);

    // ROVER
    let rover = null;
    gltfLoader.load('/25042_Perseverance.glb', (gltf) => {
      rover = gltf.scene;
      rover.scale.set(1.2, 1.2, 1.2);
      rover.position.set(0, 0, 0);
      landingZone.add(rover);
    });

    // DUST
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(2000 * 3);
    for (let i = 0; i < dustPos.length; i++) {
      dustPos[i] = (Math.random() - 0.5) * 50;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));

    const dust = new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({
        size: 0.1,
        color: 0xff8844,
        transparent: true,
        opacity: 0.5
      })
    );
    dust.position.y = -48;
    landingZone.add(dust);

    // 🔥 ATMOSPHERE OVERLAY EFFECT
    const overlay = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.MeshBasicMaterial({
        color: 0xff2200,
        transparent: true,
        opacity: 0
      })
    );
    overlay.material.depthWrite = false;
    overlay.renderOrder = 999;
    camera.add(overlay);

    // 🎬 SCROLL ANIMATION
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1
      }
    });

    tl.to(cameraGroup.position, { z: 40, duration: 2 }, 0)
      .to(sunGroup.position, { y: 100, duration: 2 }, "<")
      .to(cameraGroup.position, { y: -40, z: -100, duration: 4 })

      // ENTRY
      .to(scene.fog, { density: 0.02, duration: 2 })
      .to(overlay.material, { opacity: 0.4, duration: 1 })
      .to(overlay.material, { opacity: 0, duration: 1 })

      // LANDING
      .to(cameraGroup.position, { y: -48, z: -150, duration: 4 })
      .to(cameraGroup.position, { y: -49, z: -140, duration: 3 })
      .to(cameraGroup.position, { y: -49.5, z: -135, duration: 2 })

      // FINAL
      .to(cameraGroup.rotation, { x: -0.1, y: 0.2, duration: 2 });

    // LOOP
    const clock = new THREE.Clock();
    let animationId;

    const tick = () => {
      const t = clock.getElapsedTime();

      mars.rotation.y += 0.001;
      stars.rotation.y += 0.0005;

      dust.rotation.y += 0.002;
      dust.position.y = -48 + Math.sin(t * 0.5) * 0.5;

      cameraGroup.position.x += Math.sin(t * 0.3) * 0.002;
      cameraGroup.position.y += Math.cos(t * 0.2) * 0.002;

      if (rover) rover.rotation.y += 0.002;

      composer.render();
      animationId = requestAnimationFrame(tick);
    };
    tick();

    // RESIZE
    const onResize = () => {
      sizes.width = window.innerWidth;
      sizes.height = window.innerHeight;

      camera.aspect = sizes.width / sizes.height;
      camera.updateProjectionMatrix();

      renderer.setSize(sizes.width, sizes.height);
      composer.setSize(sizes.width, sizes.height);
    };

    window.addEventListener('resize', onResize);

    // CLEANUP
    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animationId);
    };

  }, []);

  return (
    <div ref={containerRef}>
      <div className={`preloader ${isLoaded ? 'hidden' : ''}`}>
        <div>LOADING... {progress}%</div>
      </div>

      <canvas ref={canvasRef} className="webgl"></canvas>

      <div className="interface">
        <section className="section"><h1>SPACE</h1></section>
        <section className="section"><h1>TRAVEL</h1></section>
        <section className="section"><h1>MARS</h1></section>
        <section className="section"><h1>LANDING</h1></section>
      </div>
    </div>
  );
}