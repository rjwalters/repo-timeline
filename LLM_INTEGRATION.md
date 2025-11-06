# LLM Integration Guide

This guide helps AI assistants and LLM agents integrate the React GitHub Timeline library effectively into applications.

## Overview

React GitHub Timeline is a library for visualizing GitHub repository evolution through an interactive 3D force-directed graph. It shows how files and directories change over time based on merged pull requests.

## Quick Start

### Installation

```bash
npm install react-github-timeline
# or
pnpm add react-github-timeline
```

### Basic Usage

```tsx
import { RepoTimeline } from 'react-github-timeline';

function App() {
  return (
    <RepoTimeline
      owner="facebook"
      repo="react"
      width={800}
      height={600}
    />
  );
}
```

## Core Components

### RepoTimeline (Primary Component)

The main component that renders the complete visualization experience.

**Props:**
- `owner` (string, required): GitHub repository owner
- `repo` (string, required): GitHub repository name
- `width` (number): Canvas width in pixels (default: 800)
- `height` (number): Canvas height in pixels (default: 600)
- `githubToken` (string, optional): GitHub personal access token for higher rate limits
- `workerUrl` (string, optional): Cloudflare Workers API URL for cached data

**Example:**
```tsx
<RepoTimeline
  owner="microsoft"
  repo="vscode"
  width={1200}
  height={800}
  githubToken={process.env.GITHUB_TOKEN}
/>
```

### RepoInput

Input component for repository selection with validation.

**Props:**
- `onRepoSelect` (function): Callback when valid repo is selected
- `defaultValue` (string, optional): Default repository (format: "owner/repo")

**Example:**
```tsx
<RepoInput
  defaultValue="facebook/react"
  onRepoSelect={(owner, repo) => {
    console.log(`Selected: ${owner}/${repo}`);
  }}
/>
```

## Data Flow Architecture

### Client-Side Data Fetching

When no `workerUrl` is provided, the library fetches directly from GitHub API:

```tsx
import { GitHubApiService } from 'react-github-timeline/services';

const service = new GitHubApiService('facebook/react', githubToken);

// Fetch merged PRs with progress tracking
const prs = await service.fetchMergedPRs((progress) => {
  console.log(`${progress.percentage}% complete`);
});

// Build timeline from PRs
const commits = await service.buildTimelineFromPRs();
```

### Cloudflare Workers Integration

For production applications, use Cloudflare Workers for better performance:

```tsx
<RepoTimeline
  owner="facebook"
  repo="react"
  workerUrl="https://your-worker.workers.dev"
/>
```

The worker caches repository data in Cloudflare D1, significantly reducing API calls.

## Advanced Features

### Performance Limits

The library automatically limits graph complexity for performance:

```tsx
import { limitGraph } from 'react-github-timeline/utils';

const limited = limitGraph(nodes, edges, {
  maxNodes: 500,
  maxEdges: 1000,
  prioritizeRecent: true
});
```

**Default Limits:**
- Maximum nodes: 500
- Maximum edges: 1000
- Directory/file split: 40/60
- Prioritizes recent commits

### Custom Graph Bounds

Calculate optimal camera positioning and zoom:

```tsx
import { calculateGraphBounds, calculateOptimalZoomLimits } from 'react-github-timeline/utils';

const bounds = calculateGraphBounds(nodes);
const distance = calculateOptimalCameraDistance(bounds);
const zoomLimits = calculateOptimalZoomLimits(bounds);
```

### Timeline Playback

Control timeline animation programmatically:

```tsx
const [isPlaying, setIsPlaying] = useState(false);
const [currentTime, setCurrentTime] = useState(0);
const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(60);

<TimelineScrubber
  commits={commits}
  currentTime={currentTime}
  onTimeChange={setCurrentTime}
  timeRange={{ start: commits[0].date.getTime(), end: commits[commits.length - 1].date.getTime() }}
  isPlaying={isPlaying}
  onPlayPause={() => setIsPlaying(!isPlaying)}
  playbackSpeed={playbackSpeed}
  onSpeedChange={setPlaybackSpeed}
  playbackDirection="forward"
  onDirectionChange={(dir) => console.log(dir)}
/>
```

**Playback Speeds:** 1x, 60x, 300x, 1800x

## Storage and Caching

### IndexedDB Caching

