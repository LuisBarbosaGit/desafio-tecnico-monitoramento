import { createReadStream } from 'node:fs';
import { parse } from 'csv-parse';
import type { Monitorado } from '../types/monitorado.js';

const EXPECTED_COLUMNS = [
  'idMonitorado',
  'faccaoMonitorado',
  'timestamp',
  'latitude',
  'longitude',
  'medidaProtetiva',
  'idsRestricaoMedida',
] as const;

type CsvRow = Record<(typeof EXPECTED_COLUMNS)[number], string>;

export async function* readDataset(
  filePath: string,
): AsyncIterable<Monitorado> {
  const parser = createReadStream(filePath).pipe(
    parse({
      bom: true,
      columns: validateAndUseHeader,
      delimiter: ';',
      skip_empty_lines: true,
      trim: true,
    }),
  );

  let lineNumber = 1;
  for await (const row of parser) {
    lineNumber += 1;
    yield parseMonitoradoRow(row as CsvRow, lineNumber);
  }
}

function validateAndUseHeader(columns: string[]): string[] {
  const isValid =
    columns.length === EXPECTED_COLUMNS.length &&
    columns.every((column, index) => column === EXPECTED_COLUMNS[index]);
  if (!isValid)
    throw new Error(
      'Cabeçalho CSV inválido. Confira os nomes e a ordem das colunas.',
    );
  return columns;
}

export function parseMonitoradoRow(
  row: CsvRow,
  lineNumber: number,
): Monitorado {
  const id = parseInteger(row.idMonitorado, 'idMonitorado', lineNumber);
  const latitude = parseNumber(row.latitude, 'latitude', lineNumber);
  const longitude = parseNumber(row.longitude, 'longitude', lineNumber);

  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(row.timestamp)) {
    throw new Error(
      `Timestamp inválido na linha ${lineNumber}: ${row.timestamp}.`,
    );
  }
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new Error(`Coordenada fora dos limites na linha ${lineNumber}.`);
  }
  if (row.medidaProtetiva !== 'true' && row.medidaProtetiva !== 'false') {
    throw new Error(
      `medidaProtetiva inválida na linha ${lineNumber}: ${row.medidaProtetiva}.`,
    );
  }

  return {
    id,
    faccao: row.faccaoMonitorado || null,
    timestamp: row.timestamp,
    latitude,
    longitude,
    medidaProtetiva: row.medidaProtetiva === 'true',
    idsRestricaoMedida: parseRestrictedIds(row.idsRestricaoMedida, lineNumber),
  };
}

function parseRestrictedIds(value: string, lineNumber: number): number[] {
  if (value === '') return [];
  return value
    .split(',')
    .map((id) => parseInteger(id.trim(), 'idsRestricaoMedida', lineNumber));
}

function parseInteger(
  value: string,
  fieldName: string,
  lineNumber: number,
): number {
  if (!/^-?\d+$/.test(value) || !Number.isSafeInteger(Number(value))) {
    throw new Error(`${fieldName} inválido na linha ${lineNumber}: ${value}.`);
  }
  return Number(value);
}

function parseNumber(
  value: string,
  fieldName: string,
  lineNumber: number,
): number {
  const number = Number(value);
  if (!Number.isFinite(number))
    throw new Error(`${fieldName} inválido na linha ${lineNumber}: ${value}.`);
  return number;
}

