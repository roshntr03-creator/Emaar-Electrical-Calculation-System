import React, { useState, useEffect } from 'react';
import Button from './ui/Button';
import Card from './ui/Card';
import Icon from './ui/Icon';
import { useLocalization } from '../contexts/LocalizationContext';
import LanguageSwitcher from './ui/LanguageSwitcher';
import { getSavedProjects, deleteProjectFromStorage, exportProjectJSON } from '../services/projectStorage';
import { SavedProjectItem, FormData } from '../types';

interface HomePageProps {
  onStart: () => void;
  onLoadProject: (formData: FormData) => void;
}

const FeatureCard: React.FC<{ icon: React.ComponentProps<typeof Icon>['name']; title: string; description: string }> = ({ icon, title, description }) => (
  <Card className="text-right flex flex-col h-full ltr:text-left hover:shadow-lg transition-all border border-slate-100">
    <div className="flex-shrink-0 bg-blue-100 text-blue-600 rounded-xl w-12 h-12 flex items-center justify-center mb-4">
      <Icon name={icon} className="w-6 h-6" />
    </div>
    <div className="flex-grow">
      <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
    </div>
  </Card>
);

const AudienceCard: React.FC<{ icon: React.ComponentProps<typeof Icon>['name']; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="flex flex-col items-center text-center p-6 bg-white rounded-xl shadow-sm border border-slate-100">
    <div className="bg-blue-600 text-white rounded-2xl p-4 mb-4 shadow-md shadow-blue-500/20">
      <Icon name={icon} className="w-8 h-8" />
    </div>
    <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
    <p className="text-slate-600 text-sm">{description}</p>
  </div>
);

const Step: React.FC<{ number: string; title: string; description: string }> = ({ number, title, description }) => (
  <div className="flex items-start gap-4">
    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-blue-600 text-white rounded-xl font-bold text-xl shadow-md shadow-blue-500/20">
      {number}
    </div>
    <div className="pt-1">
      <h4 className="font-bold text-lg text-slate-900">{title}</h4>
      <p className="text-slate-600 text-sm mt-1">{description}</p>
    </div>
  </div>
);

