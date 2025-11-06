# Project Context: React GitHub Timeline

## Project Overview

React GitHub Timeline is a React library that visualizes GitHub repository evolution through an interactive 3D force-directed graph. It shows how files and directories change over time based on merged pull requests.

**Live Demo:** https://rjwalters.github.io/github-timeline/
**NPM Package:** react-github-timeline
**Current Version:** Check package.json

## Project Architecture

### High-Level Structure

```
github-timeline/
├── src/                    # React application source
│   ├── components/         # React components
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API and data services
│   ├── utils/             # Utility functions
│   └── types/             # TypeScript type definitions
├── worker/                # Cloudflare Workers API
│   ├── src/               # Worker source code
│   └── dist/              # Compiled worker output
├── docs/                  # Documentation files
└── demo/                  # Demo application
```

### Core Technologies

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Three.js** - 3D rendering
- **React Three Fiber** - React renderer for Three.js
- **React Three Drei** - Three.js helpers
- **Vite** - Build tool
- **Vitest** - Testing framework
- **Cloudflare Workers** - Edge API (optional)
- **Cloudflare D1** - SQLite database (optional)

## Key Components

### 1. Data Flow Components

#### GitHubApiService (`src/services/githubApiService.ts`)
- Fetches data from GitHub REST API
- Handles pagination, rate limiting
- Converts PRs to timeline commits
- **Coverage:** 47.91%

#### WorkerApiService (`src/services/workerApiService.ts`)
- Fetches cached data from Cloudflare Worker
- Fallback when Worker is configured
- **Coverage:** 93.1%

#### IndexedDBService (`src/services/indexedDBService.ts`)
- Browser-side caching with IndexedDB
- 24-hour cache expiration
- Stores commit history per repository
- **Coverage:** 66.18%

### 2. Data Processing Utils

#### commitBuilder.ts
- Converts file state snapshots to commit data
- Builds file tree and edge relationships
- **Coverage:** 58.82%

#### fileTreeBuilder.ts
- Constructs hierarchical file tree from flat file list
- Creates parent-child directory relationships
- **Coverage:** 96.42%

#### fileStateTracker.ts
- Tracks cumulative file changes across commits
- Handles file additions, modifications, deletions, renames
- **Coverage:** 100%

#### graphLimiter.ts
- Limits graph complexity for performance
- Default: 500 nodes, 1000 edges
- Prioritizes recent commits and important files
- 40/60 directory/file split
- **Coverage:** 100%

#### graphBounds.ts
- Calculates bounding box for node positions
- Determines optimal camera distance and zoom limits
- **Coverage:** 100%

### 3. UI Components

#### RepoInput (`src/components/RepoInput.tsx`)
- Repository input with validation
- Parses GitHub URLs
- Handles various input formats
- **Coverage:** 100%

#### RepoStatusBanner (`src/components/RepoStatusBanner.tsx`)
- Shows cache status and data availability
- Displays load progress
- Auto-hides after 3 seconds when ready
- **Coverage:** 100%

#### TimelineScrubber (`src/components/TimelineScrubber.tsx`)
- Video-style playback controls
- Timeline slider with commit markers
- Playback speeds: 1x, 60x, 300x, 1800x
- Forward/reverse playback
- **Coverage:** 100%

#### RateLimitDisplay (`src/components/RateLimitDisplay.tsx`)
- Shows GitHub API rate limit status
- Color-coded warnings (green/yellow/red)
- Reset time display
- **Coverage:** 100%

### 4. Custom Hooks

#### useRepoData (`src/hooks/useRepoData.ts`)
- Main data orchestration hook
- Manages loading states
- Coordinates between cache, worker, and GitHub API
- Handles incremental loading
- **Coverage:** 73.79%

#### usePlaybackTimer (`src/hooks/usePlaybackTimer.ts`)
- Controls timeline animation
- Handles playback speed and direction
- Manages play/pause state
- **Coverage:** 100%

### 5. 3D Visualization

#### Timeline3DView (`src/components/Timeline3DView.tsx`)
- Three.js scene with force-directed graph
- Interactive camera controls
- Node and edge rendering
- Performance monitoring overlay

## Data Model

### CommitData
```typescript
interface CommitData {
  hash: string;           // PR merge commit SHA
  message: string;        // PR title
  author: string;         // PR author
  date: Date;            // Merge timestamp
  files: FileNode[];     // Files at this commit
  edges: Edge[];         // Relationships between files
}
```

