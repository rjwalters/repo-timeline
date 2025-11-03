# Codecov Setup Instructions

This repository is now configured for coverage reporting with Codecov. To complete the setup:

## Steps to Enable Codecov

1. **Sign up/Login to Codecov**
   - Go to https://codecov.io/
   - Sign in with your GitHub account

2. **Add Your Repository**
   - Navigate to https://app.codecov.io/gh/rjwalters/repo-timeline
   - Click "Setup repo" if prompted
   - Codecov will automatically detect the repository once you push changes

3. **Get Your Upload Token**
   - In the Codecov dashboard for your repo, go to Settings
   - Find your upload token (CODECOV_TOKEN)

4. **Add Token to GitHub Secrets**
   - Go to your GitHub repository: https://github.com/rjwalters/repo-timeline
   - Navigate to Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `CODECOV_TOKEN`
   - Value: Paste your Codecov upload token
   - Click "Add secret"

5. **Push Your Changes**
   - Commit and push the coverage setup changes
   - The GitHub Actions workflow will automatically upload coverage reports
   - The coverage badge in README.md will start showing real data

## What's Already Configured

✅ Vitest with v8 coverage provider
✅ Coverage reports in multiple formats (text, json, html, lcov)
✅ GitHub Actions workflow (`.github/workflows/test.yml`)
✅ Codecov action configured in workflow
✅ Coverage badge in README.md
✅ Test command runs before deployment

## Testing Locally

Run tests with coverage locally:

```bash
pnpm test:coverage
```

Coverage reports will be generated in the `coverage/` directory:
- `coverage/index.html` - Interactive HTML report
- `coverage/lcov.info` - LCOV format for Codecov

## Alternative: Using Codecov Without Token

As of Codecov v5, the token is optional for public repositories. The workflow will work without it, but adding the token provides:
- More reliable uploads
- Better integration features
- Detailed analytics

If you prefer not to use a token, you can remove the `token` line from `.github/workflows/test.yml`.
