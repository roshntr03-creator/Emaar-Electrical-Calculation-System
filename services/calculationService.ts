import { 
  FormData, 
  CalculationResults, 
  CircuitResult, 
  MaterialQuantities, 
  AppWarning, 
  PhaseDistribution, 
  SubPanelResult 
} from '../types';
import { 
  CABLE_RESISTIVITY, 
  CABLE_AMPACITY_TABLE,
  TEMP_DERATING_TABLE,
  INSTALLATION_METHOD_DERATING,
  STANDARD_BREAKER_SIZES, 
  STANDARD_WIRE_SIZES,
  VOLTAGE_DROP_LIMIT
} from '../constants';

const findNextStandardSize = (value: number, standardSizes: number[]): number => {
  const size = standardSizes.find(s => s >= value);
  return size || standardSizes[standardSizes.length - 1];
};

const getTempDerating = (temp: number): number => {
  // Find closest temperature entry
  const temps = Object.keys(TEMP_DERATING_TABLE).map(Number).sort((a, b) => a - b);
  if (temp <= temps[0]) return TEMP_DERATING_TABLE[temps[0]];
  if (temp >= temps[temps.length - 1]) return TEMP_DERATING_TABLE[temps[temps.length - 1]];
  
  // Find lower bound
  for (let i = 0; i < temps.length - 1; i++) {
    if (temp >= temps[i] && temp <= temps[i + 1]) {
      const lower = temps[i];
      const upper = temps[i + 1];
      const ratio = (temp - lower) / (upper - lower);
      return TEMP_DERATING_TABLE[lower] + ratio * (TEMP_DERATING_TABLE[upper] - TEMP_DERATING_TABLE[lower]);
    }
  }
  return 1.0;
};

