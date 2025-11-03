import { Line } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { FileEdge, FileNode } from "../types";

interface FileEdge3DProps {
	edge: FileEdge;
	nodes: Map<string, FileNode>;
}

export function FileEdge3D({ edge, nodes }: FileEdge3DProps) {
	const source = nodes.get(edge.source);
	const target = nodes.get(edge.target);

	const points = useMemo(() => {
		if (!source || !target) return [];
		return [
			new THREE.Vector3(source.x || 0, source.y || 0, source.z || 0),
			new THREE.Vector3(target.x || 0, target.y || 0, target.z || 0),
		];
	}, [source, target]);

	if (!source || !target) return null;

	// Different colors for different edge types
	const color = edge.type === "parent" ? "#6366f1" : "#a855f7";

	return (
		<Line
			points={points}
			color={color}
			lineWidth={3}
			opacity={0.8}
			transparent
		/>
	);
}
