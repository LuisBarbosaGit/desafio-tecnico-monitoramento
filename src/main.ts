import { readdir } from 'node:fs/promises';
import { basename, extname, join, resolve } from 'node:path';
import { processDataset } from './utils/process-dataset.js';

const DATA_DIRECTORY = resolve('src/data');
const OUTPUT_DIRECTORY = resolve('src/output');

async function main(): Promise<void> {
  const requestedFile = process.argv[2];
  if (process.argv.length > 3)
    throw new Error(
      'Informe no máximo um arquivo. Para processar todos, execute npm start.',
    );
  const inputFiles =
    requestedFile === undefined
      ? await listDatasetFiles()
      : [normalizeDatasetFile(requestedFile)];
  if (inputFiles.length === 0)
    throw new Error(
      'Nenhum arquivo .txt encontrado na pasta data/. Coloque os datasets nessa pasta e tente novamente.',
    );
  for (const fileName of inputFiles) {
    const inputPath = join(DATA_DIRECTORY, fileName);
    const outputPath = join(
      OUTPUT_DIRECTORY,
      `${basename(fileName, extname(fileName))}.json`,
    );
    console.log(JSON.stringify(await processDataset(inputPath, outputPath)));
  }
}

async function listDatasetFiles(): Promise<string[]> {
  return (await readdir(DATA_DIRECTORY, { withFileTypes: true }))
    .filter(
      (entry) => entry.isFile() && extname(entry.name).toLowerCase() === '.txt',
    )
    .map((entry) => entry.name)
    .sort((first, second) =>
      first.localeCompare(second, 'pt-BR', { numeric: true }),
    );
}

function normalizeDatasetFile(name: string): string {
  const fileName = name.toLowerCase().endsWith('.txt') ? name : `${name}.txt`;
  if (
    basename(fileName) !== fileName ||
    extname(fileName).toLowerCase() !== '.txt'
  ) {
    throw new Error(
      'Informe apenas o nome de um dataset .txt que esteja dentro de data/.',
    );
  }
  return fileName;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

