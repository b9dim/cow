"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useLoader, useFrame } from "@react-three/fiber";
import gsap from "gsap";

function useLayerUrls() {
  const [urls, setUrls] = useState([]);
  useEffect(() => {
    let mounted = true;
    fetch("/api/layers")
      .then((r) => r.json())
      .then((data) => {
        if (mounted && data?.images) setUrls(data.images);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);
  return urls;
}

export default function LayerStack({ reveal, spacing = 0.05, mergeProgress = 0 }) {
  const urls = useLayerUrls();
  const textures = useLoader(THREE.TextureLoader, urls);
  const materialsRef = useRef([]);
  const groupRefs = useRef([]);

  const planes = useMemo(() => {
    // ثبّت الحجم البصري للحافة الأطول لكل طبقة، بغض النظر عن بكسلات المصدر
    const targetLongEdge = 3; // مطابقًا للقيمة السابقة "3" التي كانت مستخدمة للمربع
    return textures.map((tex, index) => {
      const iw = tex?.image?.width || 1000;
      const ih = tex?.image?.height || 1000;
      const aspect = ih ? iw / ih : 1;
      const width = aspect >= 1 ? targetLongEdge : targetLongEdge * aspect;
      const height = aspect >= 1 ? targetLongEdge / (aspect || 1) : targetLongEdge;
      return { tex, index, width, height };
    });
  }, [textures]);

  // Auto staged reveal only when reveal is not controlled
  useEffect(() => {
    if (reveal !== undefined) return;
    if (!materialsRef.current.length) return;
    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
    materialsRef.current.forEach((mat, i) => {
      if (!mat) return;
      mat.opacity = 0;
      tl.to(mat, { opacity: 1, duration: 0.6 }, i * 0.25);
    });
    return () => tl.kill();
  }, [urls, reveal]);

  // Controlled reveal per frame
  useFrame(() => {
    if (reveal === undefined) return;
    const total = materialsRef.current.length || 0;
    if (!total) return;
    const v = Math.max(0, Math.min(1, reveal));
    const fIndex = v * (total - 1);
    const base = Math.floor(fIndex);
    const frac = fIndex - base;
    materialsRef.current.forEach((mat, i) => {
      if (!mat) return;
      if (i < base) mat.opacity = 1;
      else if (i === base) mat.opacity = frac;
      else mat.opacity = 0;
    });
  });

  // Merge motion towards the center for the big scene
  useFrame(() => {
    const total = groupRefs.current.length || 0;
    if (!total) return;
    const p = THREE.MathUtils.clamp(mergeProgress, 0, 1);
    const radius = 2.2; // starting radius around center
    groupRefs.current.forEach((g, i) => {
      if (!g) return;
      const z = i * spacing;
      const angle = (i / total) * Math.PI * 2;
      const startX = Math.cos(angle) * radius;
      const startY = Math.sin(angle) * radius * 0.35; // أقل ارتفاع لعمق بصري
      // smoothstep easing
      const t = p * p * (3 - 2 * p);
      g.position.x = THREE.MathUtils.lerp(startX, 0, t);
      g.position.y = THREE.MathUtils.lerp(startY, 0, t);
      g.position.z = z;
      g.rotation.z = THREE.MathUtils.lerp(0.6, 0, t);
      const s = THREE.MathUtils.lerp(0.85, 1, t);
      g.scale.set(s, s, 1);
    });
  });

  return (
    <group position={[0, 0, 0]}>
      {planes.map(({ tex, index, width, height }) => {
        tex.anisotropy = 8;
        tex.colorSpace = THREE.SRGBColorSpace;
        const z = index * spacing; // تباعد بسيط بين الطبقات
        return (
          <group key={urls[index]} ref={(el) => (groupRefs.current[index] = el)} position={[0, 0, z]}>
            <mesh>
              <planeGeometry args={[width, height]} />
              <meshBasicMaterial
                ref={(el) => (materialsRef.current[index] = el)}
                transparent
                depthWrite={false}
                map={tex}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}


