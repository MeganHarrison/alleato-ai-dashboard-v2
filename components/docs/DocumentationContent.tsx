'use client';

import type { ReactElement } from 'react';
import { useState } from 'react';
import { 
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ExclamationCircleIcon,
  DocumentTextIcon,
  TableCellsIcon,
  CalculatorIcon
} from '@heroicons/react/24/outline';
import type { Section, ContentBlock } from './types';

interface DocumentationContentProps {
  section?: Section;
  blocks: ContentBlock[];
  allSections: Section[];
}

interface FigureReferenceProps {
  figureNumber: number;
}

interface TableReferenceProps {
  tableId: string;
}

function FigureReference({ figureNumber }: FigureReferenceProps): ReactElement {
  return (
    <div className="inline-flex items-center px-2 py-1 bg-blue-50 border border-blue-200 rounded text-sm">
      <DocumentTextIcon className="w-4 h-4 mr-1 text-blue-600" />
      <span className="text-blue-700 font-medium">Figure {figureNumber}</span>
    </div>
  );
}

function TableReference({ tableId }: TableReferenceProps): ReactElement {
  return (
    <div className="inline-flex items-center px-2 py-1 bg-green-50 border border-green-200 rounded text-sm">
      <TableCellsIcon className="w-4 h-4 mr-1 text-green-600" />
      <span className="text-green-700 font-medium">{tableId}</span>
    </div>
  );
}

function ContentBlockRenderer({ block }: { block: ContentBlock }): ReactElement {
  const getBlockIcon = (): ReactElement | null => {
    switch (block.blockType) {
      case 'note':
        return <InformationCircleIcon className="w-5 h-5 text-blue-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      case 'important':
        return <ExclamationCircleIcon className="w-5 h-5 text-orange-500" />;
      case 'equation':
        return <CalculatorIcon className="w-5 h-5 text-purple-500" />;
      default:
        return null;
    }
  };

  const getBlockClasses = (): string => {
    const baseClasses = "mb-6 relative";
    
    switch (block.blockType) {
      case 'note':
        return `${baseClasses} bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r`;
      case 'warning':
        return `${baseClasses} bg-red-50 border-l-4 border-red-400 p-4 rounded-r`;
      case 'important':
        return `${baseClasses} bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r`;
      case 'table':
        return `${baseClasses} bg-white border border-gray-200 rounded-lg overflow-hidden`;
      case 'equation':
        return `${baseClasses} bg-gray-50 border border-gray-200 rounded-lg p-4 font-mono`;
      case 'list_item':
        return `${baseClasses} pl-4`;
      default:
        return baseClasses;
    }
  };

  return (
    <div className={getBlockClasses()}>
      {/* Page reference indicator */}
      {block.pageReference && (
        <div className="absolute top-2 right-2 opacity-0 hover:opacity-100 transition-opacity">
          <span className="bg-gray-800 text-white text-xs px-2 py-1 rounded">
            Page {block.pageReference}
          </span>
        </div>
      )}

      {/* Block icon for special types */}
      {(block.blockType === 'note' || block.blockType === 'warning' || block.blockType === 'important') && (
        <div className="flex items-start mb-2">
          {getBlockIcon()}
          <span className="ml-2 font-semibold text-sm uppercase tracking-wide">
            {block.blockType}
          </span>
        </div>
      )}

      {/* Block content */}
      <div 
        className={`prose prose-gray max-w-none ${
          block.blockType === 'equation' ? 'font-mono text-sm' : ''
        }`}
        dangerouslySetInnerHTML={{ __html: block.html }}
      />

      {/* Inline references */}
      {(block.inlineFigures.length > 0 || block.inlineTables.length > 0) && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
          <h4 className="text-sm font-medium text-gray-700 mb-2">References:</h4>
          <div className="flex flex-wrap gap-2">
            {block.inlineFigures.map(figNum => (
              <FigureReference key={figNum} figureNumber={figNum} />
            ))}
            {block.inlineTables.map(tableId => (
              <TableReference key={tableId} tableId={tableId} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SectionNavigation({ sections, currentSectionId }: { sections: Section[], currentSectionId: string }): ReactElement {
  const currentIndex = sections.findIndex(s => s.id === currentSectionId);
  const prevSection = currentIndex > 0 ? sections[currentIndex - 1] : null;
  const nextSection = currentIndex < sections.length - 1 ? sections[currentIndex + 1] : null;

  return (
    <div className="flex justify-between items-center pt-8 mt-8 border-t border-gray-200">
      <div>
        {prevSection && (
          <button className="flex items-center text-blue-600 hover:text-blue-800">
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <div className="text-left">
              <div className="text-sm text-gray-500">Previous</div>
              <div className="font-medium">{prevSection.number} {prevSection.title}</div>
            </div>
          </button>
        )}
      </div>
      
      <div>
        {nextSection && (
          <button className="flex items-center text-blue-600 hover:text-blue-800">
            <div className="text-right">
              <div className="text-sm text-gray-500">Next</div>
              <div className="font-medium">{nextSection.number} {nextSection.title}</div>
            </div>
            <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export function DocumentationContent({ section, blocks, allSections }: DocumentationContentProps): ReactElement {
  const [showMetadata, setShowMetadata] = useState<boolean>(false);

  if (!section) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Section Selected</h3>
          <p className="text-gray-500">Choose a section from the sidebar to view its content.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <article className="max-w-4xl mx-auto px-6 py-8">
        {/* Content blocks */}
        <div className="space-y-6">
          {blocks.length === 0 ? (
            <div className="text-center py-12">
              <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Content Available</h3>
              <p className="text-gray-500">
                This section's content is being processed. Please check back later.
              </p>
            </div>
          ) : (
            blocks.map(block => (
              <ContentBlockRenderer key={block.id} block={block} />
            ))
          )}
        </div>

        {/* Section metadata toggle */}
        {blocks.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => setShowMetadata(!showMetadata)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              {showMetadata ? 'Hide' : 'Show'} section metadata
            </button>
            
            {showMetadata && (
              <div className="mt-4 bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Section Information</h4>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="font-medium text-gray-700">Section ID</dt>
                    <dd className="text-gray-600 font-mono">{section.id}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-700">Section Number</dt>
                    <dd className="text-gray-600 font-mono">{section.number}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-700">Page Range</dt>
                    <dd className="text-gray-600">{section.pageStart}-{section.pageEnd}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-700">Content Blocks</dt>
                    <dd className="text-gray-600">{blocks.length}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="font-medium text-gray-700">Section Path</dt>
                    <dd className="text-gray-600 font-mono">
                      {section.sectionPath.join(' > ')}
                    </dd>
                  </div>
                </dl>
              </div>
            )}
          </div>
        )}

        {/* Section navigation */}
        <SectionNavigation sections={allSections} currentSectionId={section.id} />
      </article>
    </div>
  );
}