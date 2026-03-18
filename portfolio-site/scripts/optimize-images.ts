/**
 * scripts/optimize-images.ts
 * Image optimization pipeline using Sharp (T063–T065).
 *
 * Usage:
 *   npm run optimize-images
 *
 * Source images:  public/images/projects/src/   ← place originals here
 * Output images:  public/images/projects/        ← optimized variants land here
 *
 * For each source image it produces:
 *   - <name>-400w.webp    (WebP, 400px wide)
 *   - <name>-800w.webp    (WebP, 800px wide)
 *   - <name>-1200w.webp   (WebP, 1200px wide)
 *   - <name>-400w.jpg     (JPEG fallback, 400px wide)
 *   - <name>-800w.jpg     (JPEG fallback, 800px wide)
 *   - <name>-1200w.jpg    (JPEG fallback, 1200px wide)
 *
 * These filenames match exactly what buildSrcSet() in src/utils/image.ts expects.
 */

import sharp from 'sharp';
import { readdir, mkdir } from 'node:fs/promises';
import { join, basename, extname } from 'node:path';
import { existsSync } from 'node:fs';

// ─── Configuration ────────────────────────────────────────────────────────────

const INPUT_DIR = 'public/images/projects/src';
const OUTPUT_DIR = 'public/images/projects';

/** Must match SRCSET_WIDTHS in src/utils/image.ts */
const WIDTHS = [400, 800, 1200] as const;

const QUALITY = {
  webp: 82,
  jpeg: 85,
} as const;

const SUPPORTED_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.tiff', '.bmp']);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function log(msg: string) {
  process.stdout.write(`[optimize-images] ${msg}\n`);
}

async function ensureDir(dir: string) {
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
}

async function processImage(inputPath: string, outputDir: string): Promise<void> {
  const ext = extname(inputPath).toLowerCase();
  if (!SUPPORTED_EXTS.has(ext)) return;

  const name = basename(inputPath, ext);

  for (const width of WIDTHS) {
    // WebP variant
    await sharp(inputPath)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: QUALITY.webp })
      .toFile(join(outputDir, `${name}-${width}w.webp`));

    // JPEG fallback
    await sharp(inputPath)
      .resize({ width, withoutEnlargement: true })
      .jpeg({ quality: QUALITY.jpeg, progressive: true, mozjpeg: true })
      .toFile(join(outputDir, `${name}-${width}w.jpg`));
  }

  log(`✓ ${name}${ext} → ${WIDTHS.map((w) => `${w}w`).join(', ')} (webp + jpg)`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!existsSync(INPUT_DIR)) {
    await mkdir(INPUT_DIR, { recursive: true });
    log(`Created ${INPUT_DIR} — place your original images there and re-run.`);
    process.exit(0);
  }

  await ensureDir(OUTPUT_DIR);

  const files = await readdir(INPUT_DIR);
  const images = files.filter((f) => SUPPORTED_EXTS.has(extname(f).toLowerCase()));

  if (images.length === 0) {
    log(`No supported images found in ${INPUT_DIR}`);
    log('Place your original project screenshots there and re-run.');
    process.exit(0);
  }

  log(`Processing ${images.length} image(s) from ${INPUT_DIR} → ${OUTPUT_DIR}`);

  const results = await Promise.allSettled(
    images.map((file) => processImage(join(INPUT_DIR, file), OUTPUT_DIR)),
  );

  const failed = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
  if (failed.length > 0) {
    for (const f of failed) {
      log(`✗ Error: ${String(f.reason)}`);
    }
    process.exit(1);
  }

  log(`Done. ${images.length} image(s) optimized.`);
}

main().catch((err) => {
  log(`Fatal: ${String(err)}`);
  process.exit(1);
});
