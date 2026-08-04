import React, { useState, useCallback } from 'react';
import HomePage from './components/HomePage';
import CalculationForm from './components/CalculationForm';
import ResultsPage from './components/ResultsPage';
import { FormData, CalculationResults } from './types';
import { calculateAll } from './services/calculationService';
import { LocalizationProvider } from './contexts/LocalizationContext';

type View = 'home' | 'form' | 'results';

const AppContent: React.FC = () => {
  const [view, setView] = useState<View>('home');
  const [currentFormData, setCurrentFormData] = useState<FormData | null>(null);
  const [results, setResults] = useState<CalculationResults | null>(null);

  const handleStart = useCallback(() => {
    setCurrentFormData(null);
    setView('form');
  }, []);

  const handleLoadProject = useCallback((formData: FormData) => {
    setCurrentFormData(formData);
    const calculationResults = calculateAll(formData);
    setResults(calculationResults);
    setView('results');
  }, []);

  const handleCalculate = useCallback((formData: FormData) => {
    setCurrentFormData(formData);
    const calculationResults = calculateAll(formData);
    setResults(calculationResults);
    setView('results');
  }, []);
  
  const handleBackToHome = useCallback(() => {
    setResults(null);
    setView('home');
  }, []);

  const handleStartNew = useCallback(() => {
    setResults(null);
    setCurrentFormData(null);
    setView('form');
  }, []);

  const renderView = () => {
    switch (view) {
      case 'form':
        return <CalculationForm initialData={currentFormData} onCalculate={handleCalculate} onBackToHome={handleBackToHome} />;
      case 'results':
        return results && currentFormData && (
          <ResultsPage 
            results={results} 
            formData={currentFormData} 
            onBackToHome={handleBackToHome} 
            onStartNew={handleStartNew} 
          />
        );
      case 'home':
      default:
        return <HomePage onStart={handleStart} onLoadProject={handleLoadProject} />;
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 font-sans">
      <main>{renderView()}</main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LocalizationProvider>
      <AppContent />
    </LocalizationProvider>
  );
};

export default App;
