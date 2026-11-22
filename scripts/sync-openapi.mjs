// Refreshes openapi/openapi.json from the deployed API, so the generated client matches what is live.
// Usage: npm run api:sync            (uses EXPO_PUBLIC_API_URL, or the hosted review API)
import { writeFile } from 'node:fs/promises';

const base =
  process.env.EXPO_PUBLIC_API_URL ?? 'https://wide-impact-joinly-backend-production.up.railway.app';
const url = `${base.replace(/\/$/, '')}/openapi.json`;

const response = await fetch(url);
if (!response.ok) {
  console.error(`GET ${url} failed with ${response.status}`);
  process.exit(1);
}
const document = await response.json();
await writeFile(
  new URL('../openapi/openapi.json', import.meta.url),
  `${JSON.stringify(document, null, 2)}\n`,
);
console.warn(`Saved ${url} to openapi/openapi.json`);
