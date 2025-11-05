"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import InteractiveStage from "./InteractiveStage";
import { useThree, useFrame } from "@react-three/fiber";
import { useSlideTheme } from "../store/slideTheme";

function EmptyScene() {
  return null;
}

export default function SceneCanvas() {
  return (
    <div className="absolute inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        dpr={[1, 2]}
        gl={{ antialias: false, powerPreference: "high-performance", alpha: true }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        {/* استبدل الخلفية اللانهائية بمشهد داخلي؛ احتفظنا بها مع تعتيم لاحقًا إن رغبت */}
        {/* <InfiniteBackground /> */}
        <InteractiveStage />
        <CameraRig />
        <EmptyScene />
        <OrbitControls enablePan={false} enableZoom={false} enableRotate={false} />
      </Canvas>
    </div>
  );
}

function CameraRig() {
  const { camera } = useThree();
  const { camera: target } = useSlideTheme();
  useFrame(() => {
    camera.position.x += (target.position[0] - camera.position.x) * 0.06;
    camera.position.y += (target.position[1] - camera.position.y) * 0.06;
    camera.position.z += (target.position[2] - camera.position.z) * 0.06;
    camera.fov += (target.fov - camera.fov) * 0.06;
    camera.updateProjectionMatrix();
  });
  return null;
}


