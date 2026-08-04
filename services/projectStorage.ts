import { FormData, SavedProjectItem, CalculationResults } from '../types';

const STORAGE_KEY = 'emaar_saved_electrical_projects';

export const getSavedProjects = (): SavedProjectItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading saved projects:', e);
    return [];
  }
};

export const saveProjectToStorage = (formData: FormData, results?: CalculationResults | null): SavedProjectItem => {
  const projects = getSavedProjects();
  const id = formData.id || `proj_${Date.now()}`;
  const now = new Date().toISOString();

  const updatedFormData = {
    ...formData,
    id,
    updatedAt: now,
    createdAt: formData.createdAt || now,
  };

  const newItem: SavedProjectItem = {
    id,
    name: formData.projectInfo.projectName || 'Untitled Project',
    date: new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' }),
    buildingType: formData.projectInfo.buildingType,
    totalKw: results ? results.totalDemandLoadKW : 0,
    formData: updatedFormData,
  };

  const existingIndex = projects.findIndex(p => p.id === id);
  if (existingIndex >= 0) {
    projects[existingIndex] = newItem;
  } else {
    projects.unshift(newItem);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  return newItem;
};

export const deleteProjectFromStorage = (id: string): SavedProjectItem[] => {
  const projects = getSavedProjects().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  return projects;
};

export const exportProjectJSON = (formData: FormData) => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(formData, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  const name = (formData.projectInfo.projectName || 'project').replace(/\s+/g, '_');
  downloadAnchor.setAttribute("download", `${name}_load_calc.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};

export const exportResultsCSV = (results: CalculationResults) => {
  const rows: string[][] = [
    ['Project Name', results.projectInfo.projectName],
    ['Building Type', results.projectInfo.buildingType],
    ['Phase Configuration', results.projectInfo.phaseType],
    ['System Voltage', `${results.projectInfo.voltage}V`],
    ['Total Connected Power (kW)', results.totalConnectedLoadKW.toFixed(2)],
    ['Total Demand Load (kW)', results.totalDemandLoadKW.toFixed(2)],
    ['Service Current (A)', results.totalCurrent.toFixed(2)],
    ['Main Service Breaker (A)', `${results.mainBreakerSize}`],
    ['Main Feeder Wire Size (mm²)', `${results.mainFeederWireSize}`],
    [],
    ['Circuit Schedule'],
    ['Circuit Name', 'Panel', 'Phase', 'Type', 'Power (W)', 'Current (A)', 'Breaker (A)', 'Wire Size (mm²)', 'Voltage Drop (%)'],
  ];

  results.circuitResults.forEach(c => {
    rows.push([
      c.name,
      c.subPanelId,
      c.phaseAssigned,
      c.type,
      c.totalPowerW.toString(),
      c.current.toFixed(2),
      c.breakerSize.toString(),
      c.wireSize.toString(),
      `${c.voltageDropPercent.toFixed(2)}%`,
    ]);
  });

  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + rows.map(e => e.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  const name = (results.projectInfo.projectName || 'results').replace(/\s+/g, '_');
  link.setAttribute("download", `${name}_circuit_schedule.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};
