import { describe, expect, it } from "vitest";
import type { FileNode } from "../types";
import {
	calculateGraphBounds,
	calculateOptimalCameraDistance,
	calculateOptimalZoomLimits,
} from "./graphBounds";

describe("graphBounds", () => {
	describe("calculateGraphBounds", () => {
		it("should return zeros for empty node array", () => {
			const result = calculateGraphBounds([]);

			expect(result).toEqual({
				maxDistance: 0,
				farthestNode: null,
				averageDistance: 0,
				nodeDistances: [],
			});
		});

		it("should calculate distance for single node at origin", () => {
			const nodes: FileNode[] = [
				{
					id: "test",
					path: "test.ts",
					name: "test.ts",
					type: "file",
					size: 100,
					x: 0,
					y: 0,
					z: 0,
				},
			];

			const result = calculateGraphBounds(nodes);

			expect(result.maxDistance).toBe(0);
			expect(result.averageDistance).toBe(0);
			expect(result.farthestNode).toEqual(nodes[0]);
		});

		it("should calculate distance for single node away from origin", () => {
			const nodes: FileNode[] = [
				{
					id: "test",
					path: "test.ts",
					name: "test.ts",
					type: "file",
					size: 100,
					x: 3,
					y: 4,
					z: 0,
				},
			];

			const result = calculateGraphBounds(nodes);

			// Distance = sqrt(3^2 + 4^2 + 0^2) = 5
			expect(result.maxDistance).toBe(5);
			expect(result.averageDistance).toBe(5);
			expect(result.farthestNode).toEqual(nodes[0]);
		});

		it("should find farthest node among multiple nodes", () => {
			const nodes: FileNode[] = [
				{
					id: "close",
					path: "close.ts",
					name: "close.ts",
					type: "file",
					size: 100,
					x: 1,
					y: 1,
					z: 1,
				},
				{
					id: "far",
					path: "far.ts",
					name: "far.ts",
					type: "file",
					size: 100,
					x: 10,
					y: 10,
					z: 10,
				},
				{
					id: "medium",
					path: "medium.ts",
					name: "medium.ts",
					type: "file",
					size: 100,
					x: 5,
					y: 5,
					z: 5,
				},
			];

			const result = calculateGraphBounds(nodes);

			// Farthest distance = sqrt(10^2 + 10^2 + 10^2) ≈ 17.32
			expect(result.maxDistance).toBeCloseTo(17.32, 2);
			expect(result.farthestNode?.id).toBe("far");
		});

		it("should calculate correct average distance", () => {
			const nodes: FileNode[] = [
				{
					id: "n1",
					path: "n1",
					name: "n1",
					type: "file",
					size: 100,
					x: 0,
					y: 0,
					z: 0,
				},
				{
					id: "n2",
					path: "n2",
					name: "n2",
					type: "file",
					size: 100,
					x: 3,
					y: 4,
					z: 0,
				},
			];

			const result = calculateGraphBounds(nodes);

			// Distance 1 = 0, Distance 2 = 5, Average = 2.5
			expect(result.averageDistance).toBe(2.5);
		});

		it("should handle nodes without position (undefined x, y, z)", () => {
			const nodes: FileNode[] = [
				{
					id: "test",
					path: "test.ts",
					name: "test.ts",
					type: "file",
					size: 100,
					x: undefined,
					y: undefined,
					z: undefined,
				},
			];

			const result = calculateGraphBounds(nodes);

			expect(result.maxDistance).toBe(0);
			expect(result.averageDistance).toBe(0);
		});

		it("should return nodeDistances sorted by distance (descending)", () => {
			const nodes: FileNode[] = [
				{
					id: "n1",
					path: "n1",
					name: "n1",
					type: "file",
					size: 100,
					x: 1,
					y: 0,
					z: 0,
				},
				{
					id: "n2",
					path: "n2",
					name: "n2",
					type: "file",
					size: 100,
					x: 10,
					y: 0,
					z: 0,
				},
				{
					id: "n3",
					path: "n3",
					name: "n3",
					type: "file",
					size: 100,
					x: 5,
					y: 0,
					z: 0,
				},
			];

			const result = calculateGraphBounds(nodes);

			expect(result.nodeDistances[0].node.id).toBe("n2"); // Farthest
			expect(result.nodeDistances[1].node.id).toBe("n3"); // Medium
			expect(result.nodeDistances[2].node.id).toBe("n1"); // Closest
		});

		it("should calculate distance in 3D space correctly", () => {
			const nodes: FileNode[] = [
				{
					id: "test",
					path: "test.ts",
					name: "test.ts",
					type: "file",
					size: 100,
					x: 1,
					y: 2,
					z: 2,
				},
			];

			const result = calculateGraphBounds(nodes);

			// Distance = sqrt(1^2 + 2^2 + 2^2) = sqrt(9) = 3
			expect(result.maxDistance).toBe(3);
		});
	});

	describe("calculateOptimalCameraDistance", () => {
		it("should calculate camera distance based on graph bounds", () => {
			const maxDistance = 100;
			const distance = calculateOptimalCameraDistance(maxDistance, 75);

			expect(distance).toBeGreaterThan(100);
			expect(distance).toBeLessThanOrEqual(500);
		});

		it("should apply minimum clamp of 100", () => {
			const maxDistance = 10; // Very small graph
			const distance = calculateOptimalCameraDistance(maxDistance, 75);

			expect(distance).toBe(100);
		});

		it("should apply maximum clamp of 500", () => {
			const maxDistance = 10000; // Very large graph
			const distance = calculateOptimalCameraDistance(maxDistance, 75);

			expect(distance).toBe(500);
		});

		it("should use default FOV of 75 when not specified", () => {
			const maxDistance = 100;
			const distance1 = calculateOptimalCameraDistance(maxDistance);
			const distance2 = calculateOptimalCameraDistance(maxDistance, 75);

			expect(distance1).toBe(distance2);
		});

		it("should calculate different distances for different FOVs", () => {
			const maxDistance = 100;
			const narrowFOV = calculateOptimalCameraDistance(maxDistance, 45);
			const wideFOV = calculateOptimalCameraDistance(maxDistance, 90);

			// Narrower FOV needs more distance
			expect(narrowFOV).toBeGreaterThan(wideFOV);
		});

		it("should add 20% padding for comfortable viewing", () => {
			const maxDistance = 100;
			const fov = 75;
			const fovRadians = (fov * Math.PI) / 180;
			const baseDistance = maxDistance / Math.tan(fovRadians / 2);
			const expectedDistance = baseDistance * 1.2;

			const distance = calculateOptimalCameraDistance(maxDistance, fov);

			expect(distance).toBe(expectedDistance);
		});
	});

	describe("calculateOptimalZoomLimits", () => {
		it("should calculate zoom limits based on graph bounds", () => {
			const maxDistance = 100;
			const limits = calculateOptimalZoomLimits(maxDistance);

			expect(limits.minDistance).toBeGreaterThan(0);
			expect(limits.maxDistance).toBeGreaterThan(limits.minDistance);
		});

		it("should set minDistance to at least 20", () => {
			const maxDistance = 10; // Very small graph
			const limits = calculateOptimalZoomLimits(maxDistance);

			expect(limits.minDistance).toBeGreaterThanOrEqual(20);
		});

		it("should set minDistance to 10% of maxDistance for larger graphs", () => {
			const maxDistance = 1000;
			const limits = calculateOptimalZoomLimits(maxDistance);

			expect(limits.minDistance).toBe(100); // 10% of 1000
		});

		it("should set maxDistance to at least 200", () => {
			const maxDistance = 10; // Very small graph
			const limits = calculateOptimalZoomLimits(maxDistance);

			expect(limits.maxDistance).toBeGreaterThanOrEqual(200);
		});

		it("should set maxDistance to 3x maxDistance for larger graphs", () => {
			const maxDistance = 200;
			const limits = calculateOptimalZoomLimits(maxDistance);

			expect(limits.maxDistance).toBe(600); // 3x 200
		});

		it("should handle zero maxDistance", () => {
			const limits = calculateOptimalZoomLimits(0);

			expect(limits.minDistance).toBe(20);
			expect(limits.maxDistance).toBe(200);
		});

		it("should create sensible limits for medium-sized graphs", () => {
			const maxDistance = 150;
			const limits = calculateOptimalZoomLimits(maxDistance);

			expect(limits.minDistance).toBe(20); // max(20, 15) = 20
			expect(limits.maxDistance).toBe(450); // 3 * 150
		});
	});
});
