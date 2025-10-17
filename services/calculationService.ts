
import { FormData, CalculationResults, CircuitResult, MaterialQuantities, AppWarning } from '../types';
import { 
    CABLE_RESISTIVITY, 
    CURRENT_DENSITY, 
    STANDARD_BREAKER_SIZES, 
    STANDARD_WIRE_SIZES,
    VOLTAGE_DROP_LIMIT
} from '../constants';

const findNextStandardSize = (value: number, standardSizes: number[]): number => {
    const size = standardSizes.find(size => size >= value);
    return size || standardSizes[standardSizes.length - 1];
};

export const calculateAll = (formData: FormData): CalculationResults => {
  const warnings: AppWarning[] = [];
  let totalLoadW = 0;
  let totalApparentPowerVA = 0;

  const circuitResults: CircuitResult[] = formData.circuits.map(circuit => {
    // FR-3.2: Calculate current for each circuit
    const current = circuit.power > 0 && circuit.powerFactor > 0 
      ? circuit.power / (formData.projectInfo.voltage * circuit.powerFactor)
      : 0;
    
    // FR-3.4: Suggest appropriate breaker
    const requiredBreakerAmps = current * 1.25;
    const breakerSize = findNextStandardSize(requiredBreakerAmps, STANDARD_BREAKER_SIZES);

    // FR-3.3: Suggest appropriate wire size
    const requiredWireSize = current > 0 ? current / CURRENT_DENSITY[formData.wiringInfo.cableType] : 0;
    const wireSize = findNextStandardSize(requiredWireSize, STANDARD_WIRE_SIZES);

    // FR-3.5: Calculate voltage drop
    const resistivity = CABLE_RESISTIVITY[formData.wiringInfo.cableType];
    const voltageDrop = (wireSize > 0) 
      ? (2 * circuit.cableLength * current * resistivity) / (formData.projectInfo.voltage * wireSize) * 100
      : 0;

    // FR-3.6: Check standards and add warnings
    if (voltageDrop > VOLTAGE_DROP_LIMIT) {
        warnings.push({
            key: 'warningVoltageDrop',
            params: { name: circuit.name, value: voltageDrop.toFixed(2), limit: VOLTAGE_DROP_LIMIT }
        });
    }
    if(breakerSize < current){
        warnings.push({
            key: 'warningBreakerSize',
            params: { name: circuit.name, breaker: breakerSize, current: current.toFixed(2) }
        });
    }

    totalLoadW += circuit.power;
    totalApparentPowerVA += (circuit.power / (circuit.powerFactor || 0.9));

    return {
      ...circuit,
      current,
      breakerSize,
      wireSize,
      voltageDrop,
    };
  });

  // Calculate total current based on the sum of apparent powers and demand factor
  const demandedApparentPowerVA = totalApparentPowerVA * formData.panelInfo.demandFactor;
  const totalCurrent = demandedApparentPowerVA / formData.projectInfo.voltage;
  
  // Size the main breaker with a 1.25 safety factor on the demanded current
  const mainBreakerSize = findNextStandardSize(totalCurrent * 1.25, STANDARD_BREAKER_SIZES);

  // Calculate the main feeder cable size
  const requiredMainFeederSize = totalCurrent / CURRENT_DENSITY[formData.wiringInfo.cableType];
  const mainFeederWireSize = findNextStandardSize(requiredMainFeederSize, STANDARD_WIRE_SIZES);
  
  // FR-3.1: Calculate total load (kW) for display purposes, including all factors
  const totalLoadKW = (totalLoadW / 1000) * formData.panelInfo.demandFactor * formData.specifications.safetyFactor;
  
  // FR-3.7: Calculate estimated quantities
  const breakerCounts = circuitResults.reduce((acc, result) => {
    if (result.breakerSize > 0) {
        acc[result.breakerSize] = (acc[result.breakerSize] || 0) + 1;
    }
    return acc;
  }, {} as Record<number, number>);

  const cableLengthCounts = circuitResults.reduce((acc, result) => {
      if (result.wireSize > 0) {
          acc[result.wireSize] = (acc[result.wireSize] || 0) + result.cableLength;
      }
      return acc;
  }, {} as Record<number, number>);

  const quantities: MaterialQuantities = {
      cableLengthsBySize: Object.entries(cableLengthCounts).map(([size, length]) => ({ size: Number(size), length })).sort((a, b) => a.size - b.size),
      breakers: Object.entries(breakerCounts).map(([size, count]) => ({ size: Number(size), count })).sort((a, b) => a.size - b.size),
      panels: 1 // Simplified: assume 1 main panel for now.
  };

  return {
    projectInfo: formData.projectInfo,
    totalLoadKW,
    totalCurrent,
    mainBreakerSize,
    mainFeederWireSize,
    circuitResults,
    warnings,
    quantities,
  };
};