The library automatically caches data in browser storage:

```tsx
import { IndexedDBService } from 'react-github-timeline/services';

// Save commits to cache
await IndexedDBService.saveCommits('facebook/react', commits);

// Load from cache
const cached = await IndexedDBService.loadCommits('facebook/react');

// Check cache info
const info = await IndexedDBService.getCacheInfo('facebook/react');
console.log(`Cache age: ${info.age}ms, Commits: ${info.commitCount}`);

// Clear specific cache
await IndexedDBService.clearCache('facebook/react');

// Clear all caches
await IndexedDBService.clearAllCaches();
```

**Cache Duration:** 24 hours (configurable)

### Storage Statistics

```tsx
const stats = await IndexedDBService.getStorageStats();
console.log(`Total caches: ${stats.totalCaches}`);
console.log(`Estimated size: ${stats.estimatedSize} bytes`);
```

## Common Integration Patterns

### Pattern 1: Simple Embedded Viewer

```tsx
function RepositoryViewer({ repoUrl }: { repoUrl: string }) {
  const [owner, repo] = parseGitHubUrl(repoUrl);

  return (
    <div className="w-full h-screen">
      <RepoTimeline
        owner={owner}
        repo={repo}
        width={window.innerWidth}
        height={window.innerHeight}
      />
    </div>
  );
}
```

### Pattern 2: Dashboard with Multiple Repos

```tsx
function Dashboard() {
  const repos = ['facebook/react', 'microsoft/vscode', 'vercel/next.js'];

  return (
    <div className="grid grid-cols-2 gap-4">
      {repos.map(repo => {
        const [owner, name] = repo.split('/');
        return (
          <div key={repo} className="border rounded p-4">
            <h2>{repo}</h2>
            <RepoTimeline owner={owner} repo={name} width={600} height={400} />
          </div>
        );
      })}
    </div>
  );
}
```

### Pattern 3: Repository Comparison Tool

```tsx
function ComparisonView() {
  const [repos, setRepos] = useState([
    { owner: 'facebook', repo: 'react' },
    { owner: 'vuejs', repo: 'core' }
  ]);

  return (
    <div className="flex gap-4">
      {repos.map(({ owner, repo }) => (
        <div key={`${owner}/${repo}`} className="flex-1">
          <RepoTimeline owner={owner} repo={repo} width={800} height={600} />
        </div>
      ))}
    </div>
  );
}
```

### Pattern 4: Custom Data Processing

```tsx
import { GitHubApiService } from 'react-github-timeline/services';
import { buildCommitFromFileState } from 'react-github-timeline/utils';

async function analyzeRepository(owner: string, repo: string) {
  const service = new GitHubApiService(`${owner}/${repo}`);
  const commits = await service.buildTimelineFromPRs();

  // Custom analysis
  const fileStats = commits.reduce((acc, commit) => {
    commit.files.forEach(file => {
      acc[file.path] = (acc[file.path] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  return {
    totalCommits: commits.length,
    mostChangedFiles: Object.entries(fileStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10),
    dateRange: {
      start: commits[0].date,
      end: commits[commits.length - 1].date
    }
  };
}
```

## TypeScript Integration

### Core Types

```typescript
import type {
  CommitData,
  FileNode,
  Edge,
  LoadProgress,
  PlaybackSpeed,
  PlaybackDirection
} from 'react-github-timeline';

// CommitData represents a single point in the timeline
interface CommitData {
  hash: string;
  message: string;
  author: string;
  date: Date;
  files: FileNode[];
  edges: Edge[];
}

// FileNode represents a file or directory in the graph
interface FileNode {
  id: string;
  path: string;
  name: string;
  type: 'file' | 'directory';
  size: number;
  x?: number;
  y?: number;
  z?: number;
}

// Edge represents a connection between nodes
interface Edge {
  source: string;
  target: string;
  type?: 'parent' | 'file';
}
```

### Service Interfaces

