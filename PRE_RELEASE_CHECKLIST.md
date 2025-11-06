# Pre-Release Checklist

Use this checklist before cutting a new release of react-github-timeline.

## Version: 0.2.0 (Proposed)

### 1. Code Quality & Testing

- [ ] All tests passing locally
  ```bash
  pnpm test:coverage
  ```
  - Current coverage: 77.03%
  - Target: >75% (✓ Met)

- [ ] All tests passing in CI
  ```bash
  gh run list --branch main --limit 1
  ```

- [ ] Linting passes
  ```bash
  pnpm lint
  ```

- [ ] TypeScript compilation successful
  ```bash
  pnpm build
  ```

- [ ] No console errors/warnings in development mode
  ```bash
  pnpm dev
  ```

### 2. Build & Bundle

- [ ] Library build succeeds
  ```bash
  pnpm build
  ```
  - Verify `dist/` contains: `index.js`, `index.umd.js`, `index.d.ts`

- [ ] Demo build succeeds
  ```bash
  pnpm build:demo
  ```

- [ ] Bundle size within limits
  ```bash
  pnpm size
  ```
  - Current UMD limit: 17.5 KB
  - Should be: ~17 KB or less

- [ ] Check for unnecessary dependencies in bundle
  ```bash
  pnpm size:why
  ```

### 3. Documentation

- [ ] CHANGELOG.md updated with all changes since last release
  - New features documented
  - Bug fixes listed
  - Breaking changes highlighted (if any)
  - Migration guide added (if needed)

- [ ] README.md accurate and up-to-date
  - Installation instructions correct
  - Quick start example works
  - Live demo link works
  - Badges show correct status

- [ ] EMBEDDING.md reflects current API
  - All props documented
  - Examples work with current version
  - New features explained

- [ ] LLM_INTEGRATION.md up-to-date
  - New components documented
  - Integration patterns current
  - Code examples verified

- [ ] API Reference accurate
  - TypeScript types exported correctly
  - Public API surface documented
  - Deprecated APIs marked

### 4. Version Bump

- [ ] Update version in `package.json`
  ```bash
  # For feature release (0.1.x -> 0.2.0)
  npm version minor

  # For bug fix (0.1.0 -> 0.1.1)
  npm version patch

  # For breaking changes (0.x.x -> 1.0.0)
  npm version major
  ```

- [ ] Version matches CHANGELOG.md

- [ ] Version follows semver conventions

### 5. Dependencies

- [ ] All peer dependencies correct in `package.json`

- [ ] No unused dependencies
  ```bash
  pnpm why <package-name>
  ```

- [ ] Dependencies up-to-date (security patches)
  ```bash
  pnpm outdated
  ```

- [ ] Lock file updated
  ```bash
  pnpm install
  ```

### 6. Demo Site

- [ ] Demo builds without errors
  ```bash
  pnpm build:demo
  ```

- [ ] Demo works in local preview
  ```bash
  pnpm preview
  ```

- [ ] All example repositories load correctly
  - facebook/react
  - microsoft/vscode
  - rjwalters/bucket-brigade

- [ ] No console errors in demo

- [ ] Performance acceptable (check FPS overlay with 'P' key)

### 7. Worker Deployment (if changes made)

- [ ] Worker tests passing
  ```bash
  cd worker && pnpm test
  ```

- [ ] Worker builds successfully
  ```bash
  cd worker && pnpm build
  ```

- [ ] Worker deployed to Cloudflare
  ```bash
  cd worker && pnpm deploy
  ```

- [ ] Worker API endpoints tested
  - Cache status: `/api/cache/facebook/react`
  - Repository summary: `/api/repo/facebook/react`
  - Metadata: `/api/metadata`

- [ ] D1 database migrations applied (if any)
  ```bash
  cd worker && npx wrangler d1 migrations apply github-timeline-cache
  ```

### 8. Manual Testing

- [ ] Test with no GitHub token (rate limit handling)

- [ ] Test with GitHub token (higher limits)

- [ ] Test with Worker URL (cached data)

- [ ] Test with private repository (error handling)

- [ ] Test with non-existent repository (404 handling)

- [ ] Test incremental loading (load more commits)

- [ ] Test playback controls
  - Play/Pause
  - Speed changes (1x, 60x, 300x, 1800x)
  - Forward/Reverse
  - Skip to start/end
  - Scrubber

- [ ] Test IndexedDB caching
  - First load (fetches data)
  - Second load (uses cache)
  - Cache expiration (24 hours)
  - Clear cache button

- [ ] Test on different browsers
  - Chrome/Edge (latest)
  - Firefox (latest)
  - Safari (latest)

- [ ] Test responsive behavior (if applicable)

### 9. Git & GitHub

- [ ] All changes committed
  ```bash
  git status
  ```

- [ ] Working directory clean

- [ ] On main branch
  ```bash
  git branch --show-current
  ```

- [ ] Synced with remote
  ```bash
  git fetch origin
  git status
  ```

- [ ] All PRs merged

- [ ] No draft PRs that should be included

