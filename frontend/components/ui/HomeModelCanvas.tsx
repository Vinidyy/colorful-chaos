'use client';
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import {
	OrbitControls,
	useGLTF,
	Environment,
	AccumulativeShadows,
	RandomizedLight,
} from '@react-three/drei';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';

function HomeModel(props: any) {
	const ref = useRef<Group>(null);
	const { scene } = useGLTF('/home.glb');

	useFrame((_, delta) => {
		if (ref.current) {
			ref.current.rotation.y += delta * 0.5; // Slow, smooth rotation
		}
	});

	return <primitive scale={1.4} ref={ref} object={scene} {...props} />;
}

export default function HomeModelCanvas() {
	return (
		<div style={{ width: 200, height: 200, margin: '0 auto' }}>
			<Canvas shadows camera={{ position: [0, 1, 3], fov: 35 }} gl={{ alpha: true }}>
				<Suspense fallback={null}>
					<HomeModel />
					{/* Studio lighting setup */}
					<ambientLight intensity={0.5} />
					<directionalLight
						position={[5, 5, 5]}
						intensity={1}
						castShadow
						shadow-mapSize={[1024, 1024]}
					/>
					<directionalLight position={[-5, 5, -5]} intensity={0.5} castShadow />
					<Environment preset="studio" />
				</Suspense>
				<OrbitControls enablePan={false} enableZoom={false} />
			</Canvas>
		</div>
	);
}

// Required for GLTF loading
// @ts-ignore
useGLTF.preload('/home.glb');
