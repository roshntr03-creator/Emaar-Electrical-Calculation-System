import React, { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CalculationResults, CircuitResult, FormData } from '../types';
import Card from './ui/Card';
import Button from './ui/Button';
import Icon from './ui/Icon';
import { useLocalization } from '../contexts/LocalizationContext';
import LanguageSwitcher from './ui/LanguageSwitcher';
import { saveProjectToStorage, exportResultsCSV } from '../services/projectStorage';

interface ResultsPageProps {
  results: CalculationResults;
  formData: FormData;
  onBackToHome: () => void;
  onStartNew: () => void;
}

const SummaryCard: React.FC<{ title: string; value: string; unit: string; iconName: React.ComponentProps<typeof Icon>['name']; highlight?: boolean }> = ({ title, value, unit, iconName, highlight }) => (
  <Card className={`text-center transition flex flex-col justify-between h-full ${highlight ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white border border-slate-200'}`}>
    <div>
      <div className={`flex justify-center mb-2 ${highlight ? 'text-blue-200' : 'text-blue-600'}`}>
        <Icon name={iconName} className="w-8 h-8" />
      </div>
      <p className={`text-xs font-semibold ${highlight ? 'text-blue-100' : 'text-slate-500'}`}>{title}</p>
    </div>
    <p className={`text-2xl font-black mt-2 ${highlight ? 'text-white' : 'text-slate-900'}`}>
      {value} <span className={`text-xs font-semibold ${highlight ? 'text-blue-100' : 'text-slate-500'}`}>{unit}</span>
    </p>
  </Card>
);

const CircuitDetailRow: React.FC<{ label: string; value: string | number; className?: string }> = ({ label, value, className = '' }) => (
  <div className={`flex justify-between items-center py-2 px-1 text-xs ${className}`}>
    <span className="text-slate-500">{label}</span>
    <span className="font-semibold text-slate-800">{value}</span>
  </div>
);

const MobileCircuitCard: React.FC<{ circuit: CircuitResult }> = ({ circuit }) => {
  const { t } = useLocalization();
  return (
    <Card className="w-full text-right border border-slate-200">
      <div className="flex justify-between items-center border-b pb-2 mb-2">
        <h4 className="font-bold text-slate-900 text-sm">{circuit.name}</h4>
        <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
          {circuit.phaseAssigned}
        </span>
      </div>
      <div className="space-y-1">
        <CircuitDetailRow label={t('results_table_type')} value={t(`circuitType_${circuit.type}`)} />
        <CircuitDetailRow label={`${t('results_table_power')}`} value={`${(circuit.totalPowerW / 1000).toFixed(2)} kW`} />
        <CircuitDetailRow label={`${t('results_table_current')}`} value={`${circuit.current.toFixed(2)} A`} />
        <CircuitDetailRow label={`${t('results_table_breaker')}`} value={`${circuit.breakerSize} A (Curve ${circuit.breakerCurve || 'C'})`} className="bg-slate-50 rounded" />
        <CircuitDetailRow label={`${t('results_table_wire')}`} value={`${circuit.wireSize} mm²`} className="bg-slate-50 rounded" />
        <CircuitDetailRow 
          label={`${t('results_table_voltage_drop')}`} 
          value={`${circuit.voltageDropPercent.toFixed(2)}%`}
          className={`font-bold ${circuit.voltageDropPercent > 3 ? 'text-red-600 bg-red-50 rounded' : 'text-green-700 bg-green-50 rounded'}`}
        />
      </div>
    </Card>
  );
};

