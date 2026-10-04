// Copied into the pinned Platane/snk checkout before bundling.
import { mkdir, writeFile } from 'node:fs/promises';
import { mergeContributions } from './merge-contributions.mjs';
import { getGithubUserContribution } from './packages/github-user-contribution';
import { cellsToGrid } from './packages/generate-snake-animation/cellsToGrid';
import { parseOutputsOption } from './packages/generate-snake-animation/outputsOptions';
import { getBestRoute } from './packages/solver/getBestRoute';
import { getPathToPose } from './packages/solver/getPathToPose';
import { snake4 } from './packages/types/__fixtures__/snake';
import { createSvg } from './packages/svg-creator';

const token = process.env.STATS_PAT;
if (!token) throw new Error('STATS_PAT is required');
const endDate = new Date().toISOString().slice(0, 10);
const [primary, secondary, gitlabResponse] = await Promise.all([
  getGithubUserContribution('amulifts', { githubToken: token }),
  getGithubUserContribution('amankworks', { githubToken: process.env.AMANKWORKS_PAT || process.env.GITHUB_TOKEN || token }),
  fetch('https://gitlab.com/users/amankworks/calendar.json', { signal: AbortSignal.timeout(30000) }),
]);
if (!gitlabResponse.ok) throw new Error(`GitLab calendar returned HTTP ${gitlabResponse.status}`);
const calendar = await gitlabResponse.json();
if (!calendar || Array.isArray(calendar) || typeof calendar !== 'object') throw new Error('Invalid GitLab calendar');
const gitlab = Object.entries(calendar).map(([date, count]) => ({ date, count }));
const cells = mergeContributions([primary, secondary, gitlab], endDate);
const grid = cellsToGrid(cells);
const chain = getBestRoute(grid, snake4);
if (!chain) throw new Error('Could not solve snake route');
const returnPath = getPathToPose(chain[chain.length - 1], snake4);
if (!returnPath) throw new Error('Could not close snake route');
chain.push(...returnPath);
await mkdir('dist', { recursive: true });
for (const out of parseOutputsOption([
  'dist/github-contribution-grid-snake.svg',
  'dist/github-contribution-grid-snake-dark.svg?palette=github-dark',
])) {
  if (!out) throw new Error('Invalid output configuration');
  await writeFile(out.filename, createSvg(grid, cells, chain, out.drawOptions, out.animationOptions));
}
console.log(`Generated combined snake through ${endDate} from all three sources.`);
