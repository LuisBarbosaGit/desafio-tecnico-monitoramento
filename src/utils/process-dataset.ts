import type { Encontro } from '../types/encontro.js';
import type { Monitorado } from '../types/monitorado.js';
import { findEncounters } from '../algorithm/find-encounters.js';
import { readDataset } from '../input/read-dataset.js';
import { writeEncounters } from './write-encounters.js';

export interface DatasetMetrics {
  readonly input: string;
  readonly output: string;
  readonly records: number;
  readonly timestamps: number;
  readonly candidatePairs: number;
  readonly haversineCalculations: number;
  readonly encounters: number;
  readonly durationMs: number;
}

export async function processDataset(
  input: string,
  output: string,
): Promise<DatasetMetrics> {
  const startedAt = performance.now();
  const byTimestamp = new Map<string, Map<number, Monitorado>>();
  let records = 0;
  for await (const position of readDataset(input)) {
    records += 1;
    const group =
      byTimestamp.get(position.timestamp) ?? new Map<number, Monitorado>();
    if (group.has(position.id))
      throw new Error(
        `Monitorado ${position.id} duplicado no timestamp ${position.timestamp}.`,
      );
    group.set(position.id, position);
    byTimestamp.set(position.timestamp, group);
  }

  const encounters: Encontro[] = [];
  let candidatePairs = 0;
  let haversineCalculations = 0;
  for (const timestamp of [...byTimestamp.keys()].sort()) {
    const result = findEncounters([...byTimestamp.get(timestamp)!.values()]);
    encounters.push(...result.encontros);
    candidatePairs += result.paresCandidatos;
    haversineCalculations += result.calculosHaversine;
  }
  await writeEncounters(output, encounters);
  return {
    input,
    output,
    records,
    timestamps: byTimestamp.size,
    candidatePairs,
    haversineCalculations,
    encounters: encounters.length,
    durationMs: Number((performance.now() - startedAt).toFixed(3)),
  };
}

