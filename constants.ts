import { FormData } from "./types";

export const BUILDING_TYPES = ['سكني', 'تجاري', 'صناعي'];
export const VOLTAGES = [220, 380];
export const CIRCUIT_TYPES = ['إضاءة', 'مقابس', 'تكييف', 'أجهزة ثقيلة'];
export const CABLE_TYPES = ['نحاسي', 'ألومنيوم'];
export const INSTALLATION_METHODS = ['أنبوب', 'قناة', 'سلك حر'];

// --- Circuit Templates ---
// All power values in Watts
export const CIRCUIT_TEMPLATES = {
  LIGHTING: {
    name: 'دائرة إنارة',
    type: 'إضاءة',
    power: 800,
    powerFactor: 0.9,
    cableLength: 20,
  },
  GENERAL_SOCKETS: {
    name: 'دائرة مقابس',
    type: 'مقابس',
    power: 2000,
    powerFactor: 0.85,
    cableLength: 25,
  },
  AC_1_5_TON: {
    name: 'مكيف 1.5 طن',
    type: 'تكييف',
    power: 2200,
    powerFactor: 0.8,
    cableLength: 15,
  },
  WATER_HEATER: {
    name: 'سخان مياه',
    type: 'أجهزة ثقيلة',
    power: 3000,
    powerFactor: 1.0,
    cableLength: 10,
  },
  CUSTOM: {
    name: 'دائرة مخصصة',
    type: '',
    power: 0,
    powerFactor: 0.9,
    cableLength: 10,
  }
} as const;

export type CircuitTemplateKey = keyof typeof CIRCUIT_TEMPLATES;


export const INITIAL_FORM_DATA: FormData = {
  projectInfo: {
    projectName: '',
    buildingType: 'سكني',
    voltage: 220,
    frequency: 50,
  },
  circuits: [], // Start with no circuits
  wiringInfo: {
    cableType: 'نحاسي',
    installationMethod: 'أنبوب',
    ambientTemp: 40,
  },
  panelInfo: {
    demandFactor: 0.8,
  },
  specifications: {
    safetyFactor: 1.25,
    maxLoadPercentage: 80,
  },
};

// --- Electrical Constants (Simplified for this application) ---

// Note: These values are simplified. Real-world calculations require detailed tables from IEC/NEC standards.
// Resistivity (ρ) in (Ω·mm²/m) at operating temperature (~70°C)
export const CABLE_RESISTIVITY = {
  'نحاسي': 0.021,
  'ألومنيوم': 0.034,
};

// Current density (A/mm²) - A highly simplified factor for wire sizing.
export const CURRENT_DENSITY = {
  'نحاسي': 6,
  'ألومنيوم': 4,
};

// Standard breaker sizes (Amperes)
export const STANDARD_BREAKER_SIZES = [10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 320, 400];

// Standard wire sizes (mm²)
export const STANDARD_WIRE_SIZES = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240];

export const VOLTAGE_DROP_LIMIT = 3; // percent