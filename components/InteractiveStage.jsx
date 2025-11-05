"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Grid } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
// import LayerStack from "./LayerStack";
import { useSlideTheme } from "../store/slideTheme";

export default function InteractiveStage() {
  const stageRef = useRef();
  const dirLightRef = useRef();
  const { size } = useThree();
  const isMobile = size.width < 768;
  const theme = useSlideTheme();

  const target = useMemo(() => ({ x: 0, y: 0 }), []);
  const pointerRef = useRef({ x: 0, y: 0 });
  const scrollY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      scrollY.current = h > 0 ? window.scrollY / h : 0;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onMove = (x, y) => {
      const nx = (x / window.innerWidth) * 2 - 1; // -1..1
      const ny = (y / window.innerHeight) * 2 - 1; // -1..1
      pointerRef.current.x = nx;
      pointerRef.current.y = ny;
    };
    const onMouse = (e) => onMove(e.clientX, e.clientY);
    const onTouch = (e) => {
      if (e.touches && e.touches[0]) onMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    window.addEventListener("mousemove", onMouse, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("touchmove", onTouch);
    };
  }, []);

  useFrame((state, delta) => {
    // Parallax from global pointer (works even if Canvas is behind content)
    target.x = THREE.MathUtils.lerp(target.x, pointerRef.current.x * 0.35, 0.08);
    target.y = THREE.MathUtils.lerp(target.y, pointerRef.current.y * 0.2, 0.08);
    const depth = THREE.MathUtils.lerp(0, 0.6, scrollY.current);

    if (stageRef.current) {
      const t = state.clock.elapsedTime;
      // base idle motion
      const idleX = Math.sin(t * 0.2) * 0.06;
      const idleY = Math.cos(t * 0.25) * 0.04;
      stageRef.current.rotation.y = target.x + idleX;
      stageRef.current.rotation.x = -target.y * 0.6 + idleY;
      stageRef.current.position.y = THREE.MathUtils.lerp(
        stageRef.current.position.y,
        isMobile ? -0.2 : -0.1,
        0.05
      );
      stageRef.current.position.z = -depth;
    }

    // Light gentle motion
    if (dirLightRef.current) {
      const t = state.clock.elapsedTime;
      dirLightRef.current.position.x = Math.sin(t * 0.6) * 3.0;
      dirLightRef.current.position.y = 3 + Math.cos(t * 0.4) * 0.5;
    }
  });

  return (
    <group>
      {/* Lighting */}
      <ambientLight intensity={isMobile ? 0.6 : 0.7} />
      <directionalLight ref={dirLightRef} position={[3, 3, 3]} intensity={1.1} />

      {/* Stage */}
      <group ref={stageRef} position={[0, -0.1, 0]}>
        {/* LayerStack disabled to avoid 3D logo effect */}
      </group>

      {/* Floor Grid removed in favor of 3D image background */}

      {/* Image-based environment lighting */}
      <Environment preset="city" />

      {/* Subtle post fx */}
      {!isMobile && (
        <EffectComposer>
          <Bloom intensity={theme.bloom} luminanceThreshold={0.25} luminanceSmoothing={0.2} />
          <Vignette eskil={false} offset={0.2} darkness={0.6} />
        </EffectComposer>
      )}
    </group>
  );
}


