import { CommitData } from "../types";

interface TimelineScrubberProps {
	commits: CommitData[];
	currentIndex: number;
	onIndexChange: (index: number) => void;
}

export function TimelineScrubber({
	commits,
	currentIndex,
	onIndexChange,
}: TimelineScrubberProps) {
	const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		onIndexChange(parseInt(e.target.value));
	};

	const handlePrevious = () => {
		if (currentIndex > 0) {
			onIndexChange(currentIndex - 1);
		}
	};

	const handleNext = () => {
		if (currentIndex < commits.length - 1) {
			onIndexChange(currentIndex + 1);
		}
	};

	const currentCommit = commits[currentIndex];

	if (!currentCommit) return null;

	return (
		<div className="absolute bottom-0 left-0 right-0 bg-gray-900 bg-opacity-90 text-white p-4 border-t border-gray-700">
			<div className="max-w-6xl mx-auto">
				{/* Commit info */}
				<div className="mb-4">
					<div className="flex items-center justify-between mb-2">
						<div className="flex-1">
							<div className="font-semibold text-lg">
								{currentCommit.message}
							</div>
							<div className="text-sm text-gray-400">
								{currentCommit.author} •{" "}
								{currentCommit.date.toLocaleDateString()}
							</div>
						</div>
						<div className="text-sm text-gray-400">
							Commit {currentIndex + 1} of {commits.length}
						</div>
					</div>
				</div>

				{/* Timeline controls */}
				<div className="flex items-center gap-4">
					<button
						onClick={handlePrevious}
						disabled={currentIndex === 0}
						className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded transition-colors"
					>
						Previous
					</button>

					<div className="flex-1 flex items-center gap-4">
						<input
							type="range"
							min={0}
							max={commits.length - 1}
							value={currentIndex}
							onChange={handleSliderChange}
							className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
						/>
					</div>

					<button
						onClick={handleNext}
						disabled={currentIndex === commits.length - 1}
						className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded transition-colors"
					>
						Next
					</button>
				</div>

				{/* File statistics */}
				<div className="mt-3 flex gap-6 text-sm text-gray-300">
					<div>
						<span className="text-gray-400">Files:</span>{" "}
						{currentCommit.files.length}
					</div>
					<div>
						<span className="text-gray-400">Hash:</span>{" "}
						<span className="font-mono">
							{currentCommit.hash.substring(0, 7)}
						</span>
					</div>
				</div>
			</div>

			<style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          background: #3b82f6;
          cursor: pointer;
          border-radius: 50%;
        }
        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: #3b82f6;
          cursor: pointer;
          border-radius: 50%;
          border: none;
        }
      `}</style>
		</div>
	);
}
