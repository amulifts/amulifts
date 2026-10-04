import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeContributions } from './merge-contributions.mjs';
test('sums matching days across platforms, excludes out-of-window dates, and aligns weekdays', () => {
  const cells = mergeContributions([
    [{ date: '2026-10-05', count: 2 }, { date: '2025-01-01', count: 100 }],
    [{ date: '2026-10-05', count: 3 }],
    [{ date: '2026-10-04', count: 4 }, { date: '2026-10-06', count: 100 }],
  ], '2026-10-05');
  assert.equal(cells.length, 365);
  assert.equal(cells.at(-1).count, 5);
  assert.equal(cells.at(-1).level, 4);
  assert.equal(cells.at(-1).y, 1);
  assert.equal(cells.at(-2).y, 0);
  assert.equal(cells.at(-2).x, cells.at(-1).x);
  assert.equal(cells.reduce((n, c) => n + c.count, 0), 9);
});
test('rejects missing, invalid, and duplicate data instead of silently dropping a source', () => {
  for (const source of [[], [{ date: '2026-10-05', count: -1 }], [{ date: '2026-10-05', count: 1 }, { date: '2026-10-05', count: 2 }]]) {
    assert.throws(() => mergeContributions([source], '2026-10-05'));
  }
});
test('zero activity produces empty cells without invalid levels', () => {
  const cells = mergeContributions([[{ date: '2026-10-05', count: 0 }]], '2026-10-05');
  assert.ok(cells.every(c => c.level === 0));
});