const GeminiAnalysis: React.FC<{ results: CalculationResults }> = ({ results }) => {
  const { t, language } = useLocalization();
  const [analysis, setAnalysis] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePrompt = useCallback(() => {
    const reportData = JSON.stringify(results, null, 2);
    const lang = language === 'ar' ? 'Arabic' : 'English';
    
    return `
You are an expert principal electrical engineer and consultant with 20 years of experience designing electrical distribution systems according to the Saudi Building Code (SBC 401) and IEC standards.
Review the following electrical load calculation report and generate a thorough, professional engineering assessment in clear Markdown in ${lang}.

Project Load Report Data:
\`\`\`json
${reportData}
\`\`\`

Generate a detailed structured response with these sections:
1. Executive Summary & Design Verification
2. Phase Load Balance & Panel Schedule Analysis
3. Conductor & Circuit Breaker Code Compliance (Voltage Drop & Ampacity Derating)
4. Value Engineering & Material Optimization
5. Engineer Action Items & Checklist
`;
  }, [results, language]);

  const handleGenerateAnalysis = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setAnalysis('');

    try {
      const prompt = generatePrompt();
      const response = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || t('ai_analysis_error'));
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6);
              if (dataStr === '[DONE]') break;
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.text) {
                  setAnalysis(prev => prev + parsed.text);
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        }
      }
    } catch (err: any) {
      console.error('AI Analysis Fetch Error:', err);
      setError(err?.message || t('ai_analysis_error'));
    } finally {
      setIsLoading(false);
    }
  }, [generatePrompt, t]);

  return (
    <Card className="border border-blue-200 bg-gradient-to-b from-blue-50/50 to-white">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3 border-b pb-4">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 text-white p-2 rounded-xl">
            <Icon name="sparkles" className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">{t('ai_analysis_title')}</h3>
        </div>
        {!analysis && !isLoading && (
          <Button onClick={handleGenerateAnalysis} disabled={isLoading} className="shadow-md shadow-blue-500/20">
            <Icon name="sparkles" className="w-4 h-4" />
            {t('ai_analysis_button')}
          </Button>
        )}
      </div>
      
      <div className="prose prose-slate max-w-none text-right rtl:text-right ltr:text-left text-sm leading-relaxed">
        {isLoading && (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50 rounded-xl border border-dashed">
            <Icon name="cog" className="w-8 h-8 text-blue-600 animate-spin mb-3" />
            <p className="text-slate-600 font-semibold">{t('ai_analysis_loading')}</p>
          </div>
        )}
        
        {error && (
          <div className="p-4 text-red-700 bg-red-50 border border-red-300 rounded-xl text-sm">
            <p>{error}</p>
          </div>
        )}

        {!analysis && !isLoading && !error && (
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-white rounded-xl border border-slate-200">
            <Icon name="sparkles" className="w-12 h-12 text-blue-500 flex-shrink-0" />
            <p className="text-slate-600 text-xs sm:text-sm">
              {t('ai_analysis_intro')}
            </p>
          </div>
        )}

        {analysis && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {analysis}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </Card>
  );
};

