"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, ContactShadows, MeshDistortMaterial, Sphere } from "@react-three/drei";
import * as THREE from "three";

function FloatingObject() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      // Slow rotation for a premium feel
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    }
  });

  return (
    <Float
      speed={2} // Animation speed
      rotationIntensity={1.5} // XYZ rotation intensity
      floatIntensity={2} // Up/down float intensity
    >
      <Sphere ref={meshRef} args={[1.5, 64, 64]} scale={1.5}>
        <MeshDistortMaterial
          color="#10E36C"
          attach="material"
          distort={0.4} // Shape distortion
          speed={1.5} // Animation speed
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
    </Float>
  );
}

export default function ThreeScene() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none opacity-60">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <spotLight position={[-10, -10, -10]} intensity={2} color="#10E36C" />
        
        <FloatingObject />
        

        <ContactShadows
          position={[0, -3, 0]}
          opacity={0.5}
          scale={20}
          blur={2}
          far={4.5}
        />
      </Canvas>
    </div>
  );
}
