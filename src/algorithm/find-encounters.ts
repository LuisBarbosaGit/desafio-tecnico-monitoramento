import type {
  Encontro,
  ResultadoBusca,
  TipoEncontro,
} from '../types/encontro.js';
import type { Monitorado } from '../types/monitorado.js';
import { classifyEncounter } from './classify-encounter.js';
import {
  EARTH_RADIUS_METERS,
  haversineDistanceMeters,
  toRadians,
} from './haversine.js';

const MAX_DISTANCE_METERS = 20;
const NEIGHBOR_CELLS = [-1, 0, 1] as const;

interface IndexedPosition {
  readonly monitorado: Monitorado;
  readonly cellX: number;
  readonly cellY: number;
}

export function findEncounters(
  monitorados: readonly Monitorado[],
): ResultadoBusca {
  if (monitorados.length < 2)
    return { encontros: [], paresCandidatos: 0, calculosHaversine: 0 };
  const indexed = indexPositions(monitorados);
  const grid = new Map<string, IndexedPosition[]>();
  for (const item of indexed) {
    const key = cellKey(item.cellX, item.cellY);
    const bucket = grid.get(key) ?? [];
    bucket.push(item);
    grid.set(key, bucket);
  }

  const encounters: Encontro[] = [];
  let candidatePairs = 0;
  let haversineCalculations = 0;
  for (const current of indexed) {
    for (const offsetX of NEIGHBOR_CELLS) {
      for (const offsetY of NEIGHBOR_CELLS) {
        const bucket = grid.get(
          cellKey(current.cellX + offsetX, current.cellY + offsetY),
        );
        if (!bucket) continue;
        for (const candidate of bucket) {
          if (candidate.monitorado.id <= current.monitorado.id) continue;
          candidatePairs += 1;
          const type = classifyEncounter(
            current.monitorado,
            candidate.monitorado,
          );
          if (!type) continue;
          haversineCalculations += 1;
          const distance = haversineDistanceMeters(
            current.monitorado,
            candidate.monitorado,
          );
          if (distance < MAX_DISTANCE_METERS)
            encounters.push(
              createEncounter(
                type,
                current.monitorado,
                candidate.monitorado,
                distance,
              ),
            );
        }
      }
    }
  }
  return {
    encontros: encounters,
    paresCandidatos: candidatePairs,
    calculosHaversine: haversineCalculations,
  };
}

function indexPositions(monitorados: readonly Monitorado[]): IndexedPosition[] {
  const maxLatitude = Math.max(
    ...monitorados.map(({ latitude }) => Math.abs(latitude)),
  );
  const longitudeScale = Math.cos(toRadians(maxLatitude));
  return [...monitorados]
    .sort((a, b) => a.id - b.id)
    .map((monitorado) => ({
      monitorado,
      cellX: Math.floor(
        (EARTH_RADIUS_METERS *
          toRadians(monitorado.longitude) *
          longitudeScale) /
          MAX_DISTANCE_METERS,
      ),
      cellY: Math.floor(
        (EARTH_RADIUS_METERS * toRadians(monitorado.latitude)) /
          MAX_DISTANCE_METERS,
      ),
    }));
}

function cellKey(x: number, y: number): string {
  return `${x}:${y}`;
}

function createEncounter(
  type: TipoEncontro,
  first: Monitorado,
  second: Monitorado,
  distance: number,
): Encontro {
  const [a, b] = first.id < second.id ? [first, second] : [second, first];
  return {
    tipo: type,
    monitoradosEncontro: [a.id, b.id],
    timestamp: first.timestamp,
    posicoes: {
      [a.id]: { lat: a.latitude, lon: a.longitude },
      [b.id]: { lat: b.latitude, lon: b.longitude },
    },
    distanciaMetros: distance,
  };
}

