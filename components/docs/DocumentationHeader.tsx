'use client';

import type { ReactElement } from 'react';
import { 
  Bars3Icon,
  ArrowLeftIcon,
  LinkIcon,
  PrinterIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import type { Section } from './types';

interface DocumentationHeaderProps {
  currentSection?: Section;
  onMenuToggle: () => void;
}

export function DocumentationHeader({ currentSection, onMenuToggle }: DocumentationHeaderProps): ReactElement {
  const handlePrint = (): void => {
    window.print();
  };

  const handleShare = (): void => {
    if (navigator.share && currentSection) {
      navigator.share({
        title: `FM Global 8-34 - ${currentSection.title}`,
        text: `Section ${currentSection.number}: ${currentSection.title}`,
        url: window.location.href
      }).catch(console.error);
    } else if (currentSection) {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href).then(() => {
        // Could show a toast notification here
        console.log('URL copied to clipboard');
      }).catch(console.error);
    }
  };

  const copyLink = (): void => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      // Could show a toast notification here
      console.log('URL copied to clipboard');
    }).catch(console.error);
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side */}
          <div className="flex items-center">
            <button
              onClick={onMenuToggle}
              className="mr-4 p-2 rounded-lg hover:bg-gray-100 md:hidden"
            >
              <Bars3Icon className="w-5 h-5" />
            </button>

            {currentSection && (
              <div className="flex items-center">
                {/* Breadcrumb */}
                <nav className="flex items-center space-x-2 text-sm">
                  {currentSection.breadcrumbDisplay.map((crumb, index) => (
                    <div key={index} className="flex items-center">
                      {index > 0 && (
                        <ChevronRightIcon className="w-4 h-4 text-gray-400 mx-2" />
                      )}
                      <span className={`${
                        index === currentSection.breadcrumbDisplay.length - 1 
                          ? 'text-gray-900 font-medium' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}>
                        {crumb}
                      </span>
                    </div>
                  ))}
                </nav>
              </div>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-2">
            <button
              onClick={copyLink}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              title="Copy link"
            >
              <LinkIcon className="w-5 h-5" />
            </button>
            
            <button
              onClick={handlePrint}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              title="Print section"
            >
              <PrinterIcon className="w-5 h-5" />
            </button>

            <button
              onClick={handleShare}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              title="Share section"
            >
              <ShareIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Section header */}
        {currentSection && (
          <div className="mt-4">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-baseline">
                  <span className="text-blue-600 font-mono mr-3 text-lg">
                    {currentSection.number}
                  </span>
                  <span>{currentSection.title}</span>
                </h1>
                <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                  <span>Pages {currentSection.pageStart}-{currentSection.pageEnd}</span>
                  <span>•</span>
                  <span className="capitalize">{currentSection.sectionType}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

function ChevronRightIcon({ className }: { className?: string }): ReactElement {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  );
}