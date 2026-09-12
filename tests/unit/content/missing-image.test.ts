/**
 * Unit test (T014): the sync script (scripts/sync-content-images.ts) exits
 * non-zero and names the file when a project entry's thumbnail.src has no
 * corresponding variant under content/images/projects/.
 *
 * @vitest-environment node
 */
import { describe, it, expect, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, renameSync } from 'node:fs';
import { join, resolve } from 'node:path';

const SCRIPT = resolve('scripts/sync-content-images.ts');
const TSX_BIN = resolve('node_modules/.bin/tsx');
const VARIANT = join('content', 'images', 'projects', 'colla-board-placeholder-400w.jpg');
const MOVED_ASIDE = `${VARIANT}.test-backup`;

describe('sync-content-images: missing variant', () => {
  afterEach(() => {
    if (existsSync(MOVED_ASIDE)) {
      renameSync(MOVED_ASIDE, VARIANT);
    }
  });

  it('fails loudly, naming the missing file, when a referenced variant is absent', () => {
    expect(existsSync(VARIANT)).toBe(true);
    renameSync(VARIANT, MOVED_ASIDE);

    let stderr = '';
    let exitCode = 0;
    try {
      execFileSync(TSX_BIN, [SCRIPT], { stdio: 'pipe' });
    } catch (err) {
      const e = err as { status?: number; stderr: Buffer };
      exitCode = e.status ?? 1;
      stderr = e.stderr.toString();
    }

    expect(exitCode).not.toBe(0);
    expect(stderr).toContain('colla-board-placeholder-400w.jpg');
  });
});
