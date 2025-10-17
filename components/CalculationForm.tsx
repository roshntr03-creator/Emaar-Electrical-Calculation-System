import React, { useState, ChangeEvent } from 'react';
import { FormData, Circuit } from '../types';
import { 
    INITIAL_FORM_DATA, 
    BUILDING_TYPES, 
    VOLTAGES, 
    CIRCUIT_TYPES, 
    CABLE_TYPES, 
    INSTALLATION_METHODS,
    CIRCUIT_TEMPLATES,
    CircuitTemplateKey
} from '../constants';
import Button from './ui/Button';
import Card from './ui/Card';
import Input from './ui/Input';
import Select from './ui/Select';
import ProgressBar from './ui/ProgressBar';
import Icon from './ui/Icon';

interface CalculationFormProps {
  onCalculate: (formData: FormData) => void;
  onBackToHome: () => void;
}

const CalculationForm: React.FC<CalculationFormProps> = ({ onCalculate, onBackToHome }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<string[]>([]);
  const totalSteps = 5;

  const handleProjectInfoChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      projectInfo: {
        ...prev.projectInfo,
        [name]: name === 'voltage' ? parseInt(value) : value,
      },
    }));
  };
  
  const handleCircuitChange = (id: string, e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const isNumeric = ['power', 'powerFactor', 'cableLength'].includes(name);

    setFormData(prev => ({
      ...prev,
      circuits: prev.circuits.map(c =>
        c.id === id ? { ...c, [name]: isNumeric ? parseFloat(value) || 0 : value } : c
      ),
    }));
  };

  const addCircuit = (templateKey: CircuitTemplateKey) => {
    const template = CIRCUIT_TEMPLATES[templateKey];
    // Find how many circuits of the same type already exist to create a unique name
    const count = formData.circuits.filter(c => c.type === template.type && template.type !== '').length;
    
    const newCircuit: Circuit = {
      id: `c${Date.now()}`,
      ...template,
      name: `${template.name} ${count > 0 ? count + 1 : ''}`.trim(),
    };
    setFormData(prev => ({ ...prev, circuits: [...prev.circuits, newCircuit] }));
  };

  const removeCircuit = (id: string) => {
    setFormData(prev => ({ ...prev, circuits: prev.circuits.filter(c => c.id !== id) }));
  };

  const handleGenericChange = (section: keyof FormData, e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      const isNumeric = e.target.type === 'number';
      setFormData(prev => ({
          ...prev,
          [section]: {
              ...(prev[section] as object),
              [name]: isNumeric ? parseFloat(value) : value,
          }
      }));
  }
  
  const validateForm = (): boolean => {
    const newErrors: string[] = [];
    if (!formData.projectInfo.projectName.trim()) {
        newErrors.push('الرجاء إدخال اسم المشروع في الخطوة 1.');
    }
    if (formData.circuits.length === 0) {
        newErrors.push('يجب إضافة دائرة كهربائية واحدة على الأقل في الخطوة 2.');
    }
    formData.circuits.forEach((c, i) => {
        if (!c.name.trim()) {
            newErrors.push(`الدائرة رقم ${i + 1}: الرجاء إدخال اسم للدائرة.`);
        }
        if (c.power <= 0) {
            newErrors.push(`الدائرة "${c.name || `رقم ${i + 1}` }": يجب أن تكون القدرة (واط) أكبر من صفر.`);
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

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">الخطوة 1: معلومات المشروع</h3>
            <Input label="اسم المشروع" id="projectName" name="projectName" value={formData.projectInfo.projectName} onChange={handleProjectInfoChange} placeholder="مثال: فيلا سكنية" required />
            <Select label="نوع المبنى" id="buildingType" name="buildingType" value={formData.projectInfo.buildingType} onChange={handleProjectInfoChange}>
              {BUILDING_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
            </Select>
            <Select label="الجهد المستخدم (فولت)" id="voltage" name="voltage" value={formData.projectInfo.voltage} onChange={handleProjectInfoChange}>
              {VOLTAGES.map(v => <option key={v} value={v}>{v}V</option>)}
            </Select>
            <Input label="التردد (هرتز)" id="frequency" name="frequency" type="number" value={formData.projectInfo.frequency} readOnly disabled />
          </div>
        );
      case 2:
        return (
          <div>
            <h3 className="text-xl font-semibold mb-4">الخطوة 2: الأحمال الفرعية (الدوائر)</h3>
            <div className="space-y-6">
                {formData.circuits.length === 0 && (
                    <div className="text-center py-10 px-6 border-2 border-dashed rounded-lg bg-slate-50">
                        <Icon name="clipboard" className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                        <h4 className="text-lg font-semibold text-slate-700">ابدأ بإضافة الدوائر</h4>
                        <p className="text-slate-500 mt-1">اختر من القوالب الجاهزة أدناه لتسريع عملية الإدخال.</p>
                    </div>
                )}
                {formData.circuits.map((circuit, index) => (
                    <div key={circuit.id} className="p-4 border rounded-lg relative space-y-4 bg-white">
                        <button onClick={() => removeCircuit(circuit.id)} className="absolute top-2 left-2 text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors" aria-label={`حذف الدائرة ${index + 1}`}>
                            <Icon name="trash" className="w-5 h-5" />
                        </button>
                        <Input label="اسم الدائرة" id={`c_name_${circuit.id}`} name="name" value={circuit.name} onChange={(e) => handleCircuitChange(circuit.id, e)} placeholder="مثال: إنارة الصالة"/>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Select label="نوع الدائرة" id={`c_type_${circuit.id}`} name="type" value={circuit.type} onChange={(e) => handleCircuitChange(circuit.id, e)}>
                                <option value="">اختر النوع</option>
                                {CIRCUIT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                            </Select>
                            <Input label="القدرة (واط)" id={`c_power_${circuit.id}`} name="power" type="number" min="0" value={circuit.power} onChange={(e) => handleCircuitChange(circuit.id, e)} placeholder="1500"/>
                            <Input label="معامل القدرة (PF)" id={`c_pf_${circuit.id}`} name="powerFactor" type="number" min="0.1" max="1" step="0.05" value={circuit.powerFactor} onChange={(e) => handleCircuitChange(circuit.id, e)} placeholder="0.9"/>
                            <Input label="طول الكابل (متر)" id={`c_length_${circuit.id}`} name="cableLength" type="number" min="1" value={circuit.cableLength} onChange={(e) => handleCircuitChange(circuit.id, e)} placeholder="20"/>
                        </div>
                    </div>
                ))}
            </div>
             <div className="mt-6 pt-6 border-t border-slate-200">
                <h4 className="font-semibold text-slate-800 mb-3">إضافة دائرة جديدة:</h4>
                <div className="flex flex-wrap gap-3">
                    <Button onClick={() => addCircuit('LIGHTING')} variant="secondary" size="sm">
                        <Icon name="plus" className="w-4 h-4"/> إنارة
                    </Button>
                    <Button onClick={() => addCircuit('GENERAL_SOCKETS')} variant="secondary" size="sm">
                        <Icon name="plus" className="w-4 h-4"/> مقابس
                    </Button>
                    <Button onClick={() => addCircuit('AC_1_5_TON')} variant="secondary" size="sm">
                        <Icon name="plus" className="w-4 h-4"/> مكيف
                    </Button>
                    <Button onClick={() => addCircuit('WATER_HEATER')} variant="secondary" size="sm">
                        <Icon name="plus" className="w-4 h-4"/> سخان
                    </Button>
                    <Button onClick={() => addCircuit('CUSTOM')} variant="ghost" size="sm" className="text-slate-600 hover:bg-slate-100">
                        <Icon name="plus" className="w-4 h-4"/> دائرة مخصصة
                    </Button>
                </div>
            </div>
          </div>
        );
      case 3:
        return (
            <div className="space-y-4">
                <h3 className="text-xl font-semibold">الخطوة 3: مواصفات الأسلاك</h3>
                <Select label="نوع الكابل" id="cableType" name="cableType" value={formData.wiringInfo.cableType} onChange={(e) => handleGenericChange('wiringInfo', e)}>
                    {CABLE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                </Select>
                <Select label="طريقة التركيب" id="installationMethod" name="installationMethod" value={formData.wiringInfo.installationMethod} onChange={(e) => handleGenericChange('wiringInfo', e)}>
                    {INSTALLATION_METHODS.map(type => <option key={type} value={type}>{type}</option>)}
                </Select>
                <Input label="درجة الحرارة المحيطة (مئوية)" id="ambientTemp" name="ambientTemp" type="number" value={formData.wiringInfo.ambientTemp} onChange={(e) => handleGenericChange('wiringInfo', e)} placeholder="40" />
                <p className="text-sm text-slate-500 mt-2">سيتم حساب هبوط الجهد تلقائياً في صفحة النتائج لكل دائرة.</p>
            </div>
        );
      case 4:
          return (
              <div className="space-y-4">
                  <h3 className="text-xl font-semibold">الخطوة 4: اللوحة الرئيسية</h3>
                  <Input label="معامل الطلب (Demand Factor)" id="demandFactor" name="demandFactor" type="number" min="0.1" max="1" step="0.05" value={formData.panelInfo.demandFactor} onChange={(e) => handleGenericChange('panelInfo', e)} />
                  <p className="text-sm text-slate-500 mt-2">يستخدم لتقدير الحمل الفعلي المتوقع بناءً على طبيعة الاستخدام. القيمة الشائعة للمشاريع السكنية هي 0.8.</p>
              </div>
          );
      case 5:
          return (
              <div className="space-y-4">
                  <h3 className="text-xl font-semibold">الخطوة 5: معاملات الأمان</h3>
                  <Input label="معامل الأمان (Safety Factor)" id="safetyFactor" name="safetyFactor" type="number" min="1" max="2" step="0.05" value={formData.specifications.safetyFactor} onChange={(e) => handleGenericChange('specifications', e)} />
                  <p className="text-sm text-slate-500 mt-2">معامل إضافي لضمان أمان النظام عند حساب القدرة الكلية. القيمة الافتراضقية هي 1.25.</p>
                  <Input label="نسبة الحمل الأقصى للقاطع (%)" id="maxLoadPercentage" name="maxLoadPercentage" type="number" min="50" max="100" step="1" value={formData.specifications.maxLoadPercentage} onChange={(e) => handleGenericChange('specifications', e)} disabled />
                  <p className="text-sm text-slate-500 mt-2">هذه القيمة إعلامية حالياً وتستخدم كمرجع (القيمة القياسية 80%). الحسابات تستخدم معامل 1.25 على التيار لتحديد حجم القاطع.</p>
              </div>
          );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                    <Icon name="bolt" className="w-8 h-8 text-blue-600" />
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">حاسبة الأحمال الكهربائية</h1>
                </div>
                <Button onClick={onBackToHome} variant="ghost">
                    <Icon name="home" className="w-5 h-5"/>
                    <span className="hidden sm:inline">الرئيسية</span>
                </Button>
            </div>

            <Card>
                <ProgressBar currentStep={step} totalSteps={totalSteps} />
                <form onSubmit={(e) => e.preventDefault()} className="mt-6">
                    {errors.length > 0 && step === totalSteps && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6" role="alert">
                            <strong className="font-bold">يرجى تصحيح الأخطاء التالية للمتابعة:</strong>
                            <ul className="mt-2 list-disc list-inside space-y-1">
                                {errors.map((error, index) => <li key={index}>{error}</li>)}
                            </ul>
                        </div>
                    )}
                    {renderStep()}
                </form>
                <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-3">
                    <Button onClick={prevStep} disabled={step === 1} variant="secondary" className="w-full sm:w-auto">
                        <Icon name="arrowRight" className="w-5 h-5"/>
                        السابق
                    </Button>
                    {step < totalSteps ? (
                        <Button onClick={nextStep} className="w-full sm:w-auto">
                            التالي
                            <Icon name="arrowLeft" className="w-5 h-5"/>
                        </Button>
                    ) : (
                        <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700 focus:ring-green-500 w-full sm:w-auto">
                            <Icon name="calculator" className="w-5 h-5"/>
                            احسب الآن
                        </Button>
                    )}
                </div>
            </Card>
        </div>
    </div>
  );
};

export default CalculationForm;