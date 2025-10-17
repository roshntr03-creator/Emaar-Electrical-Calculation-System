
import React, { useState, useCallback } from 'react';
import HomePage from './components/HomePage';
import CalculationForm from './components/CalculationForm';
import ResultsPage from './components/ResultsPage';
import { FormData, CalculationResults } from './types';
import { calculateAll } from './services/calculationService';

type View = 'home' | 'form' | 'results';

const App: React.FC = () => {
  const [view, setView] = useState<View>('home');
  const [results, setResults] = useState<CalculationResults | null>(null);

  const handleStart = useCallback(() => {
    setView('form');
  }, []);

  const handleCalculate = useCallback((formData: FormData) => {
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
    setView('form');
  }, []);

  const renderView = () => {
    switch (view) {
      case 'form':
        return <CalculationForm onCalculate={handleCalculate} onBackToHome={handleBackToHome} />;
      case 'results':
        return results && <ResultsPage results={results} onBackToHome={handleBackToHome} onStartNew={handleStartNew} />;
      case 'home':
      default:
        return <HomePage onStart={handleStart} />;
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800">
      <main>{renderView()}</main>
    </div>
  );
};

export default App;
