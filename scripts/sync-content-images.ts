/**
 * scripts/sync-content-images.ts
 *
 * Pre-build step (npm "prebuild" hook). Mirrors content/images/projects/ (from
 * the Content repository, attached as a git submodule) into public/images/projects/
 * (the site's served path), and fails loudly if any project entry's thumbnail is
 * missing a required responsive variant.
 *
 * Runs before every `astro build`/`astro dev` so the site's existing
 * `/images/projects/...` URL scheme keeps resolving unchanged (SC-005).
 */
import { readdir, mkdir, copyFile, unlink, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { parse as parseYaml } from 'yaml';

const SOURCE_DIR = 'content/images/projects';
const DEST_DIR = 'public/images/projects';
const PROJECTS_DIR = 'content/projects';

/** Must match SRCSET_WIDTHS in src/utils/image.ts */
const WIDTHS = [400, 800, 1200] as const;
const FORMATS = ['jpg', 'webp'] as const;

interface ProjectFrontmatter {
  thumbnail?: { src?: string };
}

function log(msg: string): void {
  process.stdout.write(`[sync-content-images] ${msg}\n`);
}

function fail(msg: string): never {
  process.stderr.write(`[sync-content-images] ERROR: ${msg}\n`);
  process.exit(1);
}

async function ensureDir(dir: string): Promise<void> {
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
}

/**
 * Verifies every project entry's thumbnail has all its responsive variants
 * present under SOURCE_DIR, before anything is synced.
 */
async function verifyProjectImages(): Promise<void> {
  if (!existsSync(PROJECTS_DIR)) {
    fail(
      `Content directory not found: ${PROJECTS_DIR} (is the content/ submodule initialized? ` +
        'run `git submodule update --init`)',
    );
  }

  const files = (await readdir(PROJECTS_DIR)).filter((f) => f.endsWith('.yaml'));

  for (const file of files) {
    const raw = await readFile(join(PROJECTS_DIR, file), 'utf-8');
    const data = parseYaml(raw) as ProjectFrontmatter;
    const src = data.thumbnail?.src;
    if (!src) continue; // missing required field is caught by schema validation, not here

    const base = basename(src, extname(src));

    for (const width of WIDTHS) {
      for (const format of FORMATS) {
        const variant = `${base}-${width}w.${format}`;
        if (!existsSync(join(SOURCE_DIR, variant))) {
          fail(
            `Project "${file}" references thumbnail "${src}", but its variant "${variant}" ` +
              `is missing from ${SOURCE_DIR}/`,
          );
        }
      }
    }
  }
}

/** Copies new/changed files from SOURCE_DIR to DEST_DIR, removing stale destination files. */
async function listFiles(dir: string): Promise<string[]> {
  if (!existsSync(dir)) return [];
  const entries = await readdir(dir, { withFileTypes: true });
  return entries.filter((e) => e.isFile()).map((e) => e.name);
}

async function syncImages(): Promise<void> {
  await ensureDir(DEST_DIR);

  const sourceFiles = await listFiles(SOURCE_DIR);
  const destFiles = await listFiles(DEST_DIR);
  const sourceSet = new Set(sourceFiles);

  for (const file of sourceFiles) {
    await copyFile(join(SOURCE_DIR, file), join(DEST_DIR, file));
  }

  for (const file of destFiles) {
    if (!sourceSet.has(file)) {
      await unlink(join(DEST_DIR, file));
      log(`Removed stale ${file}`);
    }
  }

  log(`Synced ${sourceFiles.length} file(s) from ${SOURCE_DIR} to ${DEST_DIR}`);
}

async function main(): Promise<void> {
  await verifyProjectImages();
  await syncImages();
}

main().catch((err: unknown) => {
  fail(err instanceof Error ? err.message : String(err));
});