### FileNode
```typescript
interface FileNode {
  id: string;            // Unique identifier (path)
  path: string;          // Full file path
  name: string;          // File/directory name
  type: 'file' | 'directory';
  size: number;          // File size in bytes
  x?: number;            // 3D position
  y?: number;
  z?: number;
}
```

### Edge
```typescript
interface Edge {
  source: string;        // Source node ID
  target: string;        // Target node ID
  type?: 'parent' | 'file';  // Relationship type
}
```

## Data Flow Sequence

1. **User Input** → RepoInput validates and parses repository
2. **Cache Check** → IndexedDBService checks for cached data
3. **Data Fetch** → Either WorkerApiService or GitHubApiService fetches data
4. **Processing** → fileStateTracker + commitBuilder create timeline
5. **Optimization** → graphLimiter reduces complexity
6. **Rendering** → Timeline3DView displays 3D graph
7. **Interaction** → TimelineScrubber controls timeline position

## Testing Strategy

### Test Coverage (Current: 77.03%)

**Well-Covered (>90%):**
- All UI components (100%)
- graphLimiter (100%)
- graphBounds (100%)
- fileStateTracker (100%)
- timelineHelpers (100%)
- workerApiService (93.1%)

**Needs Improvement (<70%):**
- githubApiService (47.91%)
- commitBuilder (58.82%)
- indexedDBService (66.18%)
- useRepoData (73.79%)

### Testing Tools
- **Vitest** - Test runner
- **@testing-library/react** - Component testing
- **fake-indexeddb** - IndexedDB mocking
- **vi.fn()** - Function mocking

## Performance Considerations

### Graph Limits
- **Max Nodes:** 500 (configurable)
- **Max Edges:** 1000 (configurable)
- **Directory/File Split:** 40/60
- **Priority:** Recent commits favored

### Caching Strategy
- **Browser:** IndexedDB (24-hour TTL)
- **Edge:** Cloudflare Workers + D1 (persistent)
- **Memory:** React state for active session

### Bundle Size
- **UMD:** ~17.5 KB gzipped
- **ESM (tree-shaken):** ~12 KB gzipped

## GitHub API Integration

### Rate Limits
- **Unauthenticated:** 60 requests/hour
- **Authenticated:** 5,000 requests/hour
- **Recommendation:** Use GitHub token for production

### API Endpoints Used
- `GET /repos/:owner/:repo` - Repository info
- `GET /repos/:owner/:repo/pulls` - Pull requests (paginated)
- `GET /repos/:owner/:repo/pulls/:number/files` - PR files (paginated)

### Optimization Strategy
1. Use Cloudflare Worker for caching
2. Implement IndexedDB browser cache
3. Fetch incrementally (load more commits on demand)
4. Rate limit monitoring and warnings

## Cloudflare Workers (Optional)

### Purpose
- Cache repository data at the edge
- Reduce GitHub API calls
- Improve load times globally
- Share cache across users

### Database Schema (D1)
- **repos** - Repository metadata
- **commits** - Commit timeline data
- **cache_status** - Cache freshness tracking

### Deployment
See `WORKER_DEPLOYMENT.md` for complete setup instructions.

## Common Development Tasks

### Adding a New Component
1. Create component in `src/components/`
2. Add TypeScript types
3. Write tests in `.test.tsx` file
4. Export from `src/lib/index.ts`
5. Update documentation

### Adding a New Utility
1. Create utility in `src/utils/`
2. Write comprehensive tests
3. Export from `src/lib/index.ts`
4. Document usage in `LLM_INTEGRATION.md`

### Improving Test Coverage
1. Run `pnpm test:coverage`
2. Identify low-coverage files
3. Add tests for uncovered branches
4. Focus on edge cases and error paths

### Performance Optimization
1. Profile with React DevTools
2. Check bundle size with `pnpm build`
3. Adjust graph limits for target devices
4. Consider code splitting for large features

## Code Style

### TypeScript
- Strict mode enabled
- No `any` types without good reason
- Explicit return types for public functions
- Interfaces for data structures

### React
- Functional components with hooks
- Props destructuring
- Memoization for expensive operations
- Custom hooks for reusable logic

### Testing
- Arrange-Act-Assert pattern
- Descriptive test names
- Mock external dependencies
- Test edge cases and errors