const HomePage: React.FC<HomePageProps> = ({ onStart, onLoadProject }) => {
  const { t } = useLocalization();
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [savedProjects, setSavedProjects] = useState<SavedProjectItem[]>([]);

  useEffect(() => {
    if (isSavedModalOpen) {
      setSavedProjects(getSavedProjects());
    }
  }, [isSavedModalOpen]);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = deleteProjectFromStorage(id);
    setSavedProjects(updated);
  };

  const handleExportJSON = (item: SavedProjectItem, e: React.MouseEvent) => {
    e.stopPropagation();
    exportProjectJSON(item.formData);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.projectInfo && parsed.circuits) {
          onLoadProject(parsed);
          setIsSavedModalOpen(false);
        } else {
          alert('ملف غير صالح لمشروع حساب الأحمال.');
        }
      } catch (err) {
        alert('حدث خطأ أثناء قراءة الملف.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-40 border-b border-slate-200">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2 rounded-xl shadow-md shadow-blue-500/20">
              <Icon name="bolt" className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{t('home_header_title')}</h1>
              <span className="text-xs text-slate-500 hidden sm:inline-block">نظام حساب القواطع واللوحات الكهربائية</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setIsSavedModalOpen(true)} variant="secondary" size="sm">
              <Icon name="clipboard" className="w-4 h-4" />
              <span className="hidden sm:inline">{t('home_saved_projects')}</span>
            </Button>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="relative container mx-auto px-6 py-16 md:py-24 text-center overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
        
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-xs font-bold mb-6 border border-blue-200 shadow-sm">
          <Icon name="sparkles" className="w-4 h-4" />
          <span>مطابق لكود البناء السعودي SBC 401 والمعايير الدولية IEC</span>
        </div>

        <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 leading-tight max-w-4xl mx-auto">
          {t('home_hero_title')}
        </h2>
        <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed">
          {t('home_hero_subtitle')}
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Button onClick={onStart} size="lg" className="shadow-xl shadow-blue-600/30 w-full sm:w-auto text-base">
            <Icon name="bolt" className="w-5 h-5" />
            {t('home_hero_cta')}
            <Icon name="arrowLeft" className="w-5 h-5 rtl:hidden" />
            <Icon name="arrowRight" className="w-5 h-5 ltr:hidden"/>
          </Button>
          <Button onClick={() => setIsSavedModalOpen(true)} variant="secondary" size="lg" className="w-full sm:w-auto text-base">
            <Icon name="clipboard" className="w-5 h-5" />
            {t('home_saved_projects')}
          </Button>
        </div>
      </main>

      <section id="features" className="bg-white py-16 md:py-24 border-y border-slate-200">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">{t('home_features_title')}</h2>
            <p className="text-slate-600 mt-2 max-w-2xl mx-auto">{t('home_features_subtitle')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard icon="calculator" title={t('feature_1_title')} description={t('feature_1_desc')} />
            <FeatureCard icon="chart" title={t('feature_2_title')} description={t('feature_2_desc')} />
            <FeatureCard icon="shield-check" title={t('feature_3_title')} description={t('feature_3_desc')} />
            <FeatureCard icon="cloud" title={t('feature_4_title')} description={t('feature_4_desc')} />
            <FeatureCard icon="cog" title={t('feature_5_title')} description={t('feature_5_desc')} />
            <FeatureCard icon="sparkles" title={t('feature_6_title')} description={t('feature_6_desc')} />
          </div>
        </div>
      </section>

      <section id="audience" className="py-16 md:py-24 bg-slate-100">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">{t('home_audience_title')}</h2>
            <p className="text-slate-600 mt-2">{t('home_audience_subtitle')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <AudienceCard icon="users" title={t('audience_1_title')} description={t('audience_1_desc')} />
            <AudienceCard icon="users" title={t('audience_2_title')} description={t('audience_2_desc')} />
            <AudienceCard icon="users" title={t('audience_3_title')} description={t('audience_3_desc')} />
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">{t('home_how_it_works_title')}</h2>
            <p className="text-slate-600 mt-2">{t('home_how_it_works_subtitle')}</p>
          </div>
          <div className="max-w-3xl mx-auto space-y-8">
            <Step number={t('step_1_number')} title={t('step_1_title')} description={t('step_1_desc')}/>
            <Step number={t('step_2_number')} title={t('step_2_title')} description={t('step_2_desc')}/>
            <Step number={t('step_3_number')} title={t('step_3_title')} description={t('step_3_desc')}/>
            <Step number={t('step_4_number')} title={t('step_4_title')} description={t('step_4_desc')}/>
            <Step number="٥" title={t('step_5_title')} description={t('step_5_desc')}/>
          </div>
        </div>
      </section>

      <footer className="bg-slate-900 text-white py-8 border-t border-slate-800">
        <div className="container mx-auto px-6 text-center text-sm space-y-2">
          <p className="font-semibold text-slate-300">{t('footer_copyright')}</p>
          <p className="text-slate-500 text-xs">{t('footer_disclaimer')}</p>
        </div>
      </footer>

      {/* Saved Projects Modal */}
      {isSavedModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b pb-4">
              <div className="flex items-center gap-2">
                <Icon name="clipboard" className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-bold text-slate-900">{t('saved_projects_title')}</h3>
              </div>
              <button onClick={() => setIsSavedModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {savedProjects.length === 0 ? (
                <div className="text-center py-12 px-4 text-slate-500">
                  <Icon name="clipboard" className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <p className="text-sm">{t('no_saved_projects')}</p>
                </div>
              ) : (
                savedProjects.map(item => (
                  <div key={item.id} onClick={() => { onLoadProject(item.formData); setIsSavedModalOpen(false); }} className="p-4 border rounded-xl hover:border-blue-500 hover:bg-blue-50/50 cursor-pointer transition flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-slate-900">{item.name}</h4>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span>{item.date}</span>
                        <span>•</span>
                        <span>{t(`buildingType_${item.buildingType}`)}</span>
                        {item.totalKw > 0 && (
                          <>
                            <span>•</span>
                            <span className="font-semibold text-blue-600">{item.totalKw.toFixed(2)} kW</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button onClick={(e) => handleExportJSON(item, e)} variant="ghost" size="sm" title={t('export_json')}>
                        <Icon name="cloud" className="w-4 h-4" />
                      </Button>
                      <Button onClick={(e) => handleDelete(item.id, e)} variant="danger" size="sm" title={t('delete_project')}>
                        <Icon name="trash" className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t pt-4 flex justify-between items-center gap-3">
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition">
                <Icon name="cloud" className="w-4 h-4" />
                <span>{t('import_json')}</span>
                <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
              </label>
              <Button onClick={() => setIsSavedModalOpen(false)} variant="secondary" size="sm">
                {t('close')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
