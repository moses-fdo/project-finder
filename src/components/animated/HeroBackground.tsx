"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";

export default function HeroBackground() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    // ── Renderer ──────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    // ── Scene / Camera ────────────────────────────────────
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, el.clientWidth / el.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 5);

    // ── Primary: large icosahedron wireframe ──────────────
    const icoGeo = new THREE.IcosahedronGeometry(2.2, 2);
    const icoMat = new THREE.MeshBasicMaterial({
      color: 0x111111,
      wireframe: true,
      transparent: true,
      opacity: 0.12,
    });
    const ico = new THREE.Mesh(icoGeo, icoMat);
    scene.add(ico);

    // ── Secondary: smaller offset sphere wireframe ────────
    const sphereGeo = new THREE.SphereGeometry(1.3, 18, 18);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      wireframe: true,
      transparent: true,
      opacity: 0.07,
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.position.set(2.5, -0.5, -1);
    scene.add(sphere);

    // ── Particle field ────────────────────────────────────
    const count = 420;
    const pGeo  = new THREE.BufferGeometry();
    const pos   = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 14;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 14;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0x000000,
      size: 0.025,
      transparent: true,
      opacity: 0.35,
    });
    const points = new THREE.Points(pGeo, pMat);
    scene.add(points);

    // ── Horizontal grid plane ─────────────────────────────
    const gridHelper = new THREE.GridHelper(20, 28, 0x000000, 0x000000);
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.04;
    gridHelper.position.y = -2.8;
    scene.add(gridHelper);

    // ── Mouse parallax target ─────────────────────────────
    const mouse  = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };

    const onMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth  - 0.5) * 2;
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouseMove);

    // ── GSAP entrance: scale the ico in ──────────────────
    gsap.fromTo(
      ico.scale,
      { x: 0.4, y: 0.4, z: 0.4 },
      { x: 1, y: 1, z: 1, duration: 2.2, ease: "expo.out", delay: 0.2 }
    );
    gsap.fromTo(icoMat, { opacity: 0 }, { opacity: 0.12, duration: 2, delay: 0.2 });
    gsap.fromTo(pMat,   { opacity: 0 }, { opacity: 0.35, duration: 2.5, delay: 0.5 });

    // ── Render loop ───────────────────────────────────────
    let frameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Lerp camera toward mouse
      target.x += (mouse.x - target.x) * 0.04;
      target.y += (mouse.y - target.y) * 0.04;
      camera.position.x = target.x * 0.6;
      camera.position.y = target.y * 0.4;
      camera.lookAt(0, 0, 0);

      // Gentle auto-rotation
      ico.rotation.x = t * 0.07;
      ico.rotation.y = t * 0.11;
      sphere.rotation.x = -t * 0.09;
      sphere.rotation.y =  t * 0.13;
      points.rotation.y = t * 0.015;

      renderer.render(scene, camera);
    };
    animate();

    // ── Resize ────────────────────────────────────────────
    const onResize = () => {
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      icoGeo.dispose(); icoMat.dispose();
      sphereGeo.dispose(); sphereMat.dispose();
      pGeo.dispose(); pMat.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
