
export interface ProjectInfo {
  projectName: string;
  buildingType: 'residential' | 'commercial' | 'industrial';
  voltage: 220 | 380;
  frequency: 50;
}

export interface Circuit {
  id: string;
  name: string;
  type: 'lighting' | 'sockets' | 'ac' | 'heavy_duty' | '';
  power: number; // in Watts
  powerFactor: number;
  cableLength: number; // in meters
}

export interface WiringInfo {
  cableType: 'copper' | 'aluminum';
  installationMethod: 'pipe' | 'duct' | 'free_wire';
  ambientTemp: number;
}

export interface PanelInfo {
  demandFactor: number;
}

export interface Specifications {
  safetyFactor: number;
  maxLoadPercentage: number;
}

export interface FormData {
  projectInfo: ProjectInfo;
  circuits: Circuit[];
  wiringInfo: WiringInfo;
  panelInfo: PanelInfo;
  specifications: Specifications;
}

export interface CircuitResult extends Circuit {
  current: number;
  breakerSize: number;
  wireSize: number;
  voltageDrop: number;
}

export interface MaterialQuantities {
    cableLengthsBySize: { size: number; length: number }[];
    breakers: { size: number; count: number }[];
    panels: number;
}

export interface AppWarning {
    key: string;
    params: Record<string, string | number>;
}

export interface CalculationResults {
  projectInfo: ProjectInfo;
  totalLoadKW: number;
  totalCurrent: number;
  mainBreakerSize: number;
  mainFeederWireSize: number;
  circuitResults: CircuitResult[];
  warnings: AppWarning[];
  quantities: MaterialQuantities;
}