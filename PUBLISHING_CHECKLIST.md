# Publishing Checklist for v0.1.0

## Current Status

✅ **Completed:**
- GitHub repository renamed from `repo-timeline` to `github-timeline`
- All code references updated to new repo name
- Package name is `react-github-timeline`
- All tests passing (265 tests, 85.68% coverage)
- Both library and demo builds successful
- CI/CD workflows passing
- GitHub Pages deployed at https://rjwalters.github.io/github-timeline/
- Git remote URL updated to new repo
- LICENSE file (MIT) created
- CHANGELOG.md finalized for v0.1.0
- ✅ **Package published to npm as v0.1.0** 🎉
- ✅ **npm authentication verified** (logged in as rjwalters)
- ✅ **Package tested locally with npm pack** (imports work correctly)
- ✅ **Verified package installation from npm registry**
- ✅ **GitHub release created** (v0.1.0)
- ✅ **npm and license badges added to README**
- ✅ **Related Projects section added to README**

⚠️ **Pending:**
- Local directory still named `/Users/rwalters/GitHub/repo-timeline` (needs manual rename + Claude Code restart)

## Next Steps

### 1. Test Package Locally (DO THIS FIRST)

```bash
cd /Users/rwalters/GitHub/repo-timeline

# Create local tarball
pnpm pack
# This creates: react-github-timeline-0.1.0.tgz

# Test in a temporary directory
cd /tmp
mkdir test-react-github-timeline
cd test-react-github-timeline

# Create a minimal test project
npm init -y
npm install /Users/rwalters/GitHub/repo-timeline/react-github-timeline-0.1.0.tgz
npm install react@^18.0.0 react-dom@^18.0.0 three@^0.160.0 @react-three/fiber@^8.0.0 @react-three/drei@^9.0.0

# Create test file: test.mjs
cat > test.mjs << 'EOF'
import { RepoTimeline } from 'react-github-timeline';
console.log('✅ Import successful:', typeof RepoTimeline);
console.log('✅ RepoTimeline is:', RepoTimeline);
EOF

# Test the import
node test.mjs

# If successful, you should see:
# ✅ Import successful: function
# ✅ RepoTimeline is: [Function: RepoTimeline]
```

### 2. Verify npm Authentication

```bash
# Check if logged in to npm
npm whoami

# If not logged in:
npm login
# Enter credentials for npm account that owns the package name
```

### 3. Final Pre-publish Checks

```bash
cd /Users/rwalters/GitHub/repo-timeline

# Verify package.json is correct
cat package.json | grep -E '"name"|"version"|"license"|"main"|"module"|"types"'

# Run full CI checks
pnpm check

# Verify dist/ directory exists and contains correct files
ls -la dist/
# Should have: index.js, index.umd.js, index.d.ts

# Verify files that will be published
npm pack --dry-run
```

### 4. Publish to npm

```bash
cd /Users/rwalters/GitHub/repo-timeline

# Final check: make sure we're on main and everything is committed
git status

# Publish to npm (this is the big moment!)
npm publish

# If successful, verify at:
# https://www.npmjs.com/package/react-github-timeline
```

### 5. Rename Local Directory

**IMPORTANT:** This requires restarting Claude Code after the rename.

```bash
# Exit Claude Code first, then in terminal:
cd /Users/rwalters/GitHub
mv repo-timeline github-timeline

# Restart Claude Code and open the new directory:
# /Users/rwalters/GitHub/github-timeline
```

### 6. Post-publish Verification

After publishing and restarting Claude Code:

```bash
# Test installing from npm
cd /tmp
mkdir test-from-npm
cd test-from-npm
npm init -y
npm install react-github-timeline
npm install react@^18.0.0 react-dom@^18.0.0 three@^0.160.0 @react-three/fiber@^8.0.0 @react-three/drei@^9.0.0

# Create test file
cat > test.mjs << 'EOF'
import { RepoTimeline } from 'react-github-timeline';
console.log('✅ npm package import successful:', typeof RepoTimeline);
EOF

node test.mjs

# Clean up
cd /tmp && rm -rf test-from-npm test-react-github-timeline
```

### 7. Update README with npm Badge

Add this badge after publishing:

```markdown
[![npm version](https://badge.fury.io/js/react-github-timeline.svg)](https://www.npmjs.com/package/react-github-timeline)
```

### 8. Create GitHub Release

```bash
cd /Users/rwalters/GitHub/github-timeline

# Create and push git tag
git tag v0.1.0
git push origin v0.1.0

# Create GitHub release using gh CLI
gh release create v0.1.0 \
  --title "v0.1.0 - Initial Development Release" \
  --notes "$(cat CHANGELOG.md | sed -n '/## \[0.1.0\]/,/## \[/p' | sed '$d')"
```

## Package Details

**Package Name:** `react-github-timeline`
**Version:** 0.1.0
**Registry:** https://www.npmjs.com/
**Repository:** https://github.com/rjwalters/github-timeline
**Demo:** https://rjwalters.github.io/github-timeline/

**Bundle Sizes:**
- ESM: 20.46 KB gzipped (limit: 18 KB) ⚠️ *slightly over*
- UMD: 16.36 KB gzipped (limit: 16.5 KB) ✅

**Files Included in Package:**
- dist/index.js (ESM)
- dist/index.umd.js (UMD)
- dist/index.d.ts (TypeScript definitions)

## Troubleshooting

### "You must be logged in to publish packages"
```bash
npm login
```

### "You do not have permission to publish 'react-github-timeline'"
The package name might already be taken. Check https://www.npmjs.com/package/react-github-timeline

### "EPUBLISHCONFLICT: Cannot publish over existing version"
The version 0.1.0 is already published. Either:
- Use `npm version patch` to bump to 0.1.1
- Or unpublish first (only if < 72 hours): `npm unpublish react-github-timeline@0.1.0`

### Bundle size warnings
If bundle size is a concern, consider:
- Adding more devDependencies to external config in vite.config.ts
- Using dynamic imports for heavy dependencies
- Tree-shaking optimization

## Important Notes

- **Demo will continue using source imports** - This is intentional and recommended
- **Keep package.json private: false** - Required for public npm packages
- **No .npmignore needed** - Using `files: ["dist"]` in package.json is cleaner
- **peerDependencies are not bundled** - Users must install them separately

## After Publishing

Create a celebration commit! 🎉

```bash
git commit --allow-empty -m "🎉 Published v0.1.0 to npm

react-github-timeline is now available at:
https://www.npmjs.com/package/react-github-timeline

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
git push
```