### 10. Release Process

- [ ] Create annotated git tag
  ```bash
  git tag -a v0.2.0 -m "Release v0.2.0: Test Coverage & Documentation Improvements"
  ```

- [ ] Push tag to GitHub
  ```bash
  git push origin v0.2.0
  ```

- [ ] Create GitHub Release
  ```bash
  gh release create v0.2.0 --title "v0.2.0" --notes-file RELEASE_NOTES.md
  ```
  - Copy relevant section from CHANGELOG.md
  - Add migration notes if needed
  - Attach demo link

- [ ] Publish to npm
  ```bash
  npm publish
  ```
  - Requires npm authentication
  - Will trigger `prepublishOnly` script (builds package)

- [ ] Verify npm package
  ```bash
  npm view react-github-timeline version
  npm view react-github-timeline
  ```

### 11. Post-Release

- [ ] Demo site deployed to GitHub Pages
  - Should auto-deploy via GitHub Actions

- [ ] Verify demo site live
  - https://rjwalters.github.io/github-timeline/

- [ ] npm package downloadable
  ```bash
  npx react-github-timeline@latest
  ```

- [ ] Create announcement (optional)
  - GitHub Discussions
  - Twitter/social media
  - Dev.to blog post

- [ ] Monitor for issues
  - Check GitHub Issues
  - Watch npm download stats
  - Monitor error tracking (if configured)

- [ ] Update related projects/dependencies
  - If you have other projects using this library

### 12. Rollback Plan (if needed)

If issues are discovered:

1. **Unpublish from npm** (if critical bug within 24 hours)
   ```bash
   npm unpublish react-github-timeline@0.2.0
   ```

2. **Deprecate version** (preferred for non-critical issues)
   ```bash
   npm deprecate react-github-timeline@0.2.0 "Contains bug XYZ, use 0.2.1 instead"
   ```

3. **Delete GitHub Release**
   ```bash
   gh release delete v0.2.0
   ```

4. **Delete git tag**
   ```bash
   git tag -d v0.2.0
   git push origin :refs/tags/v0.2.0
   ```

5. **Fix and release patch version** (0.2.1)

## Version 0.2.0 Changes

Based on recent work, this release should include:

### Added
- **Comprehensive Test Coverage** - Increased from 70% to 77%
  - New test suites: RepoStatusBanner, enhanced TimelineScrubber
  - 449 total tests (+38 from 0.1.1)
  - Better coverage of edge cases and error paths

- **LLM Integration Documentation** - New `LLM_INTEGRATION.md`
  - Comprehensive guide for AI assistants
  - Integration patterns and examples
  - TypeScript integration guide
  - Error handling strategies
  - Performance optimization tips

- **Project Context Documentation** - New `.claude/project-context.md`
  - Complete codebase architecture reference
  - Component relationships and data flow
  - Development patterns and conventions
  - Testing strategy and debugging tips

- **Dynamic Zoom Limits** - Automatic zoom bounds calculation
  - Prevents camera from zooming too close/far
  - Adapts to graph size automatically
  - Improves navigation experience

- **Configurable Performance Limits** - Props for controlling graph complexity
  - `maxNodes` prop (default: 500)
  - `maxEdges` prop (default: 1000)
  - Better performance on lower-end devices

### Changed
- **IndexedDB Migration** - From localStorage (in 0.1.1)
  - 10-200x storage capacity increase
  - Better performance for large repositories
  - Graceful fallback to localStorage

### Fixed
- **Bundle Size** - UMD limit increased to 17.5 KB
  - Accommodates new features
  - Still within reasonable limits

- **Test Reliability** - Resolved CI test failures
  - Better fake-indexeddb integration
  - More robust timer mocking
  - Fixed flaky tests

### Documentation
- All docs reviewed for clarity and consistency
- Added documentation index to README
- Standardized terminology across all files
- Added version compatibility notes

## Quick Release Command Sequence

```bash
# 1. Ensure everything is up to date
git checkout main
git pull origin main
pnpm install

# 2. Run full checks
pnpm check

# 3. Update CHANGELOG.md (manual step)
# Add new version section with changes

# 4. Bump version
npm version minor  # or patch/major

# 5. Build and verify
pnpm build
pnpm build:demo
pnpm size

# 6. Commit version bump (if not auto-committed)
git add .
git commit -m "Release v0.2.0"

# 7. Push to GitHub
git push origin main
git push origin --tags

# 8. Create GitHub Release
gh release create v0.2.0 --title "v0.2.0: Test Coverage & Documentation" --notes-file <(cat CHANGELOG.md | sed -n '/^## \[0.2.0\]/,/^## \[0.1.1\]/p' | head -n -1)

# 9. Publish to npm
npm publish

# 10. Verify
npm view react-github-timeline version
open https://rjwalters.github.io/github-timeline/
```

## Notes

- Always test in a staging environment before release
- Keep CHANGELOG.md updated throughout development
- Use semantic versioning strictly
- Document breaking changes clearly
- Provide migration guides for major versions
