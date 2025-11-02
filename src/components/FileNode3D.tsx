import { Sphere, Text } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";
import { FileNode } from "../types";

interface FileNode3DProps {
	node: FileNode;
	onClick?: (node: FileNode) => void;
}

export function FileNode3D({ node, onClick }: FileNode3DProps) {
	const meshRef = useRef<THREE.Mesh>(null);

	// Scale node size based on file size (with some min/max bounds)
	const radius = Math.max(0.5, Math.min(3, Math.log(node.size + 1) * 0.3));

	// Color based on file type
	const color = node.type === "directory" ? "#3b82f6" : "#10b981";

	const handleClick = () => {
		if (onClick) {
			onClick(node);
		}
	};

	return (
		<group position={[node.x || 0, node.y || 0, node.z || 0]}>
			<Sphere ref={meshRef} args={[radius, 16, 16]} onClick={handleClick}>
				<meshStandardMaterial
					color={color}
					emissive={color}
					emissiveIntensity={0.2}
					roughness={0.5}
					metalness={0.5}
				/>
			</Sphere>
			<Text
				position={[0, radius + 1, 0]}
				fontSize={0.8}
				color="white"
				anchorX="center"
				anchorY="middle"
			>
				{node.name}
			</Text>
		</group>
	);
}
