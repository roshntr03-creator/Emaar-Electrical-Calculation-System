import React, { useState, ChangeEvent } from 'react';
import { FormData, Circuit, SubPanelDefinition } from '../types';
import { 
  INITIAL_FORM_DATA, 
  BUILDING_TYPES, 
  PHASE_TYPES,
  VOLTAGES, 
  CIRCUIT_TYPES, 
  CABLE_TYPES, 
  INSULATION_TYPES,
  INSTALLATION_METHODS,
  BREAKER_CURVES,
  CIRCUIT_TEMPLATES,
  CircuitTemplateKey
} from '../constants';
import Button from './ui/Button';
import Card from './ui/Card';
import Input from './ui/Input';
import Select from './ui/Select';
import ProgressBar from './ui/ProgressBar';
import Icon from './ui/Icon';
import { useLocalization } from '../contexts/LocalizationContext';
import LanguageSwitcher from './ui/LanguageSwitcher';

interface CalculationFormProps {
  initialData?: FormData | null;
  onCalculate: (formData: FormData) => void;
  onBackToHome: () => void;
}

const CalculationForm: React.FC<CalculationFormProps> = ({ initialData, onCalculate, onBackToHome }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialData || INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<string[]>([]);
  const [newSubPanelName, setNewSubPanelName] = useState('');
  const totalSteps = 5;
  const { t } = useLocalization();

  const handleProjectInfoChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      projectInfo: {
        ...prev.projectInfo,
        [name]: name === 'voltage' || name === 'frequency' ? parseInt(value) : value,
      },
    }));
  };

  const handleAddSubPanel = () => {
    if (!newSubPanelName.trim()) return;
    const newSp: SubPanelDefinition = {
      id: `sp_${Date.now()}`,
      name: newSubPanelName.trim(),
    };
    setFormData(prev => ({
      ...prev,
      projectInfo: {
        ...prev.projectInfo,
        subPanels: [...(prev.projectInfo.subPanels || []), newSp],
      },
    }));
    setNewSubPanelName('');
  };

  const handleRemoveSubPanel = (id: string) => {
    if (id === 'main') return; // Cannot remove main DB
    setFormData(prev => ({
      ...prev,
      projectInfo: {
        ...prev.projectInfo,
        subPanels: (prev.projectInfo.subPanels || []).filter(s => s.id !== id),
      },
      circuits: prev.circuits.map(c => c.subPanelId === id ? { ...c, subPanelId: 'main' } : c),
    }));
  };
  
  const handleCircuitChange = (id: string, e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const isNumeric = ['power', 'quantity', 'powerFactor', 'cableLength'].includes(name);

    setFormData(prev => ({
      ...prev,
      circuits: prev.circuits.map(c =>
        c.id === id ? { ...c, [name]: isNumeric ? parseFloat(value) || 0 : value } : c
      ),
    }));
  };

  const addCircuit = (templateKey: CircuitTemplateKey) => {
    const template = CIRCUIT_TEMPLATES[templateKey];
    const count = formData.circuits.filter(c => c.type === template.type && template.type !== 'custom').length;
    
    const newCircuit: Circuit = {
      id: `c_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      type: template.type as any,
      power: template.power,
      quantity: template.quantity || 1,
      powerFactor: template.powerFactor,
      cableLength: template.cableLength,
      phaseAssignment: 'auto',
      subPanelId: formData.projectInfo.subPanels?.[0]?.id || 'main',
      breakerCurve: template.breakerCurve || 'C',
      name: `${t(template.nameKey)} ${count > 0 ? count + 1 : ''}`.trim(),
    };
    setFormData(prev => ({ ...prev, circuits: [...prev.circuits, newCircuit] }));
  };

  const cloneCircuit = (circuitToClone: Circuit) => {
    const cloned: Circuit = {
      ...circuitToClone,
      id: `c_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      name: `${circuitToClone.name} (نسخة)`,
    };
    setFormData(prev => ({ ...prev, circuits: [...prev.circuits, cloned] }));
  };

  const removeCircuit = (id: string) => {
    setFormData(prev => ({ ...prev, circuits: prev.circuits.filter(c => c.id !== id) }));
  };

  const handleGenericChange = (section: keyof FormData, e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const isNumber = type === 'number' || type === 'range';
    const val = isCheckbox ? (e.target as HTMLInputElement).checked : (isNumber ? parseFloat(value) : value);

    setFormData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as object),
        [name]: val,
      }
    }));
  };
  
  const validateForm = (): boolean => {
    const newErrors: string[] = [];
    if (!formData.projectInfo.projectName.trim()) {
      newErrors.push('errorProjectName');
    }
    if (formData.circuits.length === 0) {
      newErrors.push('errorMinOneCircuit');
    }
    formData.circuits.forEach((c, i) => {
      if (!c.name.trim()) {
        newErrors.push(t('errorCircuitName', { number: i + 1 }));
      }
      if (c.power <= 0) {
        newErrors.push(t('errorCircuitPower', { name: c.name || `${t('circuit')} ${i + 1}` }));
      }
    });
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onCalculate(formData);
    }
  };

  const nextStep = () => setStep(prev => (prev < totalSteps ? prev + 1 : prev));
  const prevStep = () => setStep(prev => (prev > 1 ? prev - 1 : prev));

  // Live total power summary for the bar
  const estimatedTotalKw = (formData.circuits.reduce((acc, c) => acc + ((c.power || 0) * (c.quantity || 1)), 0) / 1000) * (formData.panelInfo.demandFactor || 0.8);

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
              <Icon name="bolt" className="w-6 h-6 text-blue-600" />
              {t('form_step1_title')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                label={t('projectNameLabel')} 
                id="projectName" 
                name="projectName" 
                value={formData.projectInfo.projectName} 
                onChange={handleProjectInfoChange} 
                placeholder={t('projectNamePlaceholder')} 
                required 
              />
              <Select label={t('buildingTypeLabel')} id="buildingType" name="buildingType" value={formData.projectInfo.buildingType} onChange={handleProjectInfoChange}>
                {BUILDING_TYPES.map(type => <option key={type} value={type}>{t(`buildingType_${type}`)}</option>)}
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border">
              <Select label={t('phaseTypeLabel')} id="phaseType" name="phaseType" value={formData.projectInfo.phaseType} onChange={handleProjectInfoChange}>
                {PHASE_TYPES.map(type => <option key={type} value={type}>{t(`phaseType_${type}`)}</option>)}
              </Select>

              <Select label={t('voltageLabel')} id="voltage" name="voltage" value={formData.projectInfo.voltage} onChange={handleProjectInfoChange}>
                {VOLTAGES.map(v => <option key={v} value={v}>{v}V</option>)}
              </Select>

              <Input label={t('frequencyLabel')} id="frequency" name="frequency" type="number" value={formData.projectInfo.frequency} onChange={handleProjectInfoChange} />
            </div>

            {/* Sub-Panels Manager */}
            <div className="space-y-3 pt-2">
              <label className="block text-sm font-bold text-slate-800">{t('subPanelsLabel')}</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newSubPanelName} 
                  onChange={(e) => setNewSubPanelName(e.target.value)} 
                  placeholder="اسم اللوحة الفرعية (مثال: لوحة الدور الأول DB-1)" 
                  className="flex-1 px-3 py-2 border rounded-lg text-sm bg-white"
                />
                <Button onClick={handleAddSubPanel} type="button" variant="secondary" size="sm">
                  {t('addSubPanelBtn')}
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {(formData.projectInfo.subPanels || []).map(sp => (
                  <div key={sp.id} className="bg-white border rounded-lg px-3 py-1.5 flex items-center gap-2 text-sm shadow-sm">
                    <span className="font-semibold text-slate-800">{sp.name}</span>
                    {sp.id !== 'main' && (
                      <button onClick={() => handleRemoveSubPanel(sp.id)} className="text-red-500 hover:text-red-700">
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Icon name="chart" className="w-6 h-6 text-blue-600" />
                {t('form_step2_title')}
              </h3>
              <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                عدد الدوائر: {formData.circuits.length}
              </span>
            </div>

            {/* Ready Templates Buttons */}
            <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-100 space-y-2">
              <h4 className="font-bold text-slate-800 text-sm">{t('addNewCircuitTitle')}</h4>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => addCircuit('LIGHTING')} variant="secondary" size="sm" type="button">
                  <Icon name="plus" className="w-4 h-4"/> {t('templateLighting')}
                </Button>
                <Button onClick={() => addCircuit('GENERAL_SOCKETS')} variant="secondary" size="sm" type="button">
                  <Icon name="plus" className="w-4 h-4"/> {t('templateSockets')}
                </Button>
                <Button onClick={() => addCircuit('AC_1_5_TON')} variant="secondary" size="sm" type="button">
                  <Icon name="plus" className="w-4 h-4"/> {t('templateACShort')}
                </Button>
                <Button onClick={() => addCircuit('AC_2_5_TON')} variant="secondary" size="sm" type="button">
                  <Icon name="plus" className="w-4 h-4"/> {t('templateAC25')}
                </Button>
                <Button onClick={() => addCircuit('WATER_HEATER')} variant="secondary" size="sm" type="button">
                  <Icon name="plus" className="w-4 h-4"/> {t('templateWaterHeaterShort')}
                </Button>
                <Button onClick={() => addCircuit('KITCHEN_OVEN')} variant="secondary" size="sm" type="button">
                  <Icon name="plus" className="w-4 h-4"/> {t('templateKitchenOven')}
                </Button>
                <Button onClick={() => addCircuit('EV_CHARGER')} variant="secondary" size="sm" type="button">
                  <Icon name="plus" className="w-4 h-4"/> {t('templateEVCharger')}
                </Button>
                <Button onClick={() => addCircuit('WATER_PUMP')} variant="secondary" size="sm" type="button">
                  <Icon name="plus" className="w-4 h-4"/> {t('templateWaterPump')}
                </Button>
                <Button onClick={() => addCircuit('CUSTOM')} variant="ghost" size="sm" type="button" className="text-blue-700 bg-white border border-blue-200">
                  <Icon name="plus" className="w-4 h-4"/> {t('templateCustom')}
                </Button>
              </div>
            </div>

            {/* Circuits List */}
            <div className="space-y-4">
              {formData.circuits.length === 0 && (
                <div className="text-center py-12 px-6 border-2 border-dashed rounded-xl bg-slate-50">
                  <Icon name="clipboard" className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <h4 className="text-lg font-bold text-slate-700">{t('empty_circuits_title')}</h4>
                  <p className="text-slate-500 text-sm mt-1">{t('empty_circuits_subtitle')}</p>
                </div>
              )}

              {formData.circuits.map((circuit, index) => (
                <div key={circuit.id} className="p-4 border rounded-xl space-y-4 bg-white shadow-sm hover:border-blue-300 transition">
                  <div className="flex justify-between items-center gap-3">
                    <span className="font-bold text-slate-700 bg-slate-100 text-xs px-2.5 py-1 rounded-md">
                      #{index + 1}
                    </span>
                    <Input 
                      label="" 
                      id={`c_name_${circuit.id}`} 
                      name="name" 
                      value={circuit.name} 
                      onChange={(e) => handleCircuitChange(circuit.id, e)} 
                      placeholder={t('circuitNamePlaceholder')}
                    />
                    <div className="flex items-center gap-1">
                      <button onClick={() => cloneCircuit(circuit)} type="button" className="text-slate-500 hover:text-blue-600 p-2 rounded-lg hover:bg-slate-100" title={t('cloneCircuit')}>
                        <Icon name="clipboard" className="w-4 h-4" />
                      </button>
                      <button onClick={() => removeCircuit(circuit.id)} type="button" className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50" aria-label={t('deleteCircuitAria', { number: index + 1 })}>
                        <Icon name="trash" className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Select label={t('circuitTypeLabel')} id={`c_type_${circuit.id}`} name="type" value={circuit.type} onChange={(e) => handleCircuitChange(circuit.id, e)}>
                      <option value="">{t('selectType')}</option>
                      {CIRCUIT_TYPES.map(type => <option key={type} value={type}>{t(`circuitType_${type}`)}</option>)}
                    </Select>

                    <Input label={t('powerLabel')} id={`c_power_${circuit.id}`} name="power" type="number" min="0" value={circuit.power} onChange={(e) => handleCircuitChange(circuit.id, e)} />
                    <Input label={t('quantityLabel')} id={`c_qty_${circuit.id}`} name="quantity" type="number" min="1" value={circuit.quantity || 1} onChange={(e) => handleCircuitChange(circuit.id, e)} />
                    <Input label={t('powerFactorLabel')} id={`c_pf_${circuit.id}`} name="powerFactor" type="number" min="0.1" max="1" step="0.05" value={circuit.powerFactor} onChange={(e) => handleCircuitChange(circuit.id, e)} />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1 border-t border-slate-100">
                    <Input label={t('cableLengthLabel')} id={`c_length_${circuit.id}`} name="cableLength" type="number" min="1" value={circuit.cableLength} onChange={(e) => handleCircuitChange(circuit.id, e)} />
                    
                    {formData.projectInfo.phaseType === 'three_phase' && (
                      <Select label={t('phaseAssignmentLabel')} id={`c_phase_${circuit.id}`} name="phaseAssignment" value={circuit.phaseAssignment} onChange={(e) => handleCircuitChange(circuit.id, e)}>
                        <option value="auto">تلقائي (توازن)</option>
                        <option value="L1">L1 (فازة 1)</option>
                        <option value="L2">L2 (فازة 2)</option>
                        <option value="L3">L3 (فازة 3)</option>
                        <option value="3P">ثلاثي الفاز (3P)</option>
                      </Select>
                    )}

                    <Select label={t('subPanelAssignLabel')} id={`c_sp_${circuit.id}`} name="subPanelId" value={circuit.subPanelId} onChange={(e) => handleCircuitChange(circuit.id, e)}>
                      {(formData.projectInfo.subPanels || []).map(sp => (
                        <option key={sp.id} value={sp.id}>{sp.name}</option>
                      ))}
                    </Select>

                    <Select label={t('breakerCurveLabel')} id={`c_curve_${circuit.id}`} name="breakerCurve" value={circuit.breakerCurve || 'C'} onChange={(e) => handleCircuitChange(circuit.id, e)}>
                      {BREAKER_CURVES.map(curve => <option key={curve} value={curve}>Curve {curve}</option>)}
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
              <Icon name="cog" className="w-6 h-6 text-blue-600" />
              {t('form_step3_title')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select label={t('cableTypeLabel')} id="cableType" name="cableType" value={formData.wiringInfo.cableType} onChange={(e) => handleGenericChange('wiringInfo', e)}>
                {CABLE_TYPES.map(type => <option key={type} value={type}>{t(`cableType_${type}`)}</option>)}
              </Select>

              <Select label={t('insulationTypeLabel')} id="insulationType" name="insulationType" value={formData.wiringInfo.insulationType} onChange={(e) => handleGenericChange('wiringInfo', e)}>
                {INSULATION_TYPES.map(type => <option key={type} value={type}>{t(`insulationType_${type}`)}</option>)}
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select label={t('installationMethodLabel')} id="installationMethod" name="installationMethod" value={formData.wiringInfo.installationMethod} onChange={(e) => handleGenericChange('wiringInfo', e)}>
                {INSTALLATION_METHODS.map(type => <option key={type} value={type}>{t(`installationMethod_${type}`)}</option>)}
              </Select>

              <Input label={t('ambientTempLabel')} id="ambientTemp" name="ambientTemp" type="number" min="20" max="60" value={formData.wiringInfo.ambientTemp} onChange={(e) => handleGenericChange('wiringInfo', e)} />
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border space-y-4">
              <Input label={t('deratingGroupingFactorLabel')} id="deratingGroupingFactor" name="deratingGroupingFactor" type="number" min="0.5" max="1" step="0.05" value={formData.wiringInfo.deratingGroupingFactor} onChange={(e) => handleGenericChange('wiringInfo', e)} />
              
              <label className="flex items-center gap-3 cursor-pointer pt-2">
                <input 
                  type="checkbox" 
                  name="autoUpsizeForVoltageDrop" 
                  checked={formData.wiringInfo.autoUpsizeForVoltageDrop} 
                  onChange={(e) => handleGenericChange('wiringInfo', e)}
                  className="w-5 h-5 text-blue-600 rounded" 
                />
                <span className="text-sm font-semibold text-slate-800">{t('autoUpsizeForVoltageDropLabel')}</span>
              </label>

              <p className="text-xs text-slate-500 leading-relaxed border-t pt-2">{t('voltageDropNote')}</p>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
              <Icon name="chart" className="w-6 h-6 text-blue-600" />
              {t('form_step4_title')}
            </h3>

            <div className="bg-white p-6 border rounded-xl space-y-4 shadow-sm">
              <Input label={t('demandFactorLabel')} id="demandFactor" name="demandFactor" type="number" min="0.1" max="1" step="0.05" value={formData.panelInfo.demandFactor} onChange={(e) => handleGenericChange('panelInfo', e)} />
              <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border">{t('demandFactorNote')}</p>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
              <Icon name="shield-check" className="w-6 h-6 text-blue-600" />
              {t('form_step5_title')}
            </h3>

            <div className="bg-white p-6 border rounded-xl space-y-4 shadow-sm">
              <Input label={t('safetyFactorLabel')} id="safetyFactor" name="safetyFactor" type="number" min="1" max="2" step="0.05" value={formData.specifications.safetyFactor} onChange={(e) => handleGenericChange('specifications', e)} />
              <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border">{t('safetyFactorNote')}</p>

              <Input label={t('maxLoadPercentageLabel')} id="maxLoadPercentage" name="maxLoadPercentage" type="number" min="50" max="100" step="1" value={formData.specifications.maxLoadPercentage} onChange={(e) => handleGenericChange('specifications', e)} disabled />
              <p className="text-sm text-slate-500">{t('maxLoadPercentageNote')}</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <Icon name="bolt" className="w-6 h-6" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">{t('form_header_title')}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={onBackToHome} variant="ghost" size="sm">
              <Icon name="home" className="w-5 h-5"/>
              <span className="hidden sm:inline">{t('home_button')}</span>
            </Button>
            <LanguageSwitcher />
          </div>
        </div>

        <Card>
          <ProgressBar currentStep={step} totalSteps={totalSteps} />
          
          <form onSubmit={(e) => e.preventDefault()} className="mt-6">
            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-xl relative mb-6" role="alert">
                <strong className="font-bold">{t('error_title')}</strong>
                <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
                  {errors.map((error, index) => <li key={index}>{error.startsWith('error') ? t(error) : error}</li>)}
                </ul>
              </div>
            )}
            {renderStep()}
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-3">
            <Button onClick={prevStep} disabled={step === 1} variant="secondary" className="w-full sm:w-auto">
              <Icon name="arrowRight" className="w-5 h-5 rtl:hidden"/>
              <Icon name="arrowLeft" className="w-5 h-5 ltr:hidden"/>
              {t('previous_button')}
            </Button>
            {step < totalSteps ? (
              <Button onClick={nextStep} className="w-full sm:w-auto">
                {t('next_button')}
                <Icon name="arrowLeft" className="w-5 h-5 rtl:hidden"/>
                <Icon name="arrowRight" className="w-5 h-5 ltr:hidden"/>
              </Button>
            ) : (
              <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700 focus:ring-green-500 w-full sm:w-auto shadow-lg shadow-green-600/30">
                <Icon name="calculator" className="w-5 h-5"/>
                {t('calculate_button')}
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Floating Summary Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-md text-white border-t border-slate-800 p-3 z-30 shadow-2xl">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-4 sm:gap-6">
            <div>
              <span className="text-slate-400 block text-[10px] sm:text-xs">المشروع</span>
              <span className="font-bold text-white truncate max-w-[120px] sm:max-w-none block">{formData.projectInfo.projectName || 'بدون اسم'}</span>
            </div>
            <div className="border-r border-slate-700 h-8"></div>
            <div>
              <span className="text-slate-400 block text-[10px] sm:text-xs">عدد الدوائر</span>
              <span className="font-bold text-blue-400">{formData.circuits.length}</span>
            </div>
            <div className="border-r border-slate-700 h-8"></div>
            <div>
              <span className="text-slate-400 block text-[10px] sm:text-xs">حمل الطلب المتوقع</span>
              <span className="font-bold text-green-400">{estimatedTotalKw.toFixed(2)} kW</span>
            </div>
          </div>
          <Button onClick={handleSubmit} size="sm" className="bg-blue-600 hover:bg-blue-500 text-xs sm:text-sm">
            <Icon name="calculator" className="w-4 h-4" />
            <span className="hidden sm:inline">حساب التقرير</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CalculationForm;
