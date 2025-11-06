import { X } from "lucide-react";
import { useState } from "react";

export interface PerformanceSettings {
	maxNodes: number;
	maxEdges: number;
}

interface PerformanceSettingsModalProps {
	isOpen: boolean;
	onClose: () => void;
	settings: PerformanceSettings;
	onSettingsChange: (settings: PerformanceSettings) => void;
	currentNodeCount: number;
	currentEdgeCount: number;
}

export function PerformanceSettingsModal({
	isOpen,
	onClose,
	settings,
	onSettingsChange,
	currentNodeCount,
	currentEdgeCount,
}: PerformanceSettingsModalProps) {
	const [localSettings, setLocalSettings] = useState(settings);

	if (!isOpen) return null;

	const handleSave = () => {
		onSettingsChange(localSettings);
		onClose();
	};

	const handleReset = () => {
		const defaults: PerformanceSettings = {
			maxNodes: 1000,
			maxEdges: 2000,
		};
		setLocalSettings(defaults);
	};

	const getWarningMessage = () => {
		const warnings: string[] = [];

		if (currentNodeCount > localSettings.maxNodes) {
			warnings.push(
				`Current graph has ${currentNodeCount.toLocaleString()} nodes, which exceeds the limit of ${localSettings.maxNodes.toLocaleString()}. The graph will be trimmed.`,
			);
		}

		if (currentEdgeCount > localSettings.maxEdges) {
			warnings.push(
				`Current graph has ${currentEdgeCount.toLocaleString()} edges, which exceeds the limit of ${localSettings.maxEdges.toLocaleString()}. The graph will be trimmed.`,
			);
		}

		return warnings;
	};

	const warnings = getWarningMessage();

	return (
		<div
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				zIndex: 1000,
				backgroundColor: "rgba(0, 0, 0, 0.7)",
				backdropFilter: "blur(4px)",
			}}
			onClick={onClose}
		>
			<div
				style={{
					background: "rgba(15, 23, 42, 0.95)",
					backdropFilter: "blur(12px)",
					border: "1px solid rgba(148, 163, 184, 0.3)",
					borderRadius: "12px",
					padding: "24px",
					width: "90%",
					maxWidth: "500px",
					color: "#e2e8f0",
					fontFamily: "system-ui, -apple-system, sans-serif",
				}}
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						marginBottom: "20px",
					}}
				>
					<h2
						style={{
							fontSize: "20px",
							fontWeight: "600",
							margin: 0,
						}}
					>
						Performance Settings
					</h2>
					<button
						onClick={onClose}
						style={{
							background: "transparent",
							border: "none",
							color: "#94a3b8",
							cursor: "pointer",
							padding: "4px",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							borderRadius: "4px",
							transition: "all 0.2s",
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.background = "rgba(148, 163, 184, 0.1)";
							e.currentTarget.style.color = "#e2e8f0";
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.background = "transparent";
							e.currentTarget.style.color = "#94a3b8";
						}}
					>
						<X size={20} />
					</button>
				</div>

				<p
					style={{
						fontSize: "14px",
						color: "#94a3b8",
						marginBottom: "24px",
						lineHeight: "1.5",
					}}
				>
					Limit the maximum number of nodes and edges to maintain optimal
					performance. Large graphs may cause frame rate drops.
				</p>

				{/* Settings Form */}
				<div style={{ marginBottom: "24px" }}>
					{/* Max Nodes */}
					<div style={{ marginBottom: "20px" }}>
						<label
							style={{
								display: "block",
								fontSize: "14px",
								fontWeight: "500",
								marginBottom: "8px",
								color: "#cbd5e1",
							}}
						>
							Maximum Nodes
						</label>
						<div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
							<input
								type="range"
								min="100"
								max="5000"
								step="100"
								value={localSettings.maxNodes}
								onChange={(e) =>
									setLocalSettings({
										...localSettings,
										maxNodes: Number.parseInt(e.target.value),
									})
								}
								style={{
									flex: 1,
									height: "6px",
									borderRadius: "3px",
									background: "#1e293b",
									outline: "none",
									cursor: "pointer",
								}}
							/>
							<input
								type="number"
								min="100"
								max="10000"
								step="100"
								value={localSettings.maxNodes}
								onChange={(e) =>
									setLocalSettings({
										...localSettings,
										maxNodes: Math.max(
											100,
											Math.min(10000, Number.parseInt(e.target.value) || 100),
										),
									})
								}
								style={{
									width: "80px",
									padding: "6px 10px",
									background: "#1e293b",
									border: "1px solid rgba(148, 163, 184, 0.3)",
									borderRadius: "6px",
									color: "#e2e8f0",
									fontSize: "14px",
									textAlign: "right",
								}}
							/>
						</div>
						<div
							style={{
								fontSize: "12px",
								color: "#64748b",
								marginTop: "4px",
							}}
						>
							Current: {currentNodeCount.toLocaleString()} nodes
						</div>
					</div>

					{/* Max Edges */}
					<div style={{ marginBottom: "20px" }}>
						<label
							style={{
								display: "block",
								fontSize: "14px",
								fontWeight: "500",
								marginBottom: "8px",
								color: "#cbd5e1",
							}}
						>
							Maximum Edges
						</label>
						<div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
							<input
								type="range"
								min="200"
								max="10000"
								step="200"
								value={localSettings.maxEdges}
								onChange={(e) =>
									setLocalSettings({
										...localSettings,
										maxEdges: Number.parseInt(e.target.value),
									})
								}
								style={{
									flex: 1,
									height: "6px",
									borderRadius: "3px",
									background: "#1e293b",
									outline: "none",
									cursor: "pointer",
								}}
							/>
							<input
								type="number"
								min="200"
								max="20000"
								step="200"
								value={localSettings.maxEdges}
								onChange={(e) =>
									setLocalSettings({
										...localSettings,
										maxEdges: Math.max(
											200,
											Math.min(20000, Number.parseInt(e.target.value) || 200),
										),
									})
								}
								style={{
									width: "80px",
									padding: "6px 10px",
									background: "#1e293b",
									border: "1px solid rgba(148, 163, 184, 0.3)",
									borderRadius: "6px",
									color: "#e2e8f0",
									fontSize: "14px",
									textAlign: "right",
								}}
							/>
						</div>
						<div
							style={{
								fontSize: "12px",
								color: "#64748b",
								marginTop: "4px",
							}}
						>
							Current: {currentEdgeCount.toLocaleString()} edges
						</div>
					</div>
				</div>

				{/* Warnings */}
				{warnings.length > 0 && (
					<div
						style={{
							background: "rgba(245, 158, 11, 0.1)",
							border: "1px solid rgba(245, 158, 11, 0.3)",
							borderRadius: "8px",
							padding: "12px",
							marginBottom: "20px",
						}}
					>
						{warnings.map((warning, index) => (
							<div
								key={index}
								style={{
									fontSize: "13px",
									color: "#fbbf24",
									lineHeight: "1.5",
									marginBottom:
										warnings.length > 1 && index < warnings.length - 1
											? "8px"
											: "0",
								}}
							>
								⚠️ {warning}
							</div>
						))}
					</div>
				)}

				{/* Action Buttons */}
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						gap: "12px",
					}}
				>
					<button
						onClick={handleReset}
						style={{
							padding: "10px 16px",
							background: "transparent",
							border: "1px solid rgba(148, 163, 184, 0.3)",
							borderRadius: "6px",
							color: "#94a3b8",
							fontSize: "14px",
							fontWeight: "500",
							cursor: "pointer",
							transition: "all 0.2s",
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.background = "rgba(148, 163, 184, 0.1)";
							e.currentTarget.style.color = "#e2e8f0";
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.background = "transparent";
							e.currentTarget.style.color = "#94a3b8";
						}}
					>
						Reset to Defaults
					</button>
					<div style={{ display: "flex", gap: "12px" }}>
						<button
							onClick={onClose}
							style={{
								padding: "10px 16px",
								background: "transparent",
								border: "1px solid rgba(148, 163, 184, 0.3)",
								borderRadius: "6px",
								color: "#94a3b8",
								fontSize: "14px",
								fontWeight: "500",
								cursor: "pointer",
								transition: "all 0.2s",
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.background = "rgba(148, 163, 184, 0.1)";
								e.currentTarget.style.color = "#e2e8f0";
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.background = "transparent";
								e.currentTarget.style.color = "#94a3b8";
							}}
						>
							Cancel
						</button>
						<button
							onClick={handleSave}
							style={{
								padding: "10px 16px",
								background: "#3b82f6",
								border: "none",
								borderRadius: "6px",
								color: "#ffffff",
								fontSize: "14px",
								fontWeight: "500",
								cursor: "pointer",
								transition: "all 0.2s",
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.background = "#2563eb";
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.background = "#3b82f6";
							}}
						>
							Apply Settings
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
