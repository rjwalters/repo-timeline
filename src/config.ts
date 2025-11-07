/**
 * Application configuration constants
 */

/**
 * Cloudflare Worker URL for cached GitHub data
 * This worker provides faster access to repository data by caching
 * GitHub API responses and avoiding rate limits
 */
export const WORKER_URL =
	"https://github-timeline-api.personal-account-251.workers.dev";

/**
 * Test mode flag - when true, shows hardcoded test data instead of real repo data
 * Useful for debugging visualization features without API calls
 */
export const TEST_MODE = false;
