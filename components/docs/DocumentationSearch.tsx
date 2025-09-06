'use client';

import type { ReactElement } from 'react';
import { useState, useRef, useEffect } from 'react';
import { 
  MagnifyingGlassIcon,
  XMarkIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import type { SearchResult } from './types';

interface DocumentationSearchProps {
  onSearch: (query: string) => void;
  results: SearchResult[];
  isSearching: boolean;
  onResultClick: (result: SearchResult) => void;
  query: string;
  onQueryChange: (query: string) => void;
}

export function DocumentationSearch({
  onSearch,
  results,
  isSearching,
  onResultClick,
  query,
  onQueryChange
}: DocumentationSearchProps): ReactElement {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [filters, setFilters] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const availableFilters = [
    { key: 'paragraph', label: 'Content', color: 'blue' },
    { key: 'note', label: 'Notes', color: 'yellow' },
    { key: 'warning', label: 'Warnings', color: 'red' },
    { key: 'important', label: 'Important', color: 'orange' },
    { key: 'table', label: 'Tables', color: 'green' },
    { key: 'equation', label: 'Equations', color: 'purple' }
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length > 2) {
      const timeoutId = setTimeout(() => {
        onSearch(query);
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [query, onSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newQuery = e.target.value;
    onQueryChange(newQuery);
    setIsExpanded(newQuery.length > 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Escape') {
      onQueryChange('');
      setIsExpanded(false);
      inputRef.current?.blur();
    }
  };

  const toggleFilter = (filterKey: string): void => {
    setFilters(prev => {
      const newFilters = new Set(prev);
      if (newFilters.has(filterKey)) {
        newFilters.delete(filterKey);
      } else {
        newFilters.add(filterKey);
      }
      return newFilters;
    });
    
    if (query) {
      onSearch(query);
    }
  };

  const clearSearch = (): void => {
    onQueryChange('');
    setIsExpanded(false);
    inputRef.current?.focus();
  };

  const highlightMatch = (text: string, query: string): ReactElement => {
    if (!query.trim()) return <span>{text}</span>;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <span>
        {parts.map((part, index) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={index} className="bg-yellow-200 font-medium">{part}</mark>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </span>
    );
  };

  return (
    <div ref={containerRef} className="relative max-w-2xl">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="search"
          className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg bg-white placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Search FM Global 8-34 documentation..."
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query && setIsExpanded(true)}
        />
        
        {query && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Filter Pills */}
      {isExpanded && (
        <div className="mt-2 flex flex-wrap gap-2">
          {availableFilters.map(filter => {
            const isActive = filters.has(filter.key);
            const colorClasses = {
              blue: 'bg-blue-100 text-blue-800 border-blue-200',
              yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
              red: 'bg-red-100 text-red-800 border-red-200',
              orange: 'bg-orange-100 text-orange-800 border-orange-200',
              green: 'bg-green-100 text-green-800 border-green-200',
              purple: 'bg-purple-100 text-purple-800 border-purple-200'
            };
            
            return (
              <button
                key={filter.key}
                onClick={() => toggleFilter(filter.key)}
                className={`px-3 py-1 rounded-full border text-sm font-medium transition-colors ${
                  isActive 
                    ? colorClasses[filter.color as keyof typeof colorClasses]
                    : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Search Results Dropdown */}
      {isExpanded && query && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto z-50">
          {isSearching ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No results found for "{query}"
            </div>
          ) : (
            <div>
              <div className="p-2 border-b border-gray-100 bg-gray-50 text-sm text-gray-600">
                Found {results.length} result{results.length !== 1 ? 's' : ''}
              </div>
              {results.map((result, index) => (
                <button
                  key={index}
                  className="w-full text-left p-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-gray-50"
                  onClick={() => onResultClick(result)}
                >
                  <div className="flex items-start">
                    <DocumentTextIcon className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {result.sectionTitle}
                        </h4>
                        <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                          Page {result.pageReference}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {highlightMatch(result.blockContent, query)}
                      </p>
                      <div className="flex items-center mt-2">
                        <div className="h-1 w-16 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${Math.round(result.rank * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 ml-2">
                          {Math.round(result.rank * 100)}% match
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}