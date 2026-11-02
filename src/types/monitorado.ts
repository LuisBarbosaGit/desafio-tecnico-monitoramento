export interface Monitorado {
  id: number;
  faccao: string | null;
  timestamp: string;
  latitude: number;
  longitude: number;
  medidaProtetiva: boolean;
  idsRestricaoMedida: number[];
}