export const calculateAll = (formData: FormData): CalculationResults => {
  const warnings: AppWarning[] = [];
  const project = formData.projectInfo;
  const wiring = formData.wiringInfo;

  const isThreePhase = project.phaseType === 'three_phase' || project.voltage >= 380;
  const lineVoltage = project.voltage;
  const phaseVoltage = isThreePhase ? Math.round(lineVoltage / Math.sqrt(3)) : lineVoltage;

  // Derating factor for cabling
  const tempFactor = getTempDerating(wiring.ambientTemp);
  const installFactor = INSTALLATION_METHOD_DERATING[wiring.installationMethod] || 0.85;
  const groupingFactor = wiring.deratingGroupingFactor || 0.8;
  const totalDeratingFactor = tempFactor * installFactor * groupingFactor;

  let totalConnectedPowerW = 0;
  let totalApparentPowerVA = 0;

  // Phase counters for automatic balancing if needed
  let l1W = 0, l2W = 0, l3W = 0;
  let l1Count = 0, l2Count = 0, l3Count = 0;
  let threePhaseCount = 0;

  const subPanelPowerMap: Record<string, number> = {};
  const subPanelCircuitCountMap: Record<string, number> = {};

  const circuitResults: CircuitResult[] = formData.circuits.map((circuit, index) => {
    const qty = Math.max(1, circuit.quantity || 1);
    const totalPowerW = Math.max(0, circuit.power || 0) * qty;
    const pf = Math.max(0.1, Math.min(1.0, circuit.powerFactor || 0.9));
    const is3P = circuit.phaseAssignment === '3P' || (isThreePhase && circuit.type === 'heavy_duty' && totalPowerW >= 6000);

    // Calculate current
    let current = 0;
    if (totalPowerW > 0) {
      if (is3P && isThreePhase) {
        current = totalPowerW / (Math.sqrt(3) * lineVoltage * pf);
      } else {
        current = totalPowerW / (phaseVoltage * pf);
      }
    }

    // Required breaker
    const requiredBreakerAmps = current * formData.specifications.safetyFactor;
    const breakerSize = findNextStandardSize(requiredBreakerAmps, STANDARD_BREAKER_SIZES);

    // Cable Wire Sizing based on Ampacity tables & derating
    const conductor = wiring.cableType;
    const insulation = wiring.insulationType;
    const ampacityMap = CABLE_AMPACITY_TABLE[conductor][insulation];

    let chosenWireSize = STANDARD_WIRE_SIZES[0];
    let effectiveAmpacity = 0;

    for (const size of STANDARD_WIRE_SIZES) {
      const baseAmpacity = ampacityMap[size] || (size * 5);
      const deAmpacity = baseAmpacity * totalDeratingFactor;
      if (deAmpacity >= breakerSize && deAmpacity >= current) {
        chosenWireSize = size;
        effectiveAmpacity = deAmpacity;
        break;
      }
      chosenWireSize = size;
      effectiveAmpacity = deAmpacity;
    }

    // Calculate Voltage Drop
    const resistivity = CABLE_RESISTIVITY[conductor];
    const length = Math.max(1, circuit.cableLength || 10);
    let vDropVolts = 0;

    if (is3P && isThreePhase) {
      vDropVolts = (Math.sqrt(3) * length * current * resistivity) / chosenWireSize;
    } else {
      vDropVolts = (2 * length * current * resistivity) / chosenWireSize;
    }

    const sysVoltage = is3P && isThreePhase ? lineVoltage : phaseVoltage;
    let vDropPercent = (vDropVolts / sysVoltage) * 100;
    const originalVDropPercent = vDropPercent;
    let isWireUpsized = false;

    // Auto-upsize cable if voltage drop exceeds limit
    if (wiring.autoUpsizeForVoltageDrop && vDropPercent > formData.specifications.maxVoltageDropBranch) {
      const sizeIndex = STANDARD_WIRE_SIZES.indexOf(chosenWireSize);
      for (let i = sizeIndex + 1; i < STANDARD_WIRE_SIZES.length; i++) {
        const nextSize = STANDARD_WIRE_SIZES[i];
        let nextVDropVolts = 0;
        if (is3P && isThreePhase) {
          nextVDropVolts = (Math.sqrt(3) * length * current * resistivity) / nextSize;
        } else {
          nextVDropVolts = (2 * length * current * resistivity) / nextSize;
        }
        const nextVDropPercent = (nextVDropVolts / sysVoltage) * 100;

        chosenWireSize = nextSize;
        vDropVolts = nextVDropVolts;
        vDropPercent = nextVDropPercent;
        const baseAmpacity = ampacityMap[nextSize] || (nextSize * 5);
        effectiveAmpacity = baseAmpacity * totalDeratingFactor;
        isWireUpsized = true;

        if (nextVDropPercent <= formData.specifications.maxVoltageDropBranch) {
          break;
        }
      }
    }

    // Warnings check
    if (vDropPercent > formData.specifications.maxVoltageDropBranch) {
      warnings.push({
        key: 'warningVoltageDrop',
        severity: 'warning',
        params: { name: circuit.name, value: vDropPercent.toFixed(2), limit: formData.specifications.maxVoltageDropBranch }
      });
    }

    if (breakerSize < current) {
      warnings.push({
        key: 'warningBreakerSize',
        severity: 'error',
        params: { name: circuit.name, breaker: breakerSize, current: current.toFixed(2) }
      });
    }

    // Phase Assignment logic
    let assignedPhase: 'L1' | 'L2' | 'L3' | '3P' = 'L1';
    if (is3P && isThreePhase) {
      assignedPhase = '3P';
      threePhaseCount++;
      l1W += totalPowerW / 3;
      l2W += totalPowerW / 3;
      l3W += totalPowerW / 3;
    } else if (isThreePhase) {
      if (circuit.phaseAssignment === 'L1') assignedPhase = 'L1';
      else if (circuit.phaseAssignment === 'L2') assignedPhase = 'L2';
      else if (circuit.phaseAssignment === 'L3') assignedPhase = 'L3';
      else {
        // Auto balance phase assignment
        if (l1W <= l2W && l1W <= l3W) {
          assignedPhase = 'L1';
        } else if (l2W <= l1W && l2W <= l3W) {
          assignedPhase = 'L2';
        } else {
          assignedPhase = 'L3';
        }
      }

      if (assignedPhase === 'L1') { l1W += totalPowerW; l1Count++; }
      if (assignedPhase === 'L2') { l2W += totalPowerW; l2Count++; }
      if (assignedPhase === 'L3') { l3W += totalPowerW; l3Count++; }
    }

    // Sub-Panel tracking
    const subPanelId = circuit.subPanelId || 'main';
    subPanelPowerMap[subPanelId] = (subPanelPowerMap[subPanelId] || 0) + totalPowerW;
    subPanelCircuitCountMap[subPanelId] = (subPanelCircuitCountMap[subPanelId] || 0) + 1;

    totalConnectedPowerW += totalPowerW;
    totalApparentPowerVA += totalPowerW / pf;

    return {
      ...circuit,
      quantity: qty,
      totalPowerW,
      current,
      breakerSize,
      wireSize: chosenWireSize,
      voltageDropVolts: vDropVolts,
      voltageDropPercent: vDropPercent,
      voltageDropOriginalPercent: originalVDropPercent,
      isWireUpsized,
      effectiveAmpacity,
      deratingFactor: totalDeratingFactor,
      phaseAssigned: assignedPhase,
    };
  });

  // Calculate Total Demand Power and Main Feeder
  const demandFactor = formData.panelInfo.demandFactor || 0.8;
  const totalDemandPowerW = totalConnectedPowerW * demandFactor;
  const totalDemandLoadKW = totalDemandPowerW / 1000;
  const totalConnectedLoadKW = totalConnectedPowerW / 1000;
  const totalApparentPowerKVA = (totalApparentPowerVA * demandFactor) / 1000;
  const averagePowerFactor = totalConnectedPowerW > 0 ? totalConnectedPowerW / totalApparentPowerVA : 0.9;

  let totalCurrent = 0;
  if (isThreePhase) {
    totalCurrent = totalDemandPowerW / (Math.sqrt(3) * lineVoltage * averagePowerFactor);
  } else {
    totalCurrent = totalDemandPowerW / (phaseVoltage * averagePowerFactor);
  }

  // Safety factor applied to main service
  const demandedCurrentWithSafety = totalCurrent * formData.specifications.safetyFactor;
  const mainBreakerSize = findNextStandardSize(demandedCurrentWithSafety, STANDARD_BREAKER_SIZES);

  // Main feeder wire size calculation
  const ampacityMapMain = CABLE_AMPACITY_TABLE[wiring.cableType][wiring.insulationType];
  let mainFeederWireSize = STANDARD_WIRE_SIZES[0];

  for (const size of STANDARD_WIRE_SIZES) {
    const baseAmp = ampacityMapMain[size] || (size * 5);
    const deAmp = baseAmp * totalDeratingFactor;
    if (deAmp >= mainBreakerSize) {
      mainFeederWireSize = size;
      break;
    }
    mainFeederWireSize = size;
  }

  // Phase Distribution calculations
  const l1Current = l1W * demandFactor / (phaseVoltage * averagePowerFactor);
  const l2Current = l2W * demandFactor / (phaseVoltage * averagePowerFactor);
  const l3Current = l3W * demandFactor / (phaseVoltage * averagePowerFactor);

  const avgPowerW = (l1W + l2W + l3W) / 3;
  let unbalancePercentage = 0;
  if (avgPowerW > 0 && isThreePhase) {
    const maxDiff = Math.max(Math.abs(l1W - avgPowerW), Math.abs(l2W - avgPowerW), Math.abs(l3W - avgPowerW));
    unbalancePercentage = (maxDiff / avgPowerW) * 100;
  }

  if (unbalancePercentage > 15 && isThreePhase) {
    warnings.push({
      key: 'warningPhaseUnbalance',
      severity: 'warning',
      params: { unbalance: unbalancePercentage.toFixed(1) }
    });
  }

  const phaseDistribution: PhaseDistribution = {
    L1: { powerW: l1W, currentA: l1Current, count: l1Count },
    L2: { powerW: l2W, currentA: l2Current, count: l2Count },
    L3: { powerW: l3W, currentA: l3Current, count: l3Count },
    threePhaseCount,
    unbalancePercentage,
  };

  // Sub-panel Results
  const subPanelResults: SubPanelResult[] = (project.subPanels || []).map(sp => {
    const pW = subPanelPowerMap[sp.id] || 0;
    const pKW = (pW * demandFactor) / 1000;
    let pCurrent = 0;
    if (isThreePhase) {
      pCurrent = (pW * demandFactor) / (Math.sqrt(3) * lineVoltage * averagePowerFactor);
    } else {
      pCurrent = (pW * demandFactor) / (phaseVoltage * averagePowerFactor);
    }
    const spBreaker = findNextStandardSize(pCurrent * formData.specifications.safetyFactor, STANDARD_BREAKER_SIZES);

    let spFeeder = STANDARD_WIRE_SIZES[0];
    for (const size of STANDARD_WIRE_SIZES) {
      const baseAmp = ampacityMapMain[size] || (size * 5);
      if (baseAmp * totalDeratingFactor >= spBreaker) {
        spFeeder = size;
        break;
      }
      spFeeder = size;
    }

    return {
      id: sp.id,
      name: sp.name,
      totalPowerKW: pKW,
      totalCurrentA: pCurrent,
      breakerSizeA: spBreaker,
      feederCableSizeMm2: spFeeder,
      circuitCount: subPanelCircuitCountMap[sp.id] || 0,
    };
  });

  // Material Quantities Calculation
  const breakerCounts: Record<string, { size: number; curve: string; count: number; type: '1P' | '3P' }> = {};
  const cableLengthCounts: Record<string, number> = {};

  circuitResults.forEach(c => {
    if (c.breakerSize > 0) {
      const is3P = c.phaseAssigned === '3P';
      const key = `${c.breakerSize}_${c.breakerCurve}_${is3P ? '3P' : '1P'}`;
      if (!breakerCounts[key]) {
        breakerCounts[key] = {
          size: c.breakerSize,
          curve: c.breakerCurve || 'C',
          count: 0,
          type: is3P ? '3P' : '1P',
        };
      }
      breakerCounts[key].count += 1;
    }

    if (c.wireSize > 0) {
      const key = `${c.wireSize}`;
      cableLengthCounts[key] = (cableLengthCounts[key] || 0) + (c.cableLength * c.quantity);
    }
  });

  const quantities: MaterialQuantities = {
    cableLengthsBySize: Object.entries(cableLengthCounts)
      .map(([size, length]) => ({
        size: Number(size),
        length,
        cableType: `${wiring.cableType === 'copper' ? 'Cu' : 'Al'}/${wiring.insulationType}`,
      }))
      .sort((a, b) => a.size - b.size),
    breakers: Object.values(breakerCounts).sort((a, b) => a.size - b.size),
    mainBreakers: [
      { size: mainBreakerSize, count: 1, name: 'Main DB Main Breaker' },
      ...subPanelResults.filter(s => s.id !== 'main').map(s => ({ size: s.breakerSizeA, count: 1, name: `${s.name} Feeder Breaker` })),
    ],
    subPanelsCount: subPanelResults.length,
  };

  return {
    projectInfo: formData.projectInfo,
    totalConnectedLoadKW,
    totalDemandLoadKW,
    totalApparentPowerKVA,
    averagePowerFactor,
    totalCurrent,
    mainBreakerSize,
    mainFeederWireSize,
    phaseDistribution,
    subPanelResults,
    circuitResults,
    warnings,
    quantities,
  };
};
