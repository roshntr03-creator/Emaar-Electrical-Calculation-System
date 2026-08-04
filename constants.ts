import { FormData } from "./types";

export const BUILDING_TYPES = ['residential', 'commercial', 'industrial'] as const;
export const PHASE_TYPES = ['single_phase', 'three_phase'] as const;
export const VOLTAGES = [220, 230, 380, 400] as const;
export const FREQUENCIES = [50, 60] as const;
export const CIRCUIT_TYPES = ['lighting', 'sockets', 'ac', 'heavy_duty', 'custom'] as const;
export const CABLE_TYPES = ['copper', 'aluminum'] as const;
export const INSULATION_TYPES = ['PVC', 'XLPE'] as const;
export const INSTALLATION_METHODS = ['pipe', 'duct', 'free_wire', 'tray'] as const;
export const BREAKER_CURVES = ['B', 'C', 'D'] as const;

// --- Circuit Templates ---
export const CIRCUIT_TEMPLATES = {
  LIGHTING: {
    nameKey: 'templateLighting',
    type: 'lighting',
    power: 800,
    quantity: 1,
    powerFactor: 0.9,
    cableLength: 20,
    breakerCurve: 'B' as const,
  },
  GENERAL_SOCKETS: {
    nameKey: 'templateSockets',
    type: 'sockets',
    power: 2000,
    quantity: 1,
    powerFactor: 0.85,
    cableLength: 25,
    breakerCurve: 'C' as const,
  },
  AC_1_5_TON: {
    nameKey: 'templateAC',
    type: 'ac',
    power: 2200,
    quantity: 1,
    powerFactor: 0.85,
    cableLength: 15,
    breakerCurve: 'C' as const,
  },
  AC_2_5_TON: {
    nameKey: 'templateAC25',
    type: 'ac',
    power: 3600,
    quantity: 1,
    powerFactor: 0.85,
    cableLength: 20,
    breakerCurve: 'C' as const,
  },
  WATER_HEATER: {
    nameKey: 'templateWaterHeater',
    type: 'heavy_duty',
    power: 3000,
    quantity: 1,
    powerFactor: 1.0,
    cableLength: 12,
    breakerCurve: 'C' as const,
  },
  KITCHEN_OVEN: {
    nameKey: 'templateKitchenOven',
    type: 'heavy_duty',
    power: 6000,
    quantity: 1,
    powerFactor: 0.95,
    cableLength: 15,
    breakerCurve: 'C' as const,
  },
  EV_CHARGER: {
    nameKey: 'templateEVCharger',
    type: 'heavy_duty',
    power: 7400,
    quantity: 1,
    powerFactor: 0.95,
    cableLength: 15,
    breakerCurve: 'C' as const,
  },
  WATER_PUMP: {
    nameKey: 'templateWaterPump',
    type: 'heavy_duty',
    power: 1500,
    quantity: 1,
    powerFactor: 0.8,
    cableLength: 25,
    breakerCurve: 'D' as const,
  },
  CUSTOM: {
    nameKey: 'templateCustom',
    type: 'custom',
    power: 1000,
    quantity: 1,
    powerFactor: 0.9,
    cableLength: 10,
    breakerCurve: 'C' as const,
  }
} as const;

export type CircuitTemplateKey = keyof typeof CIRCUIT_TEMPLATES;

export const INITIAL_FORM_DATA: FormData = {
  projectInfo: {
    projectName: '',
    buildingType: 'residential',
    phaseType: 'three_phase',
    voltage: 380,
    frequency: 60,
    subPanels: [
      { id: 'main', name: 'اللوحة الرئيسية Main DB' },
      { id: 'sub_gf', name: 'لوحة الدور الأرضي Ground DB' },
      { id: 'sub_ff', name: 'لوحة الدور الأول First DB' },
    ],
  },
  circuits: [],
  wiringInfo: {
    cableType: 'copper',
    insulationType: 'PVC',
    installationMethod: 'pipe',
    ambientTemp: 40, // 40°C default for Middle East
    deratingGroupingFactor: 0.8,
    autoUpsizeForVoltageDrop: true,
  },
  panelInfo: {
    demandFactor: 0.8,
  },
  specifications: {
    safetyFactor: 1.25,
    maxLoadPercentage: 80,
    maxVoltageDropBranch: 3.0,
    maxVoltageDropTotal: 5.0,
  },
};

// Resistivity (ρ) at 70°C operating temperature (Ω·mm²/m)
export const CABLE_RESISTIVITY = {
  copper: 0.021,
  aluminum: 0.034,
};

// Base Ampacity Table (IEC 60364-5-52 / SBC 401) in Conduit/Pipe at 30°C reference
// [mm²]: base current (A)
export const CABLE_AMPACITY_TABLE: Record<'copper' | 'aluminum', Record<'PVC' | 'XLPE', Record<number, number>>> = {
  copper: {
    PVC: {
      1.5: 17.5,
      2.5: 24,
      4: 32,
      6: 41,
      10: 57,
      16: 76,
      25: 96,
      35: 119,
      50: 144,
      70: 184,
      95: 223,
      120: 259,
      150: 299,
      185: 341,
      240: 403,
    },
    XLPE: {
      1.5: 22,
      2.5: 30,
      4: 40,
      6: 52,
      10: 71,
      16: 96,
      25: 119,
      35: 147,
      50: 179,
      70: 229,
      95: 278,
      120: 322,
      150: 371,
      185: 424,
      240: 500,
    },
  },
  aluminum: {
    PVC: {
      1.5: 13,
      2.5: 18,
      4: 24,
      6: 31,
      10: 43,
      16: 57,
      25: 73,
      35: 90,
      50: 110,
      70: 140,
      95: 170,
      120: 197,
      150: 227,
      185: 259,
      240: 306,
    },
    XLPE: {
      1.5: 16,
      2.5: 22,
      4: 30,
      6: 39,
      10: 54,
      16: 73,
      25: 90,
      35: 111,
      50: 135,
      70: 173,
      95: 210,
      120: 244,
      150: 281,
      185: 321,
      240: 379,
    },
  },
};

// Temperature Derating Factor Table (Reference 30°C ambient)
export const TEMP_DERATING_TABLE: Record<number, number> = {
  25: 1.06,
  30: 1.00,
  35: 0.94,
  40: 0.87,
  45: 0.79,
  50: 0.71,
  55: 0.61,
};

// Installation Method Derating Factor
export const INSTALLATION_METHOD_DERATING: Record<string, number> = {
  pipe: 0.80,     // In conduit/pipe
  duct: 0.85,     // In closed duct
  free_wire: 1.00, // Open air / clipped direct
  tray: 0.90,     // Perforated tray
};

// Standard MCB / MCCB Breaker sizes (A)
export const STANDARD_BREAKER_SIZES = [
  6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 320, 400, 500, 630, 800
];

// Standard Wire Sizes (mm²)
export const STANDARD_WIRE_SIZES = [
  1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240
];

export const VOLTAGE_DROP_LIMIT = 3.0; // percent
