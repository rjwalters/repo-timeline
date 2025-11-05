# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2025-11-05

### Fixed
- **Playback Timer**: Fixed infinite restart loop by memoizing `setCurrentTime` callback with empty dependency array
- **Scrubber Start Position**: Timeline now correctly starts at first commit (commit #1) instead of last commit
- **Timestamp Display**: Changed playback timestamp to show continuous scrubbed time instead of discrete commit timestamps

### Added
- **Performance Monitoring**: Added FPS, node count, and edge count overlay in bottom-right of 3D visualization
- **IndexedDB Storage**: Migrated from localStorage to IndexedDB for 10-200x higher storage capacity (50MB-1GB+ vs 5-10MB)
- **Enhanced Logging**: Added diagnostic logging for playback state and commit index changes (debug mode)

### Changed
- Storage backend now uses IndexedDB by default with localStorage fallback
- Improved autoload logging with cleaner, less verbose output
- Timeline scrubber now displays real-world time progression during playback

## [0.1.0] - 2025-11-05

Initial development release of react-github-timeline

### Features

**Core Visualization**
- 3D force-directed graph visualization using React Three Fiber
- Real-time physics simulation with d3-force-3d
- File size visualization with logarithmic scaling
- Smooth animations for file additions, modifications, and deletions
- Interactive node selection and camera controls
- Reset camera view button

**Data Loading**
- Direct GitHub API integration (works without any backend service)
- Optional GitHub token support for higher rate limits (5,000/hour vs 60/hour)
- Optional Cloudflare Worker support for caching and performance
- Smart localStorage caching to reduce API calls
- Incremental data loading with progress indicators
- Autoload additional commits when approaching timeline end

**Timeline Controls**
- Interactive playback with play/pause functionality
- Multiple speed options: 1x, 60x, 300x, 1800x
- Forward and reverse playback direction
- Timeline scrubber for direct navigation
- Commit info display with file change statistics
- Toggleable controls via props

**npm Package**
- Published as `react-github-timeline`
- Full TypeScript support with declaration files
- ESM and UMD bundle formats
- React component with comprehensive props API
- Peer dependencies: React 18+, Three.js, React Three Fiber
- Well-documented usage examples

**Error Handling**
- Clear error messages for private/inaccessible repositories
- GitHub API rate limit detection and reporting
- Graceful fallbacks and retry mechanisms

### Technical Details
- Bundle size: ~16 KB (gzipped)
- 265 automated tests with coverage
- Built with Vite and TypeScript
- Styled with Tailwind CSS
- CI/CD with GitHub Actions
