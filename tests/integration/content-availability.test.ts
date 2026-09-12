/**
 * Integration test (T016): the build fails with a clear, identifiable error
 * when the `content/` submodule is absent or uninitialized (simulating an
 * unreachable Content repository, per quickstart.md §3c).
 *
 * Runs the pre-build sync script (scripts/sync-content-images.ts) against an
 * empty scratch directory standing in for a repository whose `content/`
 * submodule was never checked out — rather than mutating the real, shared
 * `content/` submodule, which other tests read concurrently.
 *
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const SCRIPT = resolve('scripts/sync-content-images.ts');
const TSX_BIN = resolve('node_modules/.bin/tsx');

describe('sync-content-images: unreachable content', () => {
  it('fails loudly with a clear error when content/ is missing entirely', () => {
    const scratchDir = mkdtempSync(join(tmpdir(), 'content-decoupling-unreachable-'));

    try {
      let stderr = '';
      let exitCode = 0;
      try {
        execFileSync(TSX_BIN, [SCRIPT], { cwd: scratchDir, stdio: 'pipe' });
      } catch (err) {
        const e = err as { status?: number; stderr: Buffer };
        exitCode = e.status ?? 1;
        stderr = e.stderr.toString();
      }

      expect(exitCode).not.toBe(0);
      expect(stderr).toMatch(/content\/projects/);
      expect(stderr).toMatch(/submodule/i);
    } finally {
      rmSync(scratchDir, { recursive: true, force: true });
    }
  });
});
