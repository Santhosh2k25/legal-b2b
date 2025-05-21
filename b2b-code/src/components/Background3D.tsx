import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Line, Sphere, Trail, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

function DataParticle({ position }: { position: [number, number, number] }) {
  const mesh = useRef<THREE.Mesh>(null!);
  const initialPosition = position;
  const [hovered, setHovered] = useState(false);
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    mesh.current.position.y = initialPosition[1] + Math.sin(time * 0.8 + position[0]) * 3;
    mesh.current.position.x = initialPosition[0] + Math.cos(time * 0.5 + position[1]) * 2;
    mesh.current.scale.setScalar(hovered ? 2.5 : (1.2 + Math.sin(time * 1.5 + position[2]) * 0.4));
  });

  return (
    <Trail
      width={1.5}
      length={12}
      color={new THREE.Color(0x3b82f6)}
      attenuation={(t) => t * t}
    >
      <mesh 
        ref={mesh} 
        position={position}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshPhongMaterial
          color="#3b82f6"
          emissive="#3b82f6"
          emissiveIntensity={hovered ? 4 : 1.5}
          transparent
          opacity={hovered ? 1 : 0.9}
        />
      </mesh>
    </Trail>
  );
}

function NeuralNode({ position, connections }: { 
  position: [number, number, number];
  connections: [number, number, number][];
}) {
  const mesh = useRef<THREE.Mesh>(null!);
  const initialY = position[1];
  const pulseRef = useRef(0);
  const [hovered, setHover] = useState(false);
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    mesh.current.position.y = initialY + Math.sin(time * 0.4 + position[0]) * 3;
    mesh.current.position.x += Math.sin(time * 0.3 + position[2]) * 0.02;
    mesh.current.rotation.x = Math.sin(time * 0.3) * 0.3;
    mesh.current.rotation.y = Math.sin(time * 0.4) * 0.3;
    
    // Create pulse effect
    pulseRef.current = (Math.sin(time * 1.2 + position[0]) + 1) * 0.8;
    if (mesh.current.material instanceof THREE.MeshPhongMaterial) {
      mesh.current.material.emissiveIntensity = 1 + pulseRef.current;
    }
  });

  return (
    <group>
      <mesh 
        ref={mesh} 
        position={position}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
      >
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshPhongMaterial
          color="#3b82f6"
          emissive="#3b82f6"
          emissiveIntensity={hovered ? 2 : 1}
          transparent
          opacity={hovered ? 1 : 0.8}
        />
      </mesh>
      {connections.map((end, i) => (
        <DataFlow key={i} start={position} end={end} />
      ))}
    </group>
  );
}

function DataFlow({ start, end }: { start: [number, number, number]; end: [number, number, number] }) {
  const ref = useRef<THREE.Line>(null!);
  const particleRef = useRef<THREE.Points>(null!);
  const points = 50;
  const positions = useMemo(() => {
    const arr = new Float32Array(points * 3);
    for (let i = 0; i < points; i++) {
      const t = i / (points - 1);
      arr[i * 3] = start[0] * (1 - t) + end[0] * t;
      arr[i * 3 + 1] = start[1] * (1 - t) + end[1] * t;
      arr[i * 3 + 2] = start[2] * (1 - t) + end[2] * t;
    }
    return arr;
  }, [start, end, points]);
  const positionsRef = useRef(new THREE.BufferAttribute(positions, 3));
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime() * 0.5;
    if (ref.current.material instanceof THREE.LineBasicMaterial) {
      ref.current.material.opacity = (Math.sin(time) + 1) * 0.5;
    }
    
    // Animate particles along the connection
    const posArray = positionsRef.current.array as Float32Array;
    for (let i = 0; i < posArray.length; i += 3) {
      const t = (time + i / posArray.length) % 1;
      posArray[i] = start[0] * (1 - t) + end[0] * t;
      posArray[i + 1] = start[1] * (1 - t) + end[1] * t;
      posArray[i + 2] = start[2] * (1 - t) + end[2] * t;
    }
    positionsRef.current.needsUpdate = true;
  });

  return (
    <group>
      <Line
        ref={ref}
        points={[start, end]}
        color="#3b82f6"
        lineWidth={1}
        transparent
        opacity={0.2}
      />
      <points ref={particleRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            ref={positionsRef}
            count={positions.length / 3}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.1}
          color="#3b82f6"
          transparent
          opacity={0.8}
          sizeAttenuation
        />
      </points>
    </group>
  );
}

function ParticleCloud() {
  const count = 2000;
  const positionsArray = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 150;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 150;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 75;
    }
    return arr;
  }, []);

  const positions = useRef(positionsArray);
  const bufferRef = useRef<THREE.BufferAttribute>(null!);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    for (let i = 0; i < count * 3; i += 3) {
      positions.current[i] += Math.sin(time * 0.3 + positions.current[i + 1]) * 0.03;
      positions.current[i + 1] += Math.cos(time * 0.4 + positions.current[i]) * 0.04;
      positions.current[i + 2] += Math.sin(time * 0.2 + positions.current[i + 2]) * 0.02;
    }
    bufferRef.current.needsUpdate = true;
  });

  return (
    <Points>
      <bufferGeometry>
        <bufferAttribute
          ref={bufferRef}
          attach="attributes-position"
          count={count}
          array={positions.current}
          itemSize={3}
        />
      </bufferGeometry>
      <PointMaterial
        transparent
        vertexColors
        size={0.15}
        sizeAttenuation={true}
        color="#0097a7"
      />
    </Points>
  );
}

export default function Background3D() {
  const nodes = useMemo(() => 
    Array.from({ length: 25 }, () => [
      Math.random() * 120 - 60,
      Math.random() * 120 - 60,
      Math.random() * 45 - 22.5
    ] as [number, number, number]),
    []
  );

  const connections = useMemo(() => {
    const result = new Map<number, [number, number, number][]>();
    nodes.forEach((node, i) => {
      const nodeConnections: [number, number, number][] = [];
      nodes.forEach((otherNode, j) => {
        if (i !== j) {
          const distance = Math.sqrt(
            Math.pow(node[0] - otherNode[0], 2) +
            Math.pow(node[1] - otherNode[1], 2) +
            Math.pow(node[2] - otherNode[2], 2)
          );
          if (distance < 20) {
            nodeConnections.push(otherNode);
          }
        }
      });
      result.set(i, nodeConnections);
    });
    return result;
  }, [nodes]);

  const dataParticles = useMemo(() => 
    Array.from({ length: 80 }, () => [
      Math.random() * 90 - 45,
      Math.random() * 90 - 45,
      Math.random() * 60 - 30
    ] as [number, number, number]),
    []
  );

  return (
    <div className="fixed -inset-[100px] z-0 overflow-hidden pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 50], fov: 75, near: 0.1, far: 1000 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ position: 'absolute', top: '-100px', left: '-100px', width: 'calc(100% + 200px)', height: 'calc(100% + 200px)' }}
        dpr={[1, 2]}
        frameloop="always"
        className="!absolute">
        <ambientLight intensity={0.4} />
        <pointLight position={[20, 20, 20]} intensity={0.6} color="#0097a7" />
        <pointLight position={[-20, -20, -20]} intensity={0.6} color="#0097a7" />
        
        <ParticleCloud />
        
        {nodes.map((position, i) => (
          <NeuralNode
            key={`node-${i}`}
            position={position}
            connections={connections.get(i) || []}
          />
        ))}
        
        {dataParticles.map((position, i) => (
          <DataParticle key={`particle-${i}`} position={position} />
        ))}
      </Canvas>
    </div>
  );
}