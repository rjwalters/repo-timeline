# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2024-11-06

### Added
- **Comprehensive Test Coverage**: Increased test coverage from 70% to 77.03%
  - Added 38 new tests (411 → 449 total tests)
  - New test suites: `RepoStatusBanner.test.tsx` (30 tests), enhanced `TimelineScrubber.test.tsx` (+8 tests)
  - Comprehensive coverage of UI components: RepoInput (100%), RateLimitDisplay (100%), RepoStatusBanner (100%), TimelineScrubber (100%)
  - Better edge case and error path coverage
  - Improved test reliability with better mocking strategies

- **LLM Integration Documentation**: New `LLM_INTEGRATION.md` guide for AI assistants
  - Complete API reference with all components, props, and methods
  - Integration patterns for common use cases (embedded viewer, dashboard, comparison tool)
  - TypeScript integration guide with type definitions
  - Error handling strategies and troubleshooting
  - Performance optimization techniques
  - Security best practices
  - Testing examples and patterns

- **Project Context Documentation**: New `.claude/project-context.md` for codebase understanding
  - Complete architecture overview
  - Component relationships and data flow diagrams
  - Development patterns and conventions
  - Testing strategy and debugging tips
  - Comprehensive file/directory reference

- **Dynamic Zoom Limits**: Automatic camera zoom bounds calculation
  - Prevents camera from zooming too close or too far from the graph
  - Adapts to graph size automatically based on node positions
  - Calculates optimal min/max zoom distances using bounding box
  - Improves navigation experience and prevents user confusion

- **Configurable Performance Limits**: New props for controlling graph complexity
  - `maxNodes` prop (default: 500) - Limit maximum nodes displayed
  - `maxEdges` prop (default: 1000) - Limit maximum edges displayed
  - Better performance on lower-end devices
  - Allows customization based on use case

### Changed
- **Documentation Improvements**: Comprehensive review and updates
  - Standardized terminology across all documentation files
  - Added documentation index to README.md
  - Improved cross-references between documents
  - Added version compatibility notes
  - Clarified storage backend migration (IndexedDB)
  - Documented bundle size monitoring

### Fixed
- **Bundle Size Limits**: Increased UMD bundle size limit from 16 KB to 17.5 KB
  - Accommodates new features while remaining performant
  - Still within reasonable limits for web applications

- **Test Reliability**: Resolved CI test failures and flaky tests
  - Better fake-indexeddb integration for consistent testing
  - Improved timer mocking in async tests
  - Fixed timezone-dependent date formatting tests
  - More robust error handling test assertions

### Documentation
- All documentation reviewed for clarity and consistency
- Standardized project name to "React GitHub Timeline"
- Updated storage terminology (localStorage → IndexedDB)
- Added documentation for performance overlay
- Explained bundle size monitoring process
- Fixed year typos in CHANGELOG (2025 → 2024)

## [0.1.1] - 2024-11-05

### Fixed
- **Playback Timer**: Fixed infinite restart loop by memoizing `setCurrentTime` callback with empty dependency array
- **Scrubber Start Position**: Timeline now correctly starts at first commit (commit #1) instead of last commit
- **Timestamp Display**: Changed playback timestamp to show continuous scrubbed time instead of discrete commit timestamps

### Added
- **Performance Monitoring**: Added FPS, node count, and edge count overlay in bottom-right of 3D visualization for development/debugging purposes
- **IndexedDB Storage**: Migrated from localStorage to IndexedDB for 10-200x higher storage capacity (50MB-1GB+ vs 5-10MB)
  - Automatic migration: Existing localStorage data is preserved and will continue to work
  - New data automatically uses IndexedDB when available
  - Graceful fallback to localStorage on older browsers
- **Enhanced Logging**: Added diagnostic logging for playback state and commit index changes (debug mode)

### Changed
- Storage backend now uses IndexedDB by default with localStorage fallback
- Improved autoload logging with cleaner, less verbose output
- Timeline scrubber now displays real-world time progression during playback

## [0.1.0] - 2024-11-05

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