```typescript
// GitHub API Service
class GitHubApiService {
  constructor(repoPath: string, token?: string, workerUrl?: string);

  fetchMergedPRs(onProgress?: (progress: LoadProgress) => void): Promise<GitHubPR[]>;
  fetchPRFiles(prNumber: number): Promise<GitHubPRFile[]>;
  buildTimelineFromPRs(onProgress?: (progress: LoadProgress) => void): Promise<CommitData[]>;
  getRateLimitInfo(): RateLimitInfo | null;
}

// IndexedDB Service
class IndexedDBService {
  static saveCommits(repoKey: string, commits: CommitData[]): Promise<boolean>;
  static loadCommits(repoKey: string): Promise<CommitData[] | null>;
  static clearCache(repoKey: string): Promise<boolean>;
  static clearAllCaches(): Promise<boolean>;
  static getCacheInfo(repoKey: string): Promise<CacheInfo>;
  static getStorageStats(): Promise<StorageStats>;
}
```

## Error Handling

### Rate Limiting

```tsx
import { GitHubApiService } from 'react-github-timeline/services';

try {
  const service = new GitHubApiService('facebook/react');
  const commits = await service.buildTimelineFromPRs();

  const rateLimit = service.getRateLimitInfo();
  if (rateLimit && rateLimit.remaining < 10) {
    console.warn('Rate limit low:', rateLimit);
  }
} catch (error) {
  if (error.message.includes('rate limit exceeded')) {
    // Handle rate limit error
    console.error('Please provide a GitHub token or wait for rate limit reset');
  }
}
```

### Repository Access Errors

```tsx
try {
  const service = new GitHubApiService('private/repo');
  await service.fetchMergedPRs();
} catch (error) {
  if (error.message.includes('Unable to access repository')) {
    // Repository not found or private
    console.error('Repository not accessible. Check the name or provide authentication.');
  } else if (error.message.includes('404')) {
    // Repository doesn't exist
    console.error('Repository not found');
  }
}
```

### Cache Errors

```tsx
try {
  await IndexedDBService.saveCommits('repo/key', commits);
} catch (error) {
  // IndexedDB might be unavailable (private browsing, storage full)
  console.warn('Cache unavailable, proceeding without cache:', error);
}
```

## Performance Optimization

### 1. Use Cloudflare Workers for Production

```tsx
// Development
<RepoTimeline owner="facebook" repo="react" />

// Production (much faster, cached)
<RepoTimeline
  owner="facebook"
  repo="react"
  workerUrl="https://your-worker.workers.dev"
/>
```

### 2. Adjust Performance Limits

For smaller/older devices:

```tsx
<RepoTimeline
  owner="facebook"
  repo="react"
  maxNodes={300}
  maxEdges={500}
/>
```

### 3. Lazy Load Components

```tsx
import { lazy, Suspense } from 'react';

const RepoTimeline = lazy(() => import('react-github-timeline').then(m => ({ default: m.RepoTimeline })));

function App() {
  return (
    <Suspense fallback={<div>Loading visualization...</div>}>
      <RepoTimeline owner="facebook" repo="react" />
    </Suspense>
  );
}
```

### 4. Debounce User Interactions

```tsx
import { useDebouncedCallback } from 'use-debounce';

function TimelineViewer() {
  const [searchTerm, setSearchTerm] = useState('');

  const debouncedSearch = useDebouncedCallback((value: string) => {
    // Filter commits or nodes
    setSearchTerm(value);
  }, 300);

  return (
    <>
      <input onChange={(e) => debouncedSearch(e.target.value)} />
      <RepoTimeline owner="facebook" repo="react" />
    </>
  );
}
```

## Testing Integration

### Unit Testing Components

```tsx
import { render, screen } from '@testing-library/react';
import { RepoInput } from 'react-github-timeline';

test('validates repository input', () => {
  render(<RepoInput onRepoSelect={vi.fn()} />);

  const input = screen.getByPlaceholderText(/owner\/repo/i);
  fireEvent.change(input, { target: { value: 'invalid' } });
  fireEvent.submit(input.closest('form')!);

  expect(screen.getByText(/Invalid format/i)).toBeInTheDocument();
});
```

### Mocking Services

```tsx
import { vi } from 'vitest';
import { GitHubApiService } from 'react-github-timeline/services';

vi.mock('react-github-timeline/services', () => ({
  GitHubApiService: vi.fn().mockImplementation(() => ({
    fetchMergedPRs: vi.fn().mockResolvedValue([]),
    buildTimelineFromPRs: vi.fn().mockResolvedValue([])
  }))
}));

test('handles empty repository', async () => {
  const { container } = render(<RepoTimeline owner="test" repo="empty" />);

  await waitFor(() => {
    expect(container.textContent).toContain('No commits found');
  });
});
```

## Bundle Size Optimization

The library is designed to be tree-shakeable. Import only what you need:

```tsx
// Import only specific components (smaller bundle)
import { RepoInput } from 'react-github-timeline/components';
import { GitHubApiService } from 'react-github-timeline/services';

// Instead of importing everything
// import * as Timeline from 'react-github-timeline';
```

**Bundle Sizes:**
- UMD bundle: ~17.5 KB gzipped
- ESM tree-shaken: ~12 KB gzipped (typical usage)

## Accessibility

The library includes accessibility features:

- Keyboard navigation for controls
- ARIA labels on interactive elements
- Screen reader compatible timeline information
- High contrast mode support

```tsx
<RepoTimeline
  owner="facebook"
  repo="react"
  aria-label="Repository timeline visualization"
/>
```

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (IndexedDB available)
- Mobile browsers: Limited (3D performance varies)

**Minimum Requirements:**
- ES2020 JavaScript features
- WebGL for 3D rendering
- IndexedDB for caching (degrades gracefully if unavailable)

## Common Issues and Solutions

### Issue: "Rate limit exceeded"

**Solution:** Provide a GitHub personal access token:

```tsx
<RepoTimeline
  owner="facebook"
  repo="react"
  githubToken={process.env.GITHUB_TOKEN}
/>
```

### Issue: Slow initial load

**Solution:** Use Cloudflare Workers or implement loading states:

```tsx
function App() {
  const [loading, setLoading] = useState(true);

  return (
    <>
      {loading && <LoadingSpinner />}
      <RepoTimeline
        owner="facebook"
        repo="react"
        onLoadComplete={() => setLoading(false)}
      />
    </>
  );
}
```

### Issue: Graph too cluttered

**Solution:** Reduce performance limits:

```tsx
<RepoTimeline
  owner="facebook"
  repo="react"
  maxNodes={200}
  maxEdges={400}
/>
```

### Issue: Memory issues with large repos

**Solution:** Enable incremental loading:

```tsx
<RepoTimeline
  owner="facebook"
  repo="react"
  loadIncrementally={true}
  initialCommitCount={50}
/>
```

## Additional Resources

- **Documentation:** https://github.com/rjwalters/github-timeline#readme
- **API Reference:** See `EMBEDDING.md` for detailed prop documentation
- **Worker Deployment:** See `WORKER_DEPLOYMENT.md` for Cloudflare Workers setup
- **Example App:** https://github-timeline.rjwalters.workers.dev
- **GitHub Issues:** https://github.com/rjwalters/github-timeline/issues

## Example Projects

### Full-Featured Application

```tsx
import { useState } from 'react';
import {
  RepoTimeline,
  RepoInput,
  RateLimitDisplay
} from 'react-github-timeline';

function GitHubTimelineApp() {
  const [repo, setRepo] = useState({ owner: 'facebook', repo: 'react' });
  const [rateLimit, setRateLimit] = useState(null);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="p-4 border-b border-gray-700">
        <h1 className="text-2xl font-bold mb-4">GitHub Timeline</h1>
        <RepoInput
          defaultValue={`${repo.owner}/${repo.repo}`}
          onRepoSelect={(owner, name) => setRepo({ owner, repo: name })}
        />
        <RateLimitDisplay {...rateLimit} />
      </header>

      <main className="p-4">
        <RepoTimeline
          owner={repo.owner}
          repo={repo.repo}
          width={window.innerWidth - 32}
          height={window.innerHeight - 200}
          onRateLimitUpdate={setRateLimit}
        />
      </main>
    </div>
  );
}

export default GitHubTimelineApp;
```

## Security Considerations

1. **Never expose GitHub tokens in client-side code**
   - Use environment variables
   - Proxy through your backend
   - Use Cloudflare Workers for production

2. **Validate repository input**
   - The library includes built-in validation
   - Sanitize user input before API calls

3. **Rate limiting**
   - Implement token refresh logic
   - Cache aggressively to reduce API calls
   - Use Cloudflare Workers for better rate limit management

## License

This library is open source. Check the repository for license details.

---

For questions, issues, or contributions, visit: https://github.com/rjwalters/github-timeline
