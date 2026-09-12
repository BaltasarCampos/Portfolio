/**
 * Vitest global setup.
 *
 * Astro's Content Layer persists loaded collection data to a JSON "data store"
 * file whose location depends on the command context: `astro sync`/`astro build`
 * write to `node_modules/.astro/data-store.json`, while `astro dev` (and Vitest,
 * which runs Vite in "serve" mode via getViteConfig()) read from
 * `.astro/data-store.json` at the project root. Running `astro sync` alone
 * therefore leaves the file Vitest actually reads from missing/stale. Mirror it
 * here so tests importing `astro:content` see current content.
 */
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';

const BUILD_STORE = join('node_modules', '.astro', 'data-store.json');
const DEV_STORE_DIR = '.astro';
const DEV_STORE = join(DEV_STORE_DIR, 'data-store.json');

export default function setup(): void {
  execSync('npx astro sync', { stdio: 'inherit' });

  if (!existsSync(BUILD_STORE)) {
    throw new Error(`Expected ${BUILD_STORE} to exist after \`astro sync\`, but it does not.`);
  }

  if (!existsSync(DEV_STORE_DIR)) mkdirSync(DEV_STORE_DIR, { recursive: true });
  copyFileSync(BUILD_STORE, DEV_STORE);
}
