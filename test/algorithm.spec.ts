import { describe, expect, it } from 'vitest';
import { classifyEncounter } from '../src/algorithm/classify-encounter.js';
import { findEncounters } from '../src/algorithm/find-encounters.js';
import { haversineDistanceMeters } from '../src/algorithm/haversine.js';
import { parseMonitoradoRow } from '../src/input/read-dataset.js';
import type { Monitorado } from '../src/types/monitorado.js';

function position(overrides: Partial<Monitorado> = {}): Monitorado {
  return {
    id: 1,
    faccao: null,
    timestamp: '2024-01-01 00:00:00',
    latitude: 0,
    longitude: 0,
    medidaProtetiva: false,
    idsRestricaoMedida: [],
    ...overrides,
  };
}

describe('algoritmo de encontros', () => {
  it('calcula Haversine com o raio terrestre especificado', () => {
    expect(
      haversineDistanceMeters(
        { latitude: 0, longitude: 0 },
        { latitude: 0, longitude: 1 },
      ),
    ).toBeCloseTo(111194.9266, 3);
  });

  it('classifica por prioridade protetiva, facção e genérico', () => {
    const victim = position({
      id: 20,
      medidaProtetiva: true,
      idsRestricaoMedida: [10],
    });
    expect(classifyEncounter(victim, position({ id: 10, faccao: 'a' }))).toBe(
      'protetiva',
    );
    expect(
      classifyEncounter(
        position({ faccao: 'a' }),
        position({ id: 2, faccao: 'a' }),
      ),
    ).toBe('faccao');
    expect(classifyEncounter(position(), position({ id: 2 }))).toBe('generico');
    expect(classifyEncounter(victim, position({ id: 99 }))).toBeUndefined();
  });

  it('converte uma linha CSV para o modelo Monitorado', () => {
    expect(
      parseMonitoradoRow(
        {
          idMonitorado: '9',
          faccaoMonitorado: '',
          timestamp: '2024-01-01 00:00:00',
          latitude: '1.2',
          longitude: '-2.3',
          medidaProtetiva: 'true',
          idsRestricaoMedida: '10,11',
        },
        2,
      ),
    ).toEqual({
      id: 9,
      faccao: null,
      timestamp: '2024-01-01 00:00:00',
      latitude: 1.2,
      longitude: -2.3,
      medidaProtetiva: true,
      idsRestricaoMedida: [10, 11],
    });
  });

  it('busca pares próximos uma única vez e ordena os IDs', () => {
    const deltaDegrees = (10 / 6_371_000) * (180 / Math.PI);
    const result = findEncounters([
      position({ id: 2, latitude: deltaDegrees }),
      position(),
    ]);
    expect(result.encontros).toHaveLength(1);
    expect(result.encontros[0]?.monitoradosEncontro).toEqual([1, 2]);
    expect(result.calculosHaversine).toBe(1);
  });

  it('aplica o limite estrito de 20 metros', () => {
    const deltaDegrees = (20.01 / 6_371_000) * (180 / Math.PI);
    expect(
      findEncounters([position(), position({ id: 2, latitude: deltaDegrees })])
        .encontros,
    ).toEqual([]);
  });
});

