/**
 * scripts/optimize-images.ts
 * Image optimization pipeline using Sharp (T063–T065).
 *
 * Usage:
 *   npm run optimize-images
 *   npm run optimize-images -- --input public/images/projects --output public/images/optimized
 *
 * For each source image it produces:
 *   - <name>.webp          (primary format, max 1200px wide)
 *   - <name>@2x.webp       (retina variant, max 2400px wide)
 *   - <name>.jpg           (JPEG fallback, max 1200px wide)
 *   - <name>-thumb.webp    (280px thumbnail for grid cards)
 */

import sharp from 'sharp';
import { readdir, mkdir } from 'node:fs/promises';
import { join, basename, extname } from 'node:path';
import { existsSync } from 'node:fs';

// ─── Configuration ────────────────────────────────────────────────────────────

const INPUT_DIR = process.argv[3] ?? 'public/images/projects';
const OUTPUT_DIR = process.argv[5] ?? 'public/images/optimized';

const SIZES = {
  standard: 1200,
  retina: 2400,
  thumbnail: 280,
} as const;

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
  const base = sharp(inputPath);
  const meta = await base.metadata();
  const srcWidth = meta.width ?? SIZES.standard;

  // Standard WebP
  const stdWidth = Math.min(srcWidth, SIZES.standard);
  await sharp(inputPath)
    .resize({ width: stdWidth, withoutEnlargement: true })
    .webp({ quality: QUALITY.webp })
    .toFile(join(outputDir, `${name}.webp`));

  // Retina WebP (only if source is large enough)
  if (srcWidth > SIZES.standard) {
    const retWidth = Math.min(srcWidth, SIZES.retina);
    await sharp(inputPath)
      .resize({ width: retWidth, withoutEnlargement: true })
      .webp({ quality: QUALITY.webp })
      .toFile(join(outputDir, `${name}@2x.webp`));
  }

  // JPEG fallback
  await sharp(inputPath)
    .resize({ width: stdWidth, withoutEnlargement: true })
    .jpeg({ quality: QUALITY.jpeg, progressive: true, mozjpeg: true })
    .toFile(join(outputDir, `${name}.jpg`));

  // Thumbnail WebP
  await sharp(inputPath)
    .resize({ width: SIZES.thumbnail, height: SIZES.thumbnail, fit: 'cover' })
    .webp({ quality: QUALITY.webp })
    .toFile(join(outputDir, `${name}-thumb.webp`));

  log(`✓ ${name}${ext} → webp + jpg + thumb`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!existsSync(INPUT_DIR)) {
    log(`Input directory not found: ${INPUT_DIR}`);
    log('Create the directory and add your project images, then re-run this script.');
    process.exit(0);
  }

  await ensureDir(OUTPUT_DIR);

  const files = await readdir(INPUT_DIR);
  const images = files.filter((f) => SUPPORTED_EXTS.has(extname(f).toLowerCase()));

  if (images.length === 0) {
    log(`No supported images found in ${INPUT_DIR}`);
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
