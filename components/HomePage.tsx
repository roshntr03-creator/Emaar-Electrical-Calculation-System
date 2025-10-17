import React from 'react';
import Button from './ui/Button';
import Card from './ui/Card';
import Icon from './ui/Icon';

interface HomePageProps {
  onStart: () => void;
}

const FeatureCard: React.FC<{ icon: React.ComponentProps<typeof Icon>['name']; title: string; description: string }> = ({ icon, title, description }) => (
    <Card className="text-right flex flex-col h-full">
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
    <div className="flex items-start space-x-4 space-x-reverse">
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
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Icon name="bolt" className="w-8 h-8 text-blue-600" />
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">برنامج Emaar Electrical</h1>
          </div>
          <Button variant="ghost">
             <Icon name="clipboard" className="w-5 h-5" />
             <span className="hidden sm:inline">المشاريع المحفوظة</span>
          </Button>
        </div>
      </header>

      <main className="relative container mx-auto px-6 py-16 md:py-24 text-center overflow-hidden">
        <Icon name="bolt" className="absolute text-slate-200 -top-10 -right-20 w-80 h-80 opacity-50 -z-10" />
        <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 leading-tight">
          نظام حساب الأحمال الكهربائية الذكي
        </h2>
        <p className="text-lg text-slate-600 max-w-3xl mx-auto mb-10">
          أداة هندسية متكاملة لحسابات دقيقة، سريعة، وموثوقة. قل وداعًا للحسابات اليدوية المعقدة وابدأ الآن.
        </p>
        <Button onClick={onStart} size="lg" className="shadow-lg shadow-blue-500/30">
          ابدأ الحساب الآن
          <Icon name="arrowLeft" className="w-5 h-5" />
        </Button>
      </main>

      <section id="features" className="bg-white py-16 md:py-20">
        <div className="container mx-auto px-6">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold">لماذا تختار برنامجنا؟</h2>
                <p className="text-slate-600 mt-2">مميزات تجعل حساباتك الكهربائية أسهل وأكثر دقة.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <FeatureCard icon="calculator" title="حسابات دقيقة وفورية" description="حساب الأحمال، التيار، مقاطع الأسلاك، والقواطع بدقة عالية وفقاً للمدخلات." />
                <FeatureCard icon="clipboard" title="تقارير فنية متكاملة" description="توليد تقارير مفصلة قابلة للطباعة تتضمن جميع الحسابات وقائمة المواد." />
                <FeatureCard icon="shield-check" title="التزام بالمعايير الدولية" description="الحسابات مبنية على أسس هندسية ومعايير عالمية لضمان الموثوقية." />
                <FeatureCard icon="cloud" title="مشاريعك آمنة في السحابة" description="احفظ مشاريعك بأمان للوصول إليها من أي مكان وفي أي وقت. (ميزة قادمة)" />
                <FeatureCard icon="cog" title="واجهة عربية وبديهية" description="تصميم بسيط وسهل الاستخدام باللغة العربية لتسهيل العمل على جميع المستخدمين." />
                <FeatureCard icon="bolt" title="كفاءة وسرعة في الإنجاز" description="قلل وقت الحسابات الهندسية بنسبة تصل إلى 80% وركز على مهامك الأهم." />
            </div>
        </div>
      </section>

      <section id="audience" className="py-16 md:py-20 bg-slate-100">
        <div className="container mx-auto px-6">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold">لمن هذا البرنامج؟</h2>
                <p className="text-slate-600 mt-2">مصمم خصيصًا لدعم المحترفين والطلاب في قطاع الكهرباء.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <AudienceCard icon="users" title="المهندسون الكهربائيون" description="لتسريع التصاميم الأولية، التحقق من الحسابات، وإعداد المواصفات الفنية." />
                 <AudienceCard icon="users" title="المقاولون والفنيون" description="لتقدير المواد بدقة، إعداد عروض الأسعار بسرعة، وتخطيط التنفيذ." />
                 <AudienceCard icon="users" title="الطلاب والأكاديميون" description="للتطبيق العملي للمفاهيم النظرية، فهم الأنظمة، والمساعدة في المشاريع." />
            </div>
        </div>
      </section>

      <section id="how-it-works" className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-6">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold">كيف يعمل النظام؟</h2>
                <p className="text-slate-600 mt-2">بأربع خطوات بسيطة، يمكنك إنجاز مشروعك بالكامل.</p>
            </div>
            <div className="max-w-3xl mx-auto grid grid-cols-1 gap-10">
                <Step number="١" title="أدخل معلومات المشروع" description="ابدأ بإضافة التفاصيل الأساسية لمشروعك مثل الاسم، النوع، والجهد المستخدم."/>
                <Step number="٢" title="حدد الأحمال والدوائر" description="أضف جميع الدوائر الكهربائية مع تحديد قدرتها، نوعها، وطول الكابل."/>
                <Step number="٣" title="اضبط الإعدادات المتقدمة" description="تحكم في معاملات الأمان، الطلب، ومواصفات الأسلاك لتناسب متطلباتك."/>
                <Step number="٤" title="احصل على النتائج الفورية" description="يقوم النظام بكافة الحسابات ويقدم لك تقريرًا شاملاً وواضحًا."/>
            </div>
        </div>
      </section>

      <footer className="bg-slate-800 text-white py-6">
          <div className="container mx-auto px-6 text-center text-sm">
              <p>&copy; 2025 فريق Emaar. جميع الحقوق محفوظة.</p>
              <p className="text-slate-400 mt-1">نسخة 1.0.0 - هذا البرنامج للاستخدام الاسترشادي ويُنصح بمراجعة مهندس معتمد.</p>
          </div>
      </footer>
    </div>
  );
};

export default HomePage;