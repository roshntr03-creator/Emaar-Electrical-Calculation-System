export interface ProjectInfo {
  projectName: string;
  buildingType: 'سكني' | 'تجاري' | 'صناعي';
  voltage: 220 | 380;
  frequency: 50;
}

export interface Circuit {
  id: string;
  name: string;
  type: 'إضاءة' | 'مقابس' | 'تكييف' | 'أجهزة ثقيلة' | '';
  power: number; // in Watts
  powerFactor: number;
  cableLength: number; // in meters
}

export interface WiringInfo {
  cableType: 'نحاسي' | 'ألومنيوم';
  installationMethod: 'أنبوب' | 'قناة' | 'سلك حر';
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

export interface CalculationResults {
  projectInfo: ProjectInfo;
  totalLoadKW: number;
  totalCurrent: number;
  mainBreakerSize: number;
  mainFeederWireSize: number;
  circuitResults: CircuitResult[];
  warnings: string[];
  quantities: MaterialQuantities;
}
