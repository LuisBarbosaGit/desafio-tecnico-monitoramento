export type TipoEncontro = 'generico' | 'faccao' | 'protetiva';

export interface Encontro {
  tipo: TipoEncontro;
  monitoradosEncontro: number[];
  timestamp: string;
  posicoes: Record<string, { lat: number; lon: number }>;
  distanciaMetros: number;
}

export interface ResultadoBusca {
  encontros: readonly Encontro[];
  paresCandidatos: number;
  calculosHaversine: number;
}

