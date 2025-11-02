# Repo Timeline Visualizer

A 3D visualization tool for exploring Git repository evolution over time. Watch your codebase grow, change, and evolve with an interactive force-directed graph showing files and directories as connected nodes in 3D space.

🌐 **[Live Demo](https://rjwalters.github.io/repo-timeline/)**

## Deployment

This project automatically deploys to GitHub Pages via GitHub Actions. To enable:

1. Go to repository **Settings** → **Pages**
2. Under **Build and deployment**, set **Source** to **GitHub Actions**
3. Push to main branch to trigger deployment

The site will be available at `https://[username].github.io/repo-timeline/`

## Features

- **3D Force-Directed Graph**: Files and directories are visualized as nodes connected by springs, creating an organic, physics-based layout
- **Time Travel**: Scrub through your repository's commit history to see how the structure evolved
- **Interactive Controls**: Pan, zoom, and rotate the 3D view with your mouse
- **File Size Visualization**: Node sizes reflect file sizes (logarithmic scale)
- **Real-time Physics**: Watch the graph settle into its natural layout with spring physics
- **Commit Information**: See commit messages, authors, dates, and file counts

## Technology Stack

- **Vite**: Fast build tool and dev server
- **React**: UI framework
- **TypeScript**: Type-safe development
- **Three.js**: 3D rendering engine
- **React Three Fiber**: React renderer for Three.js
- **React Three Drei**: Useful helpers for R3F
- **Tailwind CSS**: Utility-first styling
- **Biome**: Fast linter and formatter
- **pnpm**: Efficient package manager
- **Simple Git**: Git integration (backend)

## Getting Started

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

Open your browser to `http://localhost:5173`

### Build

```bash
pnpm build
```

### Lint

```bash
pnpm lint
pnpm lint:fix  # Auto-fix issues
```

### Preview Production Build

```bash
pnpm preview
```

## Project Structure

```
repo-timeline/
├── src/
│   ├── components/
│   │   ├── FileNode3D.tsx       # Individual file/directory node
│   │   ├── FileEdge3D.tsx       # Connection between nodes
│   │   ├── RepoGraph3D.tsx      # Main 3D graph component
│   │   ├── TimelineScrubber.tsx # Commit timeline controls
│   │   └── RepoTimeline.tsx     # Main container component
│   ├── services/
│   │   └── gitService.ts        # Git repository integration
│   ├── utils/
│   │   └── forceSimulation.ts   # Physics simulation for graph layout
│   ├── types.ts                 # TypeScript type definitions
│   ├── App.tsx                  # Root application component
│   ├── main.tsx                 # Application entry point
│   └── index.css                # Global styles
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## How It Works

### Force-Directed Graph Layout

The visualization uses a custom force-directed graph algorithm with three types of forces:

1. **Spring Forces**: Connected nodes (parent/child relationships) attract each other
2. **Repulsion Forces**: All nodes repel each other to prevent overlap
3. **Centering Force**: Gentle pull toward the origin to keep the graph centered

### Data Flow

1. Git service fetches commit history
2. Each commit's file tree is parsed into nodes and edges
3. Force simulation calculates 3D positions for each node
4. Three.js renders the 3D scene
5. User can scrub through commits to see changes over time

### Node Visualization

- **Blue spheres**: Directories
- **Green spheres**: Files
- **Size**: Logarithmic scale based on file size
- **Connections**: Purple lines show parent-child relationships

## Customization

### Adjust Physics

Edit `src/utils/forceSimulation.ts`:

```typescript
new ForceSimulation(nodesCopy, edges, {
  strength: 0.05,    // Spring strength
  distance: 30,      // Target distance between connected nodes
  iterations: 300,   // Simulation steps
});
```

### Change Colors

Edit colors in `src/components/FileNode3D.tsx` and `src/components/FileEdge3D.tsx`

### Camera Settings

Edit initial camera position in `src/components/RepoGraph3D.tsx`:

```typescript
camera={{ position: [0, 0, 200], fov: 75 }}
```

## Future Enhancements

- Real Git integration (currently uses demo data)
- File content diffing
- Dependency graph visualization
- Author-based coloring
- Animation transitions between commits
- Export visualizations as video/GIF
- Multiple repository comparison
- Search and filter files
- Custom layout algorithms
- Performance optimizations for large repos

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.
