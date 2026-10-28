import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { unzipSync } from 'fflate';

const cacheDir = join(dirname(fileURLToPath(import.meta.url)), '..', '.cache');

const sources = [
  {
    url: 'https://github.com/michmech/BuNaMo/archive/refs/heads/master.zip',
    outDir: join(cacheDir, 'bunamo-verbs'),
    keep: (path: string) => /\/verb\/[^/]+\.xml$/.test(path) || /\/LICENCE$/.test(path),
    flatten: true,
  },
  {
    url: 'https://github.com/michmech/Gramadan/archive/refs/heads/master.zip',
    outDir: join(cacheDir, 'gramadan-src'),
    keep: (path: string) => /^Gramadan-master\/(Gramadan\/[^/]+\.cs|LICENCE)$/.test(path),
    flatten: false,
  },
];

for (const source of sources) {
  console.log(`Downloading ${source.url}`);
  const response = await fetch(source.url);
  if (!response.ok) throw new Error(`${source.url}: HTTP ${response.status}`);
  const archive = unzipSync(new Uint8Array(await response.arrayBuffer()), {
    filter: (file) => source.keep(file.name),
  });
  let count = 0;
  for (const [path, bytes] of Object.entries(archive)) {
    const relative = source.flatten ? path.split('/').at(-1)! : path.replace(/^[^/]+\//, '');
    const target = join(source.outDir, relative);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, bytes);
    count++;
  }
  console.log(`  extracted ${count} files to ${source.outDir}`);
}