const ResultsPage: React.FC<ResultsPageProps> = ({ results, formData, onBackToHome, onStartNew }) => {
  const { t } = useLocalization();
  const [saveToast, setSaveToast] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleSave = () => {
    saveProjectToStorage(formData, results);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  const handleExportCSV = () => {
    exportResultsCSV(results);
  };

  const isThreePhase = results.projectInfo.phaseType === 'three_phase';

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Action Bar */}
        <header className="mb-6">
          <div className="flex flex-wrap justify-between items-center gap-4 print:hidden bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 text-white p-2 rounded-xl">
                <Icon name="bolt" className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900">{t('results_header_title')}</h1>
                <span className="text-xs text-slate-500">{results.projectInfo.projectName}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={handleSave} variant="secondary" size="sm" className="bg-green-50 text-green-700 hover:bg-green-100 border border-green-200">
                <Icon name="clipboard" className="w-4 h-4"/> 
                <span>{t('save_project')}</span>
              </Button>
              <Button onClick={handleExportCSV} variant="secondary" size="sm">
                <Icon name="chart" className="w-4 h-4"/> 
                <span>{t('export_csv')}</span>
              </Button>
              <Button onClick={handlePrint} variant="secondary" size="sm">
                <Icon name="print" className="w-4 h-4"/> 
                <span>{t('print_pdf_button')}</span>
              </Button>
              <Button onClick={onStartNew} variant="secondary" size="sm">
                <Icon name="plus" className="w-4 h-4"/> 
                <span className="hidden sm:inline">{t('new_calculation_button')}</span>
              </Button>
              <Button onClick={onBackToHome} variant="ghost" size="sm">
                <Icon name="home" className="w-4 h-4"/> 
                <span className="hidden sm:inline">{t('home_button')}</span>
              </Button>
              <LanguageSwitcher />
            </div>
          </div>

          {saveToast && (
            <div className="mt-3 bg-green-600 text-white text-sm px-4 py-2 rounded-lg shadow-md animate-fade-in text-center font-bold">
              تم حفظ المشروع بنجاح في السجل المحلي!
            </div>
          )}

          {/* Project Summary Banner */}
          <div className="mt-4 p-4 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-wrap justify-between items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{t('project')}: {results.projectInfo.projectName}</h2>
              <p className="text-xs text-slate-600 mt-1">
                {t('buildingTypeLabel')}: <strong>{t(`buildingType_${results.projectInfo.buildingType}`)}</strong> | 
                النظام: <strong>{t(`phaseType_${results.projectInfo.phaseType}`)}</strong> | 
                الجهد: <strong>{results.projectInfo.voltage}V</strong> | 
                التردد: <strong>{results.projectInfo.frequency}Hz</strong>
              </p>
            </div>
            <div className="text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border">
              عدد الدوائر: <strong className="text-slate-900">{results.circuitResults.length}</strong> | 
              معامل الطلب: <strong className="text-slate-900">{formData.panelInfo.demandFactor}</strong>
            </div>
          </div>
        </header>

        <main className="space-y-6">
          {/* Section 1: Executive KPI Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <SummaryCard title={t('summary_total_connected')} value={results.totalConnectedLoadKW.toFixed(2)} unit="kW" iconName="bolt" />
            <SummaryCard title={t('summary_total_demand')} value={results.totalDemandLoadKW.toFixed(2)} unit="kW" iconName="chart" highlight />
            <SummaryCard title={t('summary_total_current')} value={results.totalCurrent.toFixed(2)} unit="A" iconName="calculator" />
            <SummaryCard title={t('summary_main_breaker')} value={results.mainBreakerSize.toString()} unit="A" iconName="cog" />
            <SummaryCard title={t('summary_main_cable')} value={results.mainFeederWireSize.toString()} unit="mm²" iconName="shield-check" />
          </div>

          {/* AI Analysis Section */}
          <GeminiAnalysis results={results} />

          {/* Section 2: Phase Balancing Dashboard (if 3-Phase) */}
          {isThreePhase && (
            <Card className="border border-slate-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2 border-b pb-3">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Icon name="chart" className="w-5 h-5 text-blue-600" />
                  {t('phase_distribution_title')}
                </h3>
                <span className={`text-xs px-3 py-1 rounded-full font-bold ${results.phaseDistribution.unbalancePercentage > 15 ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-green-100 text-green-800 border border-green-300'}`}>
                  عدم الاتزان: {results.phaseDistribution.unbalancePercentage.toFixed(1)}%
                </span>
              </div>

              {results.phaseDistribution.unbalancePercentage > 15 && (
                <div className="bg-amber-50 border border-amber-300 text-amber-900 p-3 rounded-xl text-xs mb-4">
                  {t('phase_unbalance_alert', { unbalance: results.phaseDistribution.unbalancePercentage.toFixed(1) })}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-red-50/50 border border-red-200 rounded-xl text-right">
                  <div className="flex justify-between items-center border-b border-red-200 pb-2 mb-2">
                    <span className="font-bold text-red-700 text-sm">{t('phase_l1')}</span>
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded font-bold">{results.phaseDistribution.L1.count} دوائر</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <p className="text-slate-600">القدرة: <strong className="text-slate-900">{(results.phaseDistribution.L1.powerW / 1000).toFixed(2)} kW</strong></p>
                    <p className="text-slate-600">التيار: <strong className="text-slate-900">{results.phaseDistribution.L1.currentA.toFixed(2)} A</strong></p>
                  </div>
                </div>

                <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl text-right">
                  <div className="flex justify-between items-center border-b border-amber-200 pb-2 mb-2">
                    <span className="font-bold text-amber-700 text-sm">{t('phase_l2')}</span>
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">{results.phaseDistribution.L2.count} دوائر</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <p className="text-slate-600">القدرة: <strong className="text-slate-900">{(results.phaseDistribution.L2.powerW / 1000).toFixed(2)} kW</strong></p>
                    <p className="text-slate-600">التيار: <strong className="text-slate-900">{results.phaseDistribution.L2.currentA.toFixed(2)} A</strong></p>
                  </div>
                </div>

                <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl text-right">
                  <div className="flex justify-between items-center border-b border-blue-200 pb-2 mb-2">
                    <span className="font-bold text-blue-700 text-sm">{t('phase_l3')}</span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">{results.phaseDistribution.L3.count} دوائر</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <p className="text-slate-600">القدرة: <strong className="text-slate-900">{(results.phaseDistribution.L3.powerW / 1000).toFixed(2)} kW</strong></p>
                    <p className="text-slate-600">التيار: <strong className="text-slate-900">{results.phaseDistribution.L3.currentA.toFixed(2)} A</strong></p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Section 3: Sub-Panels Table */}
          {results.subPanelResults.length > 0 && (
            <Card>
              <h3 className="text-lg font-bold text-slate-900 mb-4">{t('sub_panels_title')}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-right rtl:text-right ltr:text-left text-sm">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="p-3 font-semibold">{t('sub_panel_name')}</th>
                      <th className="p-3 font-semibold">{t('sub_panel_circuits')}</th>
                      <th className="p-3 font-semibold">{t('sub_panel_load')}</th>
                      <th className="p-3 font-semibold">{t('sub_panel_current')}</th>
                      <th className="p-3 font-semibold">{t('sub_panel_breaker')}</th>
                      <th className="p-3 font-semibold">{t('sub_panel_feeder')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {results.subPanelResults.map(sp => (
                      <tr key={sp.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">{sp.name}</td>
                        <td className="p-3 text-slate-600">{sp.circuitCount}</td>
                        <td className="p-3 font-mono text-slate-800">{sp.totalPowerKW.toFixed(2)} kW</td>
                        <td className="p-3 font-mono text-slate-800">{sp.totalCurrentA.toFixed(2)} A</td>
                        <td className="p-3 font-bold text-blue-700">{sp.breakerSizeA} A</td>
                        <td className="p-3 font-bold text-slate-800">{sp.feederCableSizeMm2} mm²</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Engineering Warnings (Conditional) */}
          {results.warnings.length > 0 && (
            <Card className="bg-amber-50/80 border border-amber-300">
              <h3 className="text-lg font-bold text-amber-900 mb-3 flex items-center gap-2">
                <Icon name="cog" className="w-5 h-5 text-amber-600" />
                {t('warnings_title')}
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-amber-900">
                {results.warnings.map((warning, index) => (
                  <li key={index} className="flex items-start gap-2 bg-white/60 p-2 rounded border border-amber-200">
                    <span className="font-bold text-amber-700">•</span>
                    <span>{t(warning.key, warning.params)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Section 4: Detailed Branch Circuit Table */}
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">{t('results_table_title')}</h3>
              <span className="text-xs text-slate-500 font-mono">Total: {results.circuitResults.length} circuits</span>
            </div>

            {/* Desktop Schedule Table */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-right rtl:text-right ltr:text-left text-sm">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="p-3 font-semibold">{t('results_table_name')}</th>
                    <th className="p-3 font-semibold">{t('results_table_panel')}</th>
                    <th className="p-3 font-semibold">{t('results_table_phase')}</th>
                    <th className="p-3 font-semibold">{t('results_table_type')}</th>
                    <th className="p-3 font-semibold">{t('results_table_power')}</th>
                    <th className="p-3 font-semibold">{t('results_table_current')}</th>
                    <th className="p-3 font-semibold">{t('results_table_breaker')}</th>
                    <th className="p-3 font-semibold">{t('results_table_wire')}</th>
                    <th className="p-3 font-semibold">{t('results_table_voltage_drop')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {results.circuitResults.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-bold text-slate-900">
                        {c.name} {c.quantity > 1 && <span className="text-xs text-slate-500 font-normal">({c.quantity}x)</span>}
                      </td>
                      <td className="p-3 text-xs text-slate-600">
                        {(results.subPanelResults.find(sp => sp.id === c.subPanelId)?.name) || 'Main DB'}
                      </td>
                      <td className="p-3">
                        <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          {c.phaseAssigned}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-slate-500">{t(`circuitType_${c.type}`)}</td>
                      <td className="p-3 font-mono text-slate-800">{(c.totalPowerW).toLocaleString()} W</td>
                      <td className="p-3 font-mono text-slate-800">{c.current.toFixed(2)} A</td>
                      <td className="p-3 font-bold text-blue-700">{c.breakerSize} A <span className="text-[10px] text-slate-400">({c.breakerCurve || 'C'})</span></td>
                      <td className="p-3 font-bold text-slate-800">
                        {c.wireSize} mm²
                        {c.isWireUpsized && (
                          <span className="block text-[10px] text-emerald-600 font-normal">{t('wire_upsized_tag')}</span>
                        )}
                      </td>
                      <td className={`p-3 font-bold font-mono ${c.voltageDropPercent > 3 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {c.voltageDropPercent.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
              {results.circuitResults.map(c => (
                <MobileCircuitCard key={c.id} circuit={c} />
              ))}
            </div>
          </Card>

          {/* Section 5: Bill of Materials (BOM) */}
          <Card>
            <h3 className="text-lg font-bold text-slate-900 mb-4">{t('bom_title')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-50 p-4 rounded-xl border">
                <h4 className="font-bold text-slate-800 text-sm mb-3 border-b pb-2">{t('bom_breakers')}</h4>
                <ul className="space-y-2 text-xs text-slate-700">
                  {results.quantities.breakers.map((b, idx) => (
                    <li key={idx} className="flex justify-between items-center">
                      <span>{t('breaker_item', { size: b.size, curve: b.curve, type: b.type })}</span>
                      <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border text-slate-800">{t('piece_count', { count: b.count })}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border">
                <h4 className="font-bold text-slate-800 text-sm mb-3 border-b pb-2">{t('bom_cables')}</h4>
                <ul className="space-y-2 text-xs text-slate-700">
                  {results.quantities.cableLengthsBySize.map((c, idx) => (
                    <li key={idx} className="flex justify-between items-center">
                      <span>{t('cable_size_mm2', { size: c.size, cableType: c.cableType })}</span>
                      <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border text-slate-800">{t('meter_length', { length: c.length.toFixed(0) })}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border">
                <h4 className="font-bold text-slate-800 text-sm mb-3 border-b pb-2">{t('bom_main_breakers')}</h4>
                <ul className="space-y-2 text-xs text-slate-700">
                  {results.quantities.mainBreakers.map((mb, idx) => (
                    <li key={idx} className="flex justify-between items-center">
                      <span>{mb.name}</span>
                      <span className="font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{mb.size} A</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>

          {/* Section 6: Technical Notes & Disclaimer */}
          <Card>
            <h3 className="text-lg font-bold text-slate-900 mb-3">{t('notes_title')}</h3>
            <ul className="space-y-2 text-xs text-slate-600 list-disc list-inside leading-relaxed">
              <li>{t('note_1')}</li>
              <li>{t('note_2')}</li>
              <li>{t('note_3')}</li>
              <li>{t('note_4')}</li>
            </ul>
          </Card>

          <footer className="text-center text-xs text-slate-500 pt-6 border-t space-y-1">
            <p><strong>{t('results_disclaimer_title')}:</strong> {t('results_disclaimer_content')}</p>
            <p>{t('results_disclaimer_review')}</p>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default ResultsPage;
