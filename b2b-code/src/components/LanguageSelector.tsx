import React from 'react';
import { useTranslation } from 'react-i18next';
import { languages } from '../i18n/config';
import { Globe, Check } from 'lucide-react';

const LanguageSelector = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
  };

  const currentLanguage = languages.find(lang => lang.code === i18n.language);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 hover:bg-gray-800 rounded-lg"
      >
        <Globe className="w-5 h-5 text-gray-400" />
        <span className="text-gray-300 text-sm hidden sm:inline">
          {currentLanguage?.nativeName || 'Language'}
        </span>
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-[100]"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 py-2 bg-gray-900 rounded-lg shadow-xl border border-gray-800 z-[101]">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-800 transition-colors ${
                  i18n.language === language.code ? 'text-primary-400' : 'text-gray-300'
                }`}
              >
                <div>
                  <span>{language.nativeName}</span>
                  <span className="text-gray-500 ml-2">({language.name})</span>
                </div>
                {i18n.language === language.code && (
                  <Check className="w-4 h-4" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSelector;