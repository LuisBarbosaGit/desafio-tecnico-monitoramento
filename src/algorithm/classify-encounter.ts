import type { TipoEncontro } from '../types/encontro.js';
import type { Monitorado } from '../types/monitorado.js';

export function classifyEncounter(
  first: Monitorado,
  second: Monitorado,
): TipoEncontro | undefined {
  const isProtectiveEncounter =
    (first.medidaProtetiva && first.idsRestricaoMedida.includes(second.id)) ||
    (second.medidaProtetiva && second.idsRestricaoMedida.includes(first.id));
  if (isProtectiveEncounter) return 'protetiva';
  if (first.medidaProtetiva || second.medidaProtetiva) return undefined;
  if (first.faccao !== null && first.faccao === second.faccao) return 'faccao';
  return 'generico';
}

