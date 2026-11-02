import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { Encontro } from '../types/encontro.js';

/** Creates the destination directory and writes the encounters as formatted JSON. */
export async function writeEncounters(
  path: string,
  encounters: readonly Encontro[],
): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(encounters, null, 2)}\n`, 'utf8');
}