## Common Patterns

### Error Handling
```typescript
try {
  const data = await service.fetchData();
} catch (error) {
  if (error.message.includes('rate limit')) {
    // Handle rate limit
  } else if (error.message.includes('404')) {
    // Handle not found
  } else {
    // Generic error
  }
}
```

### Progress Tracking
```typescript
await service.fetchMergedPRs((progress) => {
  setLoadProgress({
    loaded: progress.loaded,
    total: progress.total,
    percentage: progress.percentage,
    message: progress.message
  });
});
```

### Cache Management
```typescript
// Check cache first
let commits = await IndexedDBService.loadCommits(repoKey);

if (!commits) {
  // Fetch from API
  commits = await service.buildTimelineFromPRs();

  // Save to cache
  await IndexedDBService.saveCommits(repoKey, commits);
}
```

## Debugging Tips

### Enable Performance Overlay
Press 'P' key while viewing timeline to toggle FPS/memory stats.

### Check Cache Status
```typescript
const info = await IndexedDBService.getCacheInfo('owner/repo');
console.log('Cache age:', info.age);
console.log('Commit count:', info.commitCount);
```

### Monitor Rate Limits
```typescript
const service = new GitHubApiService('owner/repo');
await service.fetchMergedPRs();
const rateLimit = service.getRateLimitInfo();
console.log('Remaining:', rateLimit.remaining);
```

### Inspect Graph Complexity
```typescript
console.log('Nodes:', commits[currentIndex].files.length);
console.log('Edges:', commits[currentIndex].edges.length);
```

## Environment Variables

### Development
```bash
VITE_GITHUB_TOKEN=ghp_...       # Optional: GitHub token
VITE_WORKER_URL=http://...      # Optional: Worker URL
```

### Production
```bash
GITHUB_TOKEN=ghp_...            # For GitHub Actions
CLOUDFLARE_API_TOKEN=...        # For worker deployment
CLOUDFLARE_ACCOUNT_ID=...       # Cloudflare account
```

## Build & Deploy

### Library Build
```bash
pnpm build          # Build npm package
pnpm build:demo     # Build demo site
```

### Worker Deploy
```bash
cd worker
pnpm deploy         # Deploy to Cloudflare
```

### Demo Deploy
```bash
pnpm build:demo     # Build demo
# Then deploy dist/ to GitHub Pages or Netlify
```

## Dependencies

### Production Dependencies
- `react` ^18.3.1
- `react-dom` ^18.3.1
- `three` ^0.172.0
- `@react-three/fiber` ^9.0.0
- `@react-three/drei` ^9.121.0
- `lucide-react` ^0.469.0

### Development Dependencies
- `typescript` ^5.7.3
- `vite` ^6.0.6
- `vitest` ^2.1.8
- `@testing-library/react` ^16.3.0
- `biome` ^1.9.4 (linting)

## File Naming Conventions

- **Components:** PascalCase (e.g., `RepoInput.tsx`)
- **Hooks:** camelCase with 'use' prefix (e.g., `useRepoData.ts`)
- **Utils:** camelCase (e.g., `graphLimiter.ts`)
- **Types:** PascalCase (e.g., `CommitData`)
- **Tests:** Same as source with `.test.tsx` or `.test.ts` suffix

## Import/Export Strategy

### Library Exports (`src/lib/index.ts`)
All public APIs are exported from a single entry point:
- Components
- Hooks
- Services
- Utils
- Types

### Internal Imports
Use relative paths for internal imports:
```typescript
import { CommitData } from '../types';
import { buildCommit } from '../utils/commitBuilder';
```

## Related Documentation

- **[README.md](../README.md)** - Project overview and quick start
- **[EMBEDDING.md](../EMBEDDING.md)** - Integration guide for developers
- **[LLM_INTEGRATION.md](../LLM_INTEGRATION.md)** - Guide for AI assistants
- **[WORKER_DEPLOYMENT.md](../WORKER_DEPLOYMENT.md)** - Cloudflare Workers setup
- **[CHANGELOG.md](../CHANGELOG.md)** - Version history

## Support & Contributing

- **Issues:** https://github.com/rjwalters/github-timeline/issues
- **Pull Requests:** Welcome! Follow existing code style
- **Discussions:** Use GitHub Discussions for questions

## License

MIT License - See LICENSE file for details
