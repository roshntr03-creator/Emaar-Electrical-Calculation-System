export interface SubPanelDefinition {
  id: string;
  name: string;
  location?: string;
}

export interface ProjectInfo {
  projectName: string;
  buildingType: 'residential' | 'commercial' | 'industrial';
  phaseType: 'single_phase' | 'three_phase';
  voltage: 220 | 230 | 380 | 400;
  frequency: 50 | 60;
  subPanels: SubPanelDefinition[];
}

export interface Circuit {
  id: string;
  name: string;
  type: 'lighting' | 'sockets' | 'ac' | 'heavy_duty' | 'custom' | '';
  power: number; // in Watts
  quantity: number; // multiplier for load
  powerFactor: number;
  cableLength: number; // in meters
  phaseAssignment: 'L1' | 'L2' | 'L3' | '3P' | 'auto';
  subPanelId: string; // ID of SubPanelDefinition or 'main'
  breakerCurve: 'B' | 'C' | 'D';
}

export interface WiringInfo {
  cableType: 'copper' | 'aluminum';
  insulationType: 'PVC' | 'XLPE';
  installationMethod: 'pipe' | 'duct' | 'free_wire' | 'tray';
  ambientTemp: number; // °C
  deratingGroupingFactor: number; // 0.5 - 1.0
  autoUpsizeForVoltageDrop: boolean;
}

export interface PanelInfo {
  demandFactor: number;
}

export interface Specifications {
  safetyFactor: number;
  maxLoadPercentage: number;
  maxVoltageDropBranch: number; // standard 3%
  maxVoltageDropTotal: number;  // standard 5%
}

export interface FormData {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
  projectInfo: ProjectInfo;
  circuits: Circuit[];
  wiringInfo: WiringInfo;
  panelInfo: PanelInfo;
  specifications: Specifications;
}

export interface CircuitResult extends Circuit {
  totalPowerW: number;
  current: number; // in Amperes
  breakerSize: number;
  wireSize: number; // in mm²
  voltageDropVolts: number;
  voltageDropPercent: number;
  voltageDropOriginalPercent?: number;
  isWireUpsized: boolean;
  effectiveAmpacity: number;
  deratingFactor: number;
  phaseAssigned: 'L1' | 'L2' | 'L3' | '3P';
}

export interface PhaseDistribution {
  L1: { powerW: number; currentA: number; count: number };
  L2: { powerW: number; currentA: number; count: number };
  L3: { powerW: number; currentA: number; count: number };
  threePhaseCount: number;
  unbalancePercentage: number; // max difference vs average
}

export interface SubPanelResult {
  id: string;
  name: string;
  totalPowerKW: number;
  totalCurrentA: number;
  breakerSizeA: number;
  feederCableSizeMm2: number;
  circuitCount: number;
}

export interface MaterialQuantities {
  cableLengthsBySize: { size: number; length: number; cableType: string }[];
  breakers: { size: number; curve: string; count: number; type: '1P' | '3P' }[];
  mainBreakers: { size: number; count: number; name: string }[];
  subPanelsCount: number;
}

export interface AppWarning {
  key: string;
  severity: 'warning' | 'error' | 'info';
  params: Record<string, string | number>;
}

export interface CalculationResults {
  projectInfo: ProjectInfo;
  totalConnectedLoadKW: number;
  totalDemandLoadKW: number;
  totalApparentPowerKVA: number;
  averagePowerFactor: number;
  totalCurrent: number;
  mainBreakerSize: number;
  mainFeederWireSize: number;
  phaseDistribution: PhaseDistribution;
  subPanelResults: SubPanelResult[];
  circuitResults: CircuitResult[];
  warnings: AppWarning[];
  quantities: MaterialQuantities;
}

export interface SavedProjectItem {
  id: string;
  name: string;
  date: string;
  buildingType: string;
  totalKw: number;
  formData: FormData;
}
