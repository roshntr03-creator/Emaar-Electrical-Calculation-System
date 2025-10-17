
import React from 'react';
import { useLocalization } from '../../contexts/LocalizationContext';
import Button from './Button';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLocalization();

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ar' : 'en';
    setLanguage(newLang);
  };

  return (
    <Button onClick={toggleLanguage} variant="ghost" size="sm">
      {language === 'en' ? 'العربية' : 'English'}
    </Button>
  );
};

export default LanguageSwitcher;
