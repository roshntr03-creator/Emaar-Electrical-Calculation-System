
import React from 'react';
import Button from './ui/Button';
import Card from './ui/Card';
import Icon from './ui/Icon';
import { useLocalization } from '../contexts/LocalizationContext';
import LanguageSwitcher from './ui/LanguageSwitcher';

interface HomePageProps {
  onStart: () => void;
}

const FeatureCard: React.FC<{ icon: React.ComponentProps<typeof Icon>['name']; title: string; description: string }> = ({ icon, title, description }) => (
    <Card className="text-right flex flex-col h-full ltr:text-left">
      <div className="flex-shrink-0 bg-blue-100 text-blue-600 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
        <Icon name={icon} className="w-7 h-7" />
      </div>
      <div className="flex-grow">
        <h3 className="text-lg font-semibold text-slate-800 mb-2">{title}</h3>
        <p className="text-slate-600 text-sm">{description}</p>
      </div>
    </Card>
);

const AudienceCard: React.FC<{ icon: React.ComponentProps<typeof Icon>['name']; title: string; description: string }> = ({ icon, title, description }) => (
    <div className="flex flex-col items-center text-center p-4">
        <div className="bg-white text-blue-600 rounded-full p-4 mb-4 ring-8 ring-slate-200/50">
            <Icon name={icon} className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">{title}</h3>
        <p className="text-slate-600 text-sm">{description}</p>
    </div>
);

const Step: React.FC<{ number: string; title: string; description: string }> = ({ number, title, description }) => (
    <div className="flex items-start space-x-4 space-x-reverse rtl:space-x-reverse">
        <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-slate-200 text-slate-700 rounded-full font-bold text-xl">
            {number}
        </div>
        <div>
            <h4 className="font-semibold text-lg">{title}</h4>
            <p className="text-slate-600">{description}</p>
        </div>
    </div>
);


const HomePage: React.FC<HomePageProps> = ({ onStart }) => {
  const { t } = useLocalization();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Icon name="bolt" className="w-8 h-8 text-blue-600" />
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">{t('home_header_title')}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost">
              <Icon name="clipboard" className="w-5 h-5" />
              <span className="hidden sm:inline">{t('home_saved_projects')}</span>
            </Button>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="relative container mx-auto px-6 py-16 md:py-24 text-center overflow-hidden">
        <Icon name="bolt" className="absolute text-slate-200 -top-10 -right-20 w-80 h-80 opacity-50 -z-10 rtl:-left-20 rtl:right-auto" />
        <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 leading-tight">
          {t('home_hero_title')}
        </h2>
        <p className="text-lg text-slate-600 max-w-3xl mx-auto mb-10">
          {t('home_hero_subtitle')}
        </p>
        <Button onClick={onStart} size="lg" className="shadow-lg shadow-blue-500/30">
          {t('home_hero_cta')}
          <Icon name="arrowLeft" className="w-5 h-5 rtl:hidden" />
          <Icon name="arrowRight" className="w-5 h-5 ltr:hidden"/>
        </Button>
      </main>

      <section id="features" className="bg-white py-16 md:py-20">
        <div className="container mx-auto px-6">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold">{t('home_features_title')}</h2>
                <p className="text-slate-600 mt-2">{t('home_features_subtitle')}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <FeatureCard icon="calculator" title={t('feature_1_title')} description={t('feature_1_desc')} />
                <FeatureCard icon="clipboard" title={t('feature_2_title')} description={t('feature_2_desc')} />
                <FeatureCard icon="shield-check" title={t('feature_3_title')} description={t('feature_3_desc')} />
                <FeatureCard icon="cloud" title={t('feature_4_title')} description={t('feature_4_desc')} />
                <FeatureCard icon="cog" title={t('feature_5_title')} description={t('feature_5_desc')} />
                <FeatureCard icon="bolt" title={t('feature_6_title')} description={t('feature_6_desc')} />
            </div>
        </div>
      </section>

      <section id="audience" className="py-16 md:py-20 bg-slate-100">
        <div className="container mx-auto px-6">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold">{t('home_audience_title')}</h2>
                <p className="text-slate-600 mt-2">{t('home_audience_subtitle')}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <AudienceCard icon="users" title={t('audience_1_title')} description={t('audience_1_desc')} />
                 <AudienceCard icon="users" title={t('audience_2_title')} description={t('audience_2_desc')} />
                 <AudienceCard icon="users" title={t('audience_3_title')} description={t('audience_3_desc')} />
            </div>
        </div>
      </section>

      <section id="how-it-works" className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-6">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold">{t('home_how_it_works_title')}</h2>
                <p className="text-slate-600 mt-2">{t('home_how_it_works_subtitle')}</p>
            </div>
            <div className="max-w-3xl mx-auto grid grid-cols-1 gap-10">
                <Step number={t('step_1_number')} title={t('step_1_title')} description={t('step_1_desc')}/>
                <Step number={t('step_2_number')} title={t('step_2_title')} description={t('step_2_desc')}/>
                <Step number={t('step_3_number')} title={t('step_3_title')} description={t('step_3_desc')}/>
                <Step number={t('step_4_number')} title={t('step_4_title')} description={t('step_4_desc')}/>
            </div>
        </div>
      </section>

      <footer className="bg-slate-800 text-white py-6">
          <div className="container mx-auto px-6 text-center text-sm">
              <p>{t('footer_copyright')}</p>
              <p className="text-slate-400 mt-1">{t('footer_disclaimer')}</p>
          </div>
      </footer>
    </div>
  );
};

export default HomePage;