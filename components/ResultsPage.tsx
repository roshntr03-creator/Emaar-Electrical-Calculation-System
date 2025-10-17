import React from 'react';
import { CalculationResults, CircuitResult } from '../types';
import Card from './ui/Card';
import Button from './ui/Button';
import Icon from './ui/Icon';

interface ResultsPageProps {
  results: CalculationResults;
  onBackToHome: () => void;
  onStartNew: () => void;
}

const SummaryCard: React.FC<{ title: string; value: string; unit: string; iconName: React.ComponentProps<typeof Icon>['name'] }> = ({ title, value, unit, iconName }) => (
    <Card className="flex-1 text-center">
        <div className="flex justify-center text-blue-600 mb-2">
            <Icon name={iconName} className="w-8 h-8" />
        </div>
        <p className="text-slate-500 text-sm">{title}</p>
        <p className="text-2xl font-bold text-slate-900">
            {value} <span className="text-base font-normal text-slate-600">{unit}</span>
        </p>
    </Card>
);

const CircuitDetailRow: React.FC<{ label: string; value: string | number; className?: string }> = ({ label, value, className = '' }) => (
    <div className={`flex justify-between items-center py-2 px-1 ${className}`}>
        <span className="text-sm text-slate-500">{label}</span>
        <span className="text-sm font-semibold text-slate-800">{value}</span>
    </div>
);

const MobileCircuitCard: React.FC<{ circuit: CircuitResult }> = ({ circuit }) => (
    <Card className="w-full">
        <h4 className="font-bold border-b pb-2 mb-2">{circuit.name}</h4>
        <div className="space-y-1">
            <CircuitDetailRow label="النوع" value={circuit.type} />
            <CircuitDetailRow label="القدرة (W)" value={circuit.power.toLocaleString()} />
            <CircuitDetailRow label="التيار (A)" value={circuit.current.toFixed(2)} />
            <CircuitDetailRow label="القاطع المقترح (A)" value={circuit.breakerSize} className="bg-slate-50 rounded" />
            <CircuitDetailRow label="مقطع السلك (mm²)" value={circuit.wireSize} className="bg-slate-50 rounded" />
            <CircuitDetailRow 
                label="هبوط الجهد (%)" 
                value={`${circuit.voltageDrop.toFixed(2)}%`}
                className={`font-bold ${circuit.voltageDrop > 3 ? 'text-red-600 bg-red-50 rounded' : 'text-green-700 bg-green-50 rounded'}`}
            />
        </div>
    </Card>
);

