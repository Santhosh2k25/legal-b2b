import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSearch } from '../contexts/SearchContext';
import { FileText, Scale, Users, CheckSquare, Loader2 } from 'lucide-react';
import { createPortal } from 'react-dom';

const SearchResults: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { searchResults, isLoading, error, clearSearch } = useSearch();
  const searchInputRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = React.useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    const updatePosition = () => {
      if (searchInputRef.current) {
        const rect = searchInputRef.current.getBoundingClientRect();
        setPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width
        });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'case':
        return <Scale className="w-5 h-5 text-primary-400" />;
      case 'document':
        return <FileText className="w-5 h-5 text-blue-400" />;
      case 'client':
        return <Users className="w-5 h-5 text-green-400" />;
      case 'task':
        return <CheckSquare className="w-5 h-5 text-yellow-400" />;
      default:
        return <FileText className="w-5 h-5 text-gray-400" />;
    }
  };

  const handleResultClick = async (result: any) => {
    try {
      // Clear the search results before navigation
      clearSearch();
      
      // Determine the route based on result type
      let route = '';
      switch (result.type) {
        case 'case':
          route = `/cases/${result.id}`;
          break;
        case 'document':
          route = `/documents/${result.id}`;
          break;
        case 'client':
          route = `/clients/${result.id}`;
          break;
        case 'task':
          route = `/tasks/${result.id}`;
          break;
        default:
          throw new Error(`Invalid result type: ${result.type}`);
      }

      // Ensure we have a valid ID
      if (!result.id) {
        throw new Error('Invalid result: missing ID');
      }

      // Navigate to the route
      navigate(route, { 
        replace: true,
        state: { from: 'search' } // Add state to track navigation source
      });
    } catch (error) {
      console.error('Navigation error:', error);
      // You might want to show an error message to the user here
    }
  };

  const ResultsContent = () => {
    if (isLoading) {
      return (
        <div className="bg-gray-900 rounded-lg shadow-2xl border border-gray-700 py-2">
          <div className="flex items-center justify-center py-2">
            <Loader2 className="w-4 h-4 text-primary-400 animate-spin" />
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-gray-900 rounded-lg shadow-2xl border border-gray-700 py-2">
          <div className="px-4 py-2 text-red-400 text-sm flex items-center space-x-2">
            <span className="text-lg">⚠️</span>
            <span>{error}</span>
          </div>
        </div>
      );
    }

    if (!searchResults.length) {
      return null;
    }

    console.log(searchResults);
    

    return (
      <div className="bg-gray-900 rounded-lg shadow-2xl border border-gray-700 py-2">
        <div className="px-4 py-2 border-b border-gray-700">
          <h3 className="text-sm font-medium text-white flex items-center space-x-2">
            <span>🔍</span>
            <span>{t('search Results')}</span>
          </h3>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {searchResults.map((result, index) => (
            <button
              key={`${result.type}-${index}`}
              onClick={() => handleResultClick(result)}
              className="w-full px-4 py-3 hover:bg-gray-800/50 transition-colors duration-150
              flex items-center space-x-3 text-left border-b border-gray-700 last:border-0"
            >
              {getIcon(result.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">
                  {result.title || result.name}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {result.description || result.email}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <div ref={searchInputRef} className="relative" />
      {createPortal(
        <div
          style={{
            position: 'absolute',
            top: `${position.top}px`,
            left: `${position.left}px`,
            width: `${position.width}px`,
            zIndex: 50
          }}
        >
          <ResultsContent />
        </div>,
        document.body
      )}
    </>
  );
};

export default SearchResults; 