import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { cp, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

type AppArtifact = { file: string; url: string; sha256: string; version: string; bundle?: string };
const manifest = JSON.parse(await readFile(new URL('../config/apps.json', import.meta.url), 'utf8')) as Record<string, AppArtifact>;
const aliases: Record<string, string> = { android: 'android', ios: 'ios', 'ios-sim': 'iosSimulator' };
const target = process.argv[2] || 'android';
if (!Object.hasOwn(aliases, target) && target !== 'all') throw new Error('Usage: npm run apps:download -- android|ios|ios-sim|all');
await mkdir('apps', { recursive: true });
for (const name of target === 'all' ? ['android', 'ios', 'ios-sim'] : [target]) {
  const app = manifest[aliases[name]];
  const output = resolve('apps', app.file);
  const digest = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
  const existing = await readFile(output).catch(() => undefined);
  const alreadyVerified = Boolean(existing && digest(existing) === app.sha256);
  if (alreadyVerified) console.log(`${name} ${app.version}: existing file checksum verified`);
  else {
    const response = await fetch(app.url, { signal: AbortSignal.timeout(180_000) });
    if (!response.ok) throw new Error(`App download failed: HTTP ${response.status}`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (digest(bytes) !== app.sha256) throw new Error(`Checksum mismatch for ${app.file}; refusing to use artifact`);
    try {
      await writeFile(`${output}.part`, bytes);
      await rename(`${output}.part`, output);
    } finally { await rm(`${output}.part`, { force: true }); }
    console.log(`${name} ${app.version}: downloaded and SHA-256 verified at ${output}`);
  }
  if (!app.bundle) continue;
  const destination = resolve('apps', app.bundle);
  if (alreadyVerified && existsSync(destination)) {
    console.log(`${name} ${app.version}: simulator app already extracted`);
    continue;
  }
  await extractSimulator(output, destination);
}

async function extractSimulator(zip: string, destination: string) {
  const staging = resolve('apps', '.simulator-extract');
  await rm(staging, { recursive: true, force: true });
  await mkdir(staging, { recursive: true });
  try {
    const result = spawnSync('unzip', ['-qo', zip, '-d', staging], { encoding: 'utf8' });
    if (result.status !== 0) throw new Error(`Could not extract simulator app: ${result.stderr || result.stdout}`);
    const extracted = resolve(staging, 'Payload', 'My Demo App.app');
    if (!existsSync(extracted)) throw new Error('Simulator zip did not contain Payload/My Demo App.app');
    await rm(destination, { recursive: true, force: true });
    await cp(extracted, destination, { recursive: true });
  } finally { await rm(staging, { recursive: true, force: true }); }
  console.log(`simulator app extracted to ${destination}`);
}
