'use client';

import type { ReactElement } from 'react';
import { useState, useMemo } from 'react';
import { 
  ChevronRightIcon, 
  ChevronDownIcon,
  DocumentTextIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import type { Section } from './types';

interface DocumentationSidebarProps {
  sections: Section[];
  currentSectionId: string;
  onSectionSelect: (sectionId: string) => void;
  collapsed: boolean;
  onToggle: () => void;
}

interface SectionTreeNode {
  section: Section;
  children: SectionTreeNode[];
  isExpanded: boolean;
}

export function DocumentationSidebar({
  sections,
  currentSectionId,
  onSectionSelect,
  collapsed,
  onToggle
}: DocumentationSidebarProps): ReactElement {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['sec-1-0', 'sec-2-0', 'sec-3-0']));

  const sectionTree = useMemo(() => {
    const buildTree = (parentId: string | null): SectionTreeNode[] => {
      return sections
        .filter(section => section.parentId === parentId)
        .sort((a, b) => a.sortKey - b.sortKey)
        .map(section => ({
          section,
          children: buildTree(section.id),
          isExpanded: expandedSections.has(section.id)
        }));
    };
    return buildTree(null);
  }, [sections, expandedSections]);

  const toggleSection = (sectionId: string): void => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const renderSectionNode = (node: SectionTreeNode, depth: number = 0): ReactElement => {
    const hasChildren = node.children.length > 0;
    const isActive = node.section.id === currentSectionId;
    const isExpanded = expandedSections.has(node.section.id);

    return (
      <div key={node.section.id}>
        <div
          className={`
            flex items-center px-3 py-2 text-sm cursor-pointer transition-colors duration-200
            ${isActive 
              ? 'bg-blue-100 text-blue-900 border-r-2 border-blue-500' 
              : 'text-gray-700 hover:bg-gray-100'
            }
          `}
          style={{ paddingLeft: `${12 + depth * 20}px` }}
          onClick={() => onSectionSelect(node.section.id)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleSection(node.section.id);
              }}
              className="mr-2 p-1 rounded hover:bg-gray-200"
            >
              {isExpanded ? (
                <ChevronDownIcon className="w-4 h-4" />
              ) : (
                <ChevronRightIcon className="w-4 h-4" />
              )}
            </button>
          )}
          
          {!hasChildren && (
            <div className="w-6 mr-2" />
          )}

          <DocumentTextIcon className="w-4 h-4 mr-2 flex-shrink-0" />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center">
              <span className="text-xs font-mono text-blue-600 mr-2 flex-shrink-0">
                {node.section.number}
              </span>
              <span className="truncate font-medium">
                {node.section.title}
              </span>
            </div>
            {depth === 0 && (
              <div className="text-xs text-gray-500 mt-0.5">
                Pages {node.section.pageStart}-{node.section.pageEnd}
              </div>
            )}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {node.children.map(child => renderSectionNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (collapsed) {
    return (
      <div className="fixed left-0 top-0 w-16 h-full bg-white border-r border-gray-200 z-40">
        <div className="p-4">
          <button
            onClick={onToggle}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
          >
            <Bars3Icon className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed left-0 top-0 w-80 h-full bg-white border-r border-gray-200 z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div>
          <h1 className="text-lg font-bold text-gray-900">FM Global 8-34</h1>
          <p className="text-sm text-gray-600">ASRS Protection Guide</p>
        </div>
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-gray-200"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Quick Stats */}
      <div className="p-4 border-b border-gray-200 bg-blue-50">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-blue-900">{sections.length}</div>
            <div className="text-xs text-blue-600">Sections</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-900">47</div>
            <div className="text-xs text-blue-600">Tables</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-900">15</div>
            <div className="text-xs text-blue-600">Figures</div>
          </div>
        </div>
      </div>

      {/* Navigation Tree */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2">
            Table of Contents
          </div>
          {sectionTree.map(node => renderSectionNode(node))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="text-xs text-gray-500 text-center">
          <div>FM Global Data Sheet</div>
          <div>July 2024 Edition</div>
        </div>
      </div>
    </div>
  );
}