const ResultsPage: React.FC<ResultsPageProps> = ({ results, onBackToHome, onStartNew }) => {

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-6">
                    <div className="flex justify-between items-center print:hidden">
                        <div className="flex items-center gap-3">
                            <Icon name="bolt" className="w-8 h-8 text-blue-600" />
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">تقرير حساب الأحمال</h1>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={handlePrint} variant="secondary" size="sm">
                                <Icon name="print" className="w-5 h-5"/> 
                                <span className="hidden sm:inline">طباعة / PDF</span>
                            </Button>
                             <Button onClick={onStartNew} variant="secondary" size="sm">
                                <Icon name="plus" className="w-5 h-5"/> 
                                <span className="hidden sm:inline">حساب جديد</span>
                            </Button>
                            <Button onClick={onBackToHome} variant="ghost" size="sm">
                                <Icon name="home" className="w-5 h-5"/> 
                                <span className="hidden sm:inline">الرئيسية</span>
                            </Button>
                        </div>
                    </div>
                    <div className="mt-4 p-4 bg-white rounded-lg shadow-sm border border-slate-200">
                        <h2 className="text-lg font-semibold">المشروع: {results.projectInfo.projectName}</h2>
                        <p className="text-sm text-slate-600">نوع المبنى: {results.projectInfo.buildingType} | الجهد: {results.projectInfo.voltage}V</p>
                    </div>
                </header>

                <main className="space-y-6">
                    {/* Section 1: Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <SummaryCard title="إجمالي الحمل" value={results.totalLoadKW.toFixed(2)} unit="kW" iconName="bolt" />
                        <SummaryCard title="إجمالي التيار" value={results.totalCurrent.toFixed(2)} unit="A" iconName="calculator" />
                        <SummaryCard title="القاطع الرئيسي" value={results.mainBreakerSize.toString()} unit="A" iconName="cog" />
                        <SummaryCard title="الكابل الرئيسي" value={results.mainFeederWireSize.toString()} unit="mm²" iconName="chart" />
                    </div>

                    {/* Section 2: Recommendations (Conditional) */}
                    {results.warnings.length > 0 && (
                        <Card className="bg-yellow-50 border border-yellow-300">
                            <h3 className="text-xl font-semibold text-yellow-800 mb-4">توصيات وتنبيهات هامة</h3>
                            <ul className="space-y-3 text-yellow-900">
                                {results.warnings.map((warning, index) => 
                                <li key={index} className="flex items-start gap-3">
                                    <Icon name="cog" className="w-5 h-5 mt-1 text-yellow-600 flex-shrink-0" />
                                    <span>{warning}</span>
                                </li>)}
                            </ul>
                        </Card>
                    )}

                    {/* Section 3: Circuit Details */}
                    <Card>
                        <h3 className="text-xl font-semibold mb-4">جدول الدوائر الكهربائية</h3>
                        {/* Desktop Table */}
                        <div className="overflow-x-auto hidden md:block">
                            <table className="w-full text-right">
                                <thead className="bg-slate-100">
                                    <tr>
                                        <th className="p-3 text-sm font-semibold tracking-wide">اسم الدائرة</th>
                                        <th className="p-3 text-sm font-semibold tracking-wide">النوع</th>
                                        <th className="p-3 text-sm font-semibold tracking-wide">القدرة (W)</th>
                                        <th className="p-3 text-sm font-semibold tracking-wide">التيار (A)</th>
                                        <th className="p-3 text-sm font-semibold tracking-wide">القاطع (A)</th>
                                        <th className="p-3 text-sm font-semibold tracking-wide">مقطع السلك (mm²)</th>
                                        <th className="p-3 text-sm font-semibold tracking-wide">هبوط الجهد (%)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {results.circuitResults.map(c => (
                                        <tr key={c.id} className="bg-white hover:bg-slate-50">
                                            <td className="p-3 text-sm text-slate-700">{c.name}</td>
                                            <td className="p-3 text-sm text-slate-500">{c.type}</td>
                                            <td className="p-3 text-sm text-slate-700">{c.power.toLocaleString()}</td>
                                            <td className="p-3 text-sm text-slate-700">{c.current.toFixed(2)}</td>
                                            <td className="p-3 text-sm text-slate-700 font-semibold">{c.breakerSize}</td>
                                            <td className="p-3 text-sm text-slate-700 font-semibold">{c.wireSize}</td>
                                            <td className={`p-3 text-sm font-bold ${c.voltageDrop > 3 ? 'text-red-500' : 'text-green-600'}`}>{c.voltageDrop.toFixed(2)}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Mobile Card List */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
                            {results.circuitResults.map(c => (
                                <MobileCircuitCard key={c.id} circuit={c} />
                            ))}
                        </div>
                    </Card>

                    {/* Section 4: Bill of Materials */}
                    <Card>
                        <h3 className="text-xl font-semibold mb-4">قائمة المواد التقديرية (Bill of Materials)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h4 className="font-semibold text-slate-800 mb-3 border-b pb-2">القواطع الكهربائية</h4>
                                <ul className="space-y-2 text-slate-600">
                                    {results.quantities.breakers.map(b => 
                                        <li key={b.size} className="flex justify-between">
                                            <span>قاطع {b.size}A</span>
                                            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-sm">{b.count} قطعة</span>
                                        </li>
                                    )}
                                </ul>
                            </div>
                             <div>
                                <h4 className="font-semibold text-slate-800 mb-3 border-b pb-2">أطوال الكابلات</h4>
                                <ul className="space-y-2 text-slate-600">
                                    {results.quantities.cableLengthsBySize.map(c => 
                                        <li key={c.size} className="flex justify-between">
                                            <span>كابل {c.size}mm²</span>
                                            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-sm">{c.length.toFixed(0)} متر</span>
                                        </li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </Card>

                    {/* Section 5: Technical Notes */}
                    <Card>
                        <h3 className="text-xl font-semibold mb-4">ملاحظات فنية وافتراضات</h3>
                        <ul className="space-y-3 text-slate-600 list-disc list-inside text-sm">
                            <li>الحسابات تفترض نظامًا كهربائيًا أحادي الطور.</li>
                            <li>مقاطع الأسلاك تم تقديرها بناءً على كثافة تيار مبسطة وقد تتطلب تعديلاً بناءً على عوامل التصحيح (Derating Factors) مثل تجميع الكابلات أو طرق التمديد الفعلية حسب جداول NEC/IEC.</li>
                            <li>لم يتم أخذ حسابات تيار القصر (Short Circuit Current) في الاعتبار عند اختيار القواطع.</li>
                            <li>أطوال الكابلات هي تقديرات إجمالية ولا تشمل الهدر (waste).</li>
                        </ul>
                    </Card>

                    <footer className="text-center text-sm text-slate-500 pt-6 border-t mt-2">
                        <p><strong>إخلاء مسؤولية:</strong> هذه الحسابات مبنية على المعايير الكهربائية العالمية (IEC/NEC) وهي للاستخدام الاسترشادي فقط.</p>
                        <p>يُنصح بمراجعة النتائج من قبل مهندس كهرباء معتمد قبل تنفيذ أي أعمال.</p>
                    </footer>
                </main>
            </div>
        </div>
    );
};

export default ResultsPage;