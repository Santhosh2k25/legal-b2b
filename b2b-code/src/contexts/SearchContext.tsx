import React, { createContext, useContext, useState, useCallback } from 'react';
import { useMongoDB } from '../hooks/useMongoDB';

interface Task {
  id: string;
  title: string;
  description: string;
  userId: string;
  [key: string]: any;
}

interface SearchContextType {
  searchQuery: string;
  searchResults: any[];
  isLoading: boolean;
  error: string | null;
  performSearch: (query: string) => Promise<void>;
  clearSearch: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from different collections
  const { data: cases = [] } = useMongoDB('cases');
  const { data: documents = [] } = useMongoDB('documents');
  const { data: clients = [] } = useMongoDB('clients');
  const { data: tasks = [] } = useMongoDB('tasks');

  const performSearch = useCallback(async (searchText: string) => {
    if (!searchText.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    setSearchQuery(searchText);

    try {
      const searchTerm = searchText.toLowerCase();
      
      // Validate data structure before filtering
      const validCases = Array.isArray(cases) ? cases : [];
      const validDocuments = Array.isArray(documents) ? documents : [];
      const validClients = Array.isArray(clients) ? clients : [];
      const validTasks = Array.isArray(tasks) ? tasks : [];
      
      // Search across different collections with proper error handling
      const results = [
        ...validCases.filter(case_ => 
          case_ && typeof case_ === 'object' && (
            (case_.title && typeof case_.title === 'string' && case_.title.toLowerCase().includes(searchTerm)) ||
            (case_.description && typeof case_.description === 'string' && case_.description.toLowerCase().includes(searchTerm))
          )
        ).map(case_ => ({ ...case_, type: 'case' })),
        
        ...validDocuments.filter(doc => 
          doc && typeof doc === 'object' && (
            (doc.name && typeof doc.name === 'string' && doc.name.toLowerCase().includes(searchTerm)) ||
            (doc.description && typeof doc.description === 'string' && doc.description.toLowerCase().includes(searchTerm))
          )
        ).map(doc => ({ ...doc, type: 'document' })),
        
        ...validClients.filter(client => 
          client && typeof client === 'object' && (
            (client.name && typeof client.name === 'string' && client.name.toLowerCase().includes(searchTerm)) ||
            (client.email && typeof client.email === 'string' && client.email.toLowerCase().includes(searchTerm))
          )
        ).map(client => ({ ...client, type: 'client' })),

        ...validTasks.filter(task => 
          task && typeof task === 'object' && (
            (task.title && typeof task.title === 'string' && task.title.toLowerCase().includes(searchTerm)) ||
            (task.description && typeof task.description === 'string' && task.description.toLowerCase().includes(searchTerm))
          )
        ).map(task => ({ ...task, type: 'task' }))
      ];

      setSearchResults(results);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(`Search failed: ${errorMessage}`);
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [cases, documents, clients, tasks]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setError(null);
  }, []);

  return (
    <SearchContext.Provider value={{
      searchQuery,
      searchResults,
      isLoading,
      error,
      performSearch,
      clearSearch
    }}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}